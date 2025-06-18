import { io } from 'socket.io-client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Socket Manager - Singleton pattern for managing socket connection
 * This keeps the socket instance outside of Redux to avoid serialization issues
 */
class SocketManager {
    constructor() {
        this.socket = null;
        this.isInitialized = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.reconnectTimer = null;
        this.connectionPromise = null;
        this.heartbeatInterval = null;
        this.lastPong = null;
        this.connectionStatus = 'disconnected';
        this.eventQueue = [];
    }

    /**
     * Initialize socket connection with exponential backoff
     */
    initialize(options = {}) {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        if (this.isInitialized && this.socket && this.socket.connected) {
            return Promise.resolve(this.socket);
        }

        this.connectionPromise = this._createConnection(options);
        return this.connectionPromise;
    }

    /**
     * Create socket connection with comprehensive error handling
     */
    _createConnection(options = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.connectionStatus = 'connecting';

                const socketOptions = {
                    transports: ['websocket', 'polling'],
                    timeout: 15000,
                    reconnection: false, // We'll handle reconnection manually
                    forceNew: true,
                    ...options,
                };

                this.socket = io(API_ENDPOINTS.SOCKET_URL, socketOptions);

                // Set up connection event handlers
                this.socket.once('connect', () => {
                    this.connectionStatus = 'connected';
                    this.isInitialized = true;
                    this.reconnectAttempts = 0;
                    this.connectionPromise = null;
                    this._startHeartbeat();
                    this._processEventQueue();
                    resolve(this.socket);
                });

                this.socket.once('connect_error', (error) => {
                    this.connectionStatus = 'disconnected';
                    this.connectionPromise = null;
                    console.error('Socket connection error:', error);

                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this._scheduleReconnect();
                        reject(new Error(`Connection failed, scheduling reconnect attempt ${this.reconnectAttempts + 1}`));
                    } else {
                        reject(new Error('Max reconnection attempts reached'));
                    }
                });

                this.socket.on('disconnect', (reason) => {
                    this.connectionStatus = 'disconnected';
                    this._stopHeartbeat();
                    console.log('Socket disconnected:', reason);

                    if (reason === 'io server disconnect') {
                        // Server initiated disconnect, don't reconnect immediately
                        return;
                    }

                    // Try to reconnect for other reasons
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this._scheduleReconnect();
                    }
                });

                // Handle pong responses for heartbeat
                this.socket.on('pong', () => {
                    this.lastPong = Date.now();
                });

            } catch (error) {
                this.connectionStatus = 'disconnected';
                this.connectionPromise = null;
                console.error('Failed to create socket connection:', error);
                reject(error);
            }
        });
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    _scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectDelay
        );

        this.reconnectAttempts++;
        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.initialize().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    /**
     * Start heartbeat to detect connection issues
     */
    _startHeartbeat() {
        this._stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('ping');

                // Check if we received a pong recently
                if (this.lastPong && Date.now() - this.lastPong > 30000) {
                    console.warn('Heartbeat timeout, disconnecting socket');
                    this.socket.disconnect();
                }
            }
        }, 15000);
    }

    /**
     * Stop heartbeat
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Process queued events when connection is restored
     */
    _processEventQueue() {
        while (this.eventQueue.length > 0) {
            const queuedEvent = this.eventQueue.shift();
            this.emit(queuedEvent.event, queuedEvent.data);
        }
    }

    /**
     * Get current socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Check if socket is connected
     */
    isConnected() {
        return this.socket && this.socket.connected;
    }

    /**
     * Emit an event with queuing support
     */
    emit(event, data, options = {}) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
            return true;
        }

        // Queue non-critical events for later
        if (options.queue !== false && this.eventQueue.length < 100) {
            this.eventQueue.push({ event, data, timestamp: Date.now() });
            console.log(`Queued event ${event} (${this.eventQueue.length} events in queue)`);

            // Try to reconnect if not already attempting
            if (this.connectionStatus === 'disconnected' && !this.connectionPromise) {
                this.initialize().catch(error => {
                    console.error('Auto-reconnect failed:', error);
                });
            }

            return true;
        }

        console.warn(`Cannot emit ${event}: socket not connected and queuing disabled`);
        return false;
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);

            // Store listener for cleanup
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);

            // Remove from stored listeners
            if (this.listeners.has(event)) {
                const callbacks = this.listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }

    /**
     * Disconnect socket and clean up all resources
     */
    disconnect() {
        // Clear reconnection timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Stop heartbeat
        this._stopHeartbeat();

        // Clear connection promise
        this.connectionPromise = null;

        if (this.socket) {
            // Remove all listeners
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    this.socket.off(event, callback);
                });
            });
            this.listeners.clear();

            this.socket.disconnect();
            this.socket = null;
        }

        // Reset state
        this.isInitialized = false;
        this.connectionStatus = 'disconnected';
        this.reconnectAttempts = 0;
        this.eventQueue = [];
        this.lastPong = null;
    }

    /**
     * Reconnect socket
     */
    reconnect() {
        if (this.socket) {
            this.socket.connect();
        }
    }

    /**
     * Get connection state with detailed status
     */
    getConnectionState() {
        return this.connectionStatus;
    }

    /**
     * Get connection statistics
     */
    getConnectionStats() {
        return {
            status: this.connectionStatus,
            reconnectAttempts: this.reconnectAttempts,
            queuedEvents: this.eventQueue.length,
            lastPong: this.lastPong,
            isInitialized: this.isInitialized,
            hasActiveSocket: !!this.socket,
            socketConnected: this.socket?.connected || false,
        };
    }

    /**
     * Clear event queue
     */
    clearEventQueue() {
        this.eventQueue = [];
    }

    /**
     * Force reconnection (resets attempt counter)
     */
    forceReconnect() {
        this.reconnectAttempts = 0;
        this.disconnect();
        return this.initialize();
    }

    /**
     * Set max reconnection attempts
     */
    setMaxReconnectAttempts(max) {
        this.maxReconnectAttempts = Math.max(0, max);
    }

    /**
     * Check if socket is in a connecting state
     */
    isConnecting() {
        return this.connectionStatus === 'connecting';
    }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager;