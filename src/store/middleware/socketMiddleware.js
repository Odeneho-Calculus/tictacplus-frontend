import { socketManager } from '../../services/socketManager';
import { networkMonitor } from '../../services/networkMonitor';
import {
    setConnecting,
    setConnected,
    setConnectionError,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    setAuthenticated,
    setAuthError,
    addMessage,
    addEvent,
    addError,
    logSocketEvent,
    logSocketError,
} from '../slices/socketSlice';
import {
    updateGameState,
    setError as setGameError,
    setMatchmaking,
} from '../slices/gameSlice';
import {
    showError,
    showSuccess,
    showInfo,
    showWarning,
} from '../slices/uiSlice';
import { SOCKET_EVENTS, API_ENDPOINTS } from '../../utils/constants';

// Set up socket event handlers
const setupSocketEventHandlers = (dispatch) => {
    // Only set up handlers once
    if (socketManager.listenersSet) return;

    // Connection event handlers
    socketManager.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Socket connected');
        dispatch(setConnected(true));
        dispatch(resetReconnectAttempts());
        dispatch(logSocketEvent(SOCKET_EVENTS.CONNECT));
        dispatch(showSuccess('Connected to server'));
    });

    socketManager.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('Socket disconnected:', reason);
        dispatch(setConnected(false));
        dispatch(logSocketEvent(SOCKET_EVENTS.DISCONNECT, { reason }));

        if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't auto-reconnect
            dispatch(showWarning('Server disconnected'));
        }
    });

    socketManager.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        console.error('Socket connection error:', error);
        dispatch(setConnectionError(error.message));
        dispatch(incrementReconnectAttempts());
        dispatch(logSocketError(error, { event: SOCKET_EVENTS.CONNECT_ERROR }));
        dispatch(showError('Connection failed'));
    });

    // Authentication events
    socketManager.on(SOCKET_EVENTS.AUTHENTICATED, (data) => {
        console.log('Socket authenticated:', data);
        dispatch(setAuthenticated(true));
        dispatch(logSocketEvent(SOCKET_EVENTS.AUTHENTICATED, data));
    });

    socketManager.on(SOCKET_EVENTS.AUTH_ERROR, (error) => {
        console.error('Socket auth error:', error);
        dispatch(setAuthError(error.message));
        dispatch(logSocketError(error, { event: SOCKET_EVENTS.AUTH_ERROR }));
        dispatch(showError('Authentication failed'));
    });

    // Game events
    socketManager.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data) => {
        console.log('Game state update:', data);

        // Handle different response formats
        const gameState = data.game || data;

        dispatch(updateGameState(gameState));
        dispatch(logSocketEvent(SOCKET_EVENTS.GAME_STATE_UPDATE, gameState));

        // If we're not already on the game page, navigate there
        const gameId = gameState.gameId;
        if (gameId && !window.location.pathname.includes(`/game/${gameId}`)) {
            console.log('Navigating to game from game state update:', gameId);
            setTimeout(() => {
                window.location.href = `/game/${gameId}`;
            }, 500);
        }
    });

    socketManager.on(SOCKET_EVENTS.MOVE_MADE, (moveData) => {
        console.log('Move made:', moveData);
        dispatch(logSocketEvent(SOCKET_EVENTS.MOVE_MADE, moveData));
    });

    socketManager.on(SOCKET_EVENTS.INVALID_MOVE, (error) => {
        console.error('Invalid move:', error);
        dispatch(setGameError(error.message));
        dispatch(logSocketError(error, { event: SOCKET_EVENTS.INVALID_MOVE }));
        dispatch(showError('Invalid move: ' + error.message));
    });

    socketManager.on(SOCKET_EVENTS.GAME_START, (gameData) => {
        console.log('Game started:', gameData);
        dispatch(logSocketEvent(SOCKET_EVENTS.GAME_START, gameData));
        dispatch(showInfo('Game started!'));
    });

    socketManager.on(SOCKET_EVENTS.GAME_END, (gameResult) => {
        console.log('Game ended:', gameResult);
        dispatch(logSocketEvent(SOCKET_EVENTS.GAME_END, gameResult));
        dispatch(showInfo('Game ended'));
    });

    // Player events
    socketManager.on(SOCKET_EVENTS.PLAYER_JOINED, (player) => {
        console.log('Player joined:', player);
        dispatch(logSocketEvent(SOCKET_EVENTS.PLAYER_JOINED, player));
        dispatch(showInfo(`${player.name} joined the game`));
    });

    socketManager.on(SOCKET_EVENTS.PLAYER_LEFT, (player) => {
        console.log('Player left:', player);
        dispatch(logSocketEvent(SOCKET_EVENTS.PLAYER_LEFT, player));
        dispatch(showInfo(`${player.name} left the game`));
    });

    socketManager.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (player) => {
        console.log('Player disconnected:', player);
        dispatch(logSocketEvent(SOCKET_EVENTS.PLAYER_DISCONNECTED, player));
        dispatch(showInfo(`${player.name} disconnected`));
    });

    socketManager.on(SOCKET_EVENTS.PLAYER_RECONNECTED, (player) => {
        console.log('Player reconnected:', player);
        dispatch(logSocketEvent(SOCKET_EVENTS.PLAYER_RECONNECTED, player));
        dispatch(showInfo(`${player.name} reconnected`));
    });

    // Chat events
    socketManager.on(SOCKET_EVENTS.MESSAGE_RECEIVED, (message) => {
        console.log('Message received:', message);
        dispatch(addMessage(message));
        dispatch(logSocketEvent(SOCKET_EVENTS.MESSAGE_RECEIVED, message));
    });

    // Matchmaking events
    socketManager.on(SOCKET_EVENTS.MATCH_FOUND, (matchData) => {
        console.log('Match found:', matchData);
        dispatch(logSocketEvent(SOCKET_EVENTS.MATCH_FOUND, matchData));

        try {
            // Update game state with the match data
            if (matchData && matchData.data && matchData.data.game) {
                const gameData = matchData.data.game;
                console.log('Match found with game data:', gameData);

                // Update the game state with the new game data
                dispatch(updateGameState(gameData));

                // Set matchmaking to false since we found a match
                dispatch(setMatchmaking(false));

                // Store the gameId in localStorage so we can redirect to it from any component
                if (gameData.gameId) {
                    console.log('Setting pendingGameRedirect with ID:', gameData.gameId);
                    localStorage.setItem('pendingGameRedirect', gameData.gameId);

                    // Dispatch a custom action that components can listen for
                    dispatch({ type: 'game/matchFoundRedirect', payload: gameData.gameId });

                    // Also dispatch a DOM event for components that use event listeners
                    try {
                        const customEvent = new CustomEvent('game/matchFoundRedirect', {
                            detail: { type: 'game/matchFoundRedirect', payload: gameData.gameId }
                        });
                        console.log('Dispatching custom event for match found');
                        window.dispatchEvent(customEvent);
                    } catch (eventError) {
                        console.error('Error dispatching custom event:', eventError);
                    }

                    // Force a UI update to trigger the useEffect in the Home component
                    dispatch(showSuccess(`Match found! Game ID: ${gameData.gameId}`));

                    // As a fallback, try direct navigation after a short delay
                    setTimeout(() => {
                        if (localStorage.getItem('pendingGameRedirect') === gameData.gameId) {
                            console.log('Fallback: Still have pending redirect, trying again');
                            const customEvent = new CustomEvent('game/matchFoundRedirect', {
                                detail: { type: 'game/matchFoundRedirect', payload: gameData.gameId }
                            });
                            window.dispatchEvent(customEvent);
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error handling matchFound event:', error);
            dispatch(showError('Error handling match found event'));
        }
    });

    // Also listen for the 'matchFound' event (backend uses this format)
    socketManager.on('matchFound', (matchData) => {
        console.log('matchFound event received:', matchData);
        dispatch(logSocketEvent('matchFound', matchData));

        try {
            // Update game state with the match data
            if (matchData && matchData.data && matchData.data.game) {
                const gameData = matchData.data.game;
                console.log('Match found with game data:', gameData);

                // Update the game state with the new game data
                dispatch(updateGameState(gameData));

                // Set matchmaking to false since we found a match
                dispatch(setMatchmaking(false));

                // Store the gameId in localStorage so we can redirect to it from any component
                if (gameData.gameId) {
                    console.log('Setting pendingGameRedirect with ID:', gameData.gameId);
                    localStorage.setItem('pendingGameRedirect', gameData.gameId);

                    // Dispatch a custom action that components can listen for
                    dispatch({ type: 'game/matchFoundRedirect', payload: gameData.gameId });

                    // Also dispatch a DOM event for components that use event listeners
                    try {
                        const customEvent = new CustomEvent('game/matchFoundRedirect', {
                            detail: { type: 'game/matchFoundRedirect', payload: gameData.gameId }
                        });
                        console.log('Dispatching custom event for match found');
                        window.dispatchEvent(customEvent);
                    } catch (eventError) {
                        console.error('Error dispatching custom event:', eventError);
                    }

                    // Force a UI update to trigger the useEffect in the Home component
                    dispatch(showSuccess(`Match found! Game ID: ${gameData.gameId}`));

                    // Automatically join the game room via socket
                    socketManager.emit('join_game', { gameId: gameData.gameId });
                    console.log('Automatically joining game room:', gameData.gameId);

                    // Use window.location for direct navigation as a fallback
                    // This is more reliable than React Router navigation in some cases
                    setTimeout(() => {
                        if (localStorage.getItem('pendingGameRedirect') === gameData.gameId) {
                            console.log('Fallback: Using direct navigation to game page');
                            window.location.href = `/game/${gameData.gameId}`;
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error handling matchFound event:', error);
            dispatch(showError('Error handling match found event'));
        }
    });

    socketManager.on(SOCKET_EVENTS.MATCH_CANCELLED, (reason) => {
        console.log('Match cancelled:', reason);
        dispatch(logSocketEvent(SOCKET_EVENTS.MATCH_CANCELLED, { reason }));
        dispatch(showInfo('Match cancelled: ' + reason));
    });

    socketManager.on(SOCKET_EVENTS.MATCH_ERROR, (error) => {
        console.error('Match error:', error);
        dispatch(logSocketError(error, { event: SOCKET_EVENTS.MATCH_ERROR }));
        dispatch(showError('Matchmaking error: ' + error.message));
    });

    // Error events
    socketManager.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error('Socket error:', error);
        dispatch(addError({
            error: error.message || error,
            timestamp: Date.now(),
        }));
        dispatch(showError('Server error: ' + (error.message || error)));
    });

    socketManager.on(SOCKET_EVENTS.GAME_ERROR, (error) => {
        console.error('Game error:', error);
        dispatch(setGameError(error.message));
        dispatch(logSocketError(error, { event: SOCKET_EVENTS.GAME_ERROR }));
        dispatch(showError('Game error: ' + error.message));
    });

    // Mark handlers as set
    socketManager.listenersSet = true;
};

// Socket middleware
export const socketMiddleware = (store) => (next) => (action) => {
    const { dispatch, getState } = store;

    // Handle socket initialization
    if (action.type === 'socket/initialize') {
        const { socket: socketState } = getState();

        // Don't initialize if already connected or connecting
        if (socketState.isConnected || socketState.isConnecting) {
            return next(action);
        }

        dispatch(setConnecting(true));
        dispatch(logSocketEvent('INITIALIZING'));

        // Start network monitoring
        if (!networkMonitor.isMonitoring) {
            networkMonitor.startMonitoring();

            // Listen for network changes
            networkMonitor.addEventListener('online', () => {
                console.log('Network online - attempting to reconnect socket');
                if (!socketManager.isConnected()) {
                    socketManager.initialize().catch(error => {
                        console.error('Auto-reconnect on network restore failed:', error);
                    });
                }
            });

            networkMonitor.addEventListener('offline', () => {
                console.log('Network appears offline - monitoring socket status');
                // Don't immediately disconnect - let socket manager handle it
            });
        }

        // Create socket connection using enhanced socket manager
        socketManager.initialize({
            transports: ['websocket', 'polling'],
            timeout: 15000,
            forceNew: true,
        }).then(socket => {
            console.log('Socket initialized successfully');
            dispatch(setConnecting(false));
            dispatch(setConnected(true));
            dispatch(resetReconnectAttempts());
            dispatch(logSocketEvent('SOCKET_INITIALIZED'));
            dispatch(showSuccess('Connected to server'));

            // Set up event handlers
            setupSocketEventHandlers(dispatch);

            // Authenticate socket if user is logged in
            const { auth } = getState();
            if (auth.isAuthenticated && auth.token) {
                console.log('Authenticating socket connection...');
                socketManager.emit('authenticate', { token: auth.token });
            }

        }).catch(error => {
            console.error('Socket initialization failed:', error);
            dispatch(setConnecting(false));
            dispatch(setConnectionError(error.message));
            dispatch(logSocketError(error, { event: 'INITIALIZATION_FAILED' }));
            dispatch(showError('Failed to connect to server'));
        });
    }

    // Handle socket disconnect
    if (action.type === 'socket/disconnect') {
        socketManager.disconnect();
        dispatch(setConnected(false));
        dispatch(logSocketEvent('MANUAL_DISCONNECT'));
    }

    // Handle socket emit actions
    if (action.type?.startsWith('socket/emit/')) {
        if (socketManager.isConnected()) {
            const eventType = action.type.replace('socket/emit/', '');
            const eventData = action.payload;

            // Check if this is a matchmaking or online game action that requires authentication
            const requiresAuth = [
                SOCKET_EVENTS.FIND_MATCH,
                'findMatch',
                SOCKET_EVENTS.JOIN_GAME,
                'joinGame',
                SOCKET_EVENTS.MAKE_MOVE,
                'makeMove'
            ].includes(eventType);

            // Get auth state from store
            const { auth } = getState();

            // If action requires auth but user is not authenticated, show error and don't emit
            if (requiresAuth && (!auth.isAuthenticated || !auth.user)) {
                console.warn(`Cannot emit ${eventType}: user not authenticated`);
                dispatch(showError('You must be logged in to perform this action'));
                return next(action);
            }

            try {
                const success = socketManager.emit(eventType, eventData);
                if (success) {
                    dispatch(logSocketEvent(`EMIT_${eventType.toUpperCase()}`, eventData));
                } else {
                    dispatch(showError('Not connected to server'));
                }
            } catch (error) {
                console.error(`Failed to emit ${eventType}:`, error);
                dispatch(logSocketError(error, {
                    context: 'emit',
                    eventType,
                    eventData
                }));
            }
        } else {
            console.warn(`Cannot emit ${action.type}: socket not connected`);
            dispatch(showError('Not connected to server'));
        }
    }

    return next(action);
};

// Action creators for socket operations
export const initializeSocket = () => ({ type: 'socket/initialize' });
export const disconnectSocket = () => ({ type: 'socket/disconnect' });

// Socket emit action creators
export const emitSocketEvent = (eventType, data) => ({
    type: `socket/emit/${eventType}`,
    payload: data,
});

// Specific emit actions
export const joinGame = (gameId) => emitSocketEvent(SOCKET_EVENTS.JOIN_GAME, { gameId });
export const leaveGame = (gameId) => emitSocketEvent(SOCKET_EVENTS.LEAVE_GAME, { gameId });
export const makeMove = (gameId, position) => emitSocketEvent(SOCKET_EVENTS.MAKE_MOVE, { gameId, position });
export const sendMessage = (message) => emitSocketEvent(SOCKET_EVENTS.SEND_MESSAGE, message);
export const findMatch = (preferences) => emitSocketEvent(SOCKET_EVENTS.FIND_MATCH, preferences);
export const cancelMatch = () => emitSocketEvent(SOCKET_EVENTS.MATCH_CANCELLED);
export const createRoom = (roomConfig) => emitSocketEvent(SOCKET_EVENTS.CREATE_ROOM, roomConfig);
export const joinRoom = (roomId) => emitSocketEvent(SOCKET_EVENTS.JOIN_ROOM, { roomId });