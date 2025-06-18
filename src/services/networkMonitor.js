/**
 * Network Monitor - Monitors network connectivity and provides callbacks
 */
class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = {
            online: [],
            offline: [],
            statusChange: []
        };
        this.isMonitoring = false;
        this.connectionCheckInterval = null;
        this.connectionCheckUrl = '/api/health';
        this.connectionCheckTimeout = 5000;
        this.lastConnectionCheck = null;
        this.connectionCheckResults = [];
        this.maxConnectionCheckResults = 10;
    }

    /**
     * Start monitoring network status
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;

        // Listen to browser online/offline events
        window.addEventListener('online', this._handleOnline.bind(this));
        window.addEventListener('offline', this._handleOffline.bind(this));

        // Start periodic connection checks
        this._startConnectionChecks();

        console.log('Network monitoring started');
    }

    /**
     * Stop monitoring network status
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;

        // Remove event listeners
        window.removeEventListener('online', this._handleOnline.bind(this));
        window.removeEventListener('offline', this._handleOffline.bind(this));

        // Stop connection checks
        this._stopConnectionChecks();

        console.log('Network monitoring stopped');
    }

    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * Get current online status
     */
    getOnlineStatus() {
        return this.isOnline;
    }

    /**
     * Get connection quality metrics
     */
    getConnectionQuality() {
        if (this.connectionCheckResults.length === 0) {
            return {
                quality: 'unknown',
                averageLatency: null,
                successRate: null,
                lastCheck: this.lastConnectionCheck
            };
        }

        const successful = this.connectionCheckResults.filter(result => result.success);
        const successRate = successful.length / this.connectionCheckResults.length;
        const averageLatency = successful.length > 0
            ? successful.reduce((sum, result) => sum + result.latency, 0) / successful.length
            : null;

        let quality = 'poor';
        if (successRate >= 0.9 && averageLatency < 100) {
            quality = 'excellent';
        } else if (successRate >= 0.8 && averageLatency < 300) {
            quality = 'good';
        } else if (successRate >= 0.6 && averageLatency < 1000) {
            quality = 'fair';
        }

        return {
            quality,
            averageLatency,
            successRate,
            lastCheck: this.lastConnectionCheck,
            recentChecks: this.connectionCheckResults.slice(-5)
        };
    }

    /**
     * Force a connection check
     */
    async checkConnection() {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.connectionCheckTimeout);

            const response = await fetch(this.connectionCheckUrl, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;
            const success = response.ok;

            this._recordConnectionCheck({ success, latency, status: response.status });

            return { success, latency, status: response.status };
        } catch (error) {
            const latency = Date.now() - startTime;

            this._recordConnectionCheck({
                success: false,
                latency,
                error: error.name === 'AbortError' ? 'timeout' : error.message
            });

            return { success: false, latency, error: error.message };
        }
    }

    /**
     * Handle online event
     */
    _handleOnline() {
        const wasOffline = !this.isOnline;
        this.isOnline = true;
        this.lastConnectionCheck = Date.now();

        if (wasOffline) {
            console.log('Network connection restored');
            this._notifyListeners('online');
            this._notifyListeners('statusChange', { online: true });
        }
    }

    /**
     * Handle offline event
     */
    _handleOffline() {
        const wasOnline = this.isOnline;
        this.isOnline = false;
        this.lastConnectionCheck = Date.now();

        if (wasOnline) {
            console.log('Network connection lost');
            this._notifyListeners('offline');
            this._notifyListeners('statusChange', { online: false });
        }
    }

    /**
     * Start periodic connection checks
     */
    _startConnectionChecks() {
        this._stopConnectionChecks();

        // Initial check
        this.checkConnection();

        // Periodic checks every 30 seconds
        this.connectionCheckInterval = setInterval(() => {
            this.checkConnection();
        }, 30000);
    }

    /**
     * Stop periodic connection checks
     */
    _stopConnectionChecks() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
        }
    }

    /**
     * Record connection check result
     */
    _recordConnectionCheck(result) {
        this.lastConnectionCheck = Date.now();
        this.connectionCheckResults.push({
            ...result,
            timestamp: this.lastConnectionCheck
        });

        // Keep only the most recent results
        if (this.connectionCheckResults.length > this.maxConnectionCheckResults) {
            this.connectionCheckResults.shift();
        }

        // Update online status based on connection check (be more conservative)
        const wasOnline = this.isOnline;

        // Only mark as offline if multiple consecutive failures
        const recentFailures = this.connectionCheckResults
            .slice(-3)
            .filter(r => !r.success).length;

        if (result.success) {
            this.isOnline = true;
        } else if (recentFailures >= 2) {
            this.isOnline = false;
        }

        if (wasOnline !== this.isOnline) {
            this._notifyListeners(this.isOnline ? 'online' : 'offline');
            this._notifyListeners('statusChange', { online: this.isOnline });
        }
    }

    /**
     * Notify listeners of events
     */
    _notifyListeners(event, data = null) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in network monitor listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get network information (if available)
     */
    getNetworkInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    /**
     * Check if connection is slow
     */
    isSlowConnection() {
        const networkInfo = this.getNetworkInfo();
        if (networkInfo) {
            return networkInfo.effectiveType === 'slow-2g' ||
                networkInfo.effectiveType === '2g' ||
                networkInfo.saveData === true;
        }

        const quality = this.getConnectionQuality();
        return quality.quality === 'poor' ||
            (quality.averageLatency && quality.averageLatency > 1000);
    }
}

// Export singleton instance
export const networkMonitor = new NetworkMonitor();
export default networkMonitor;