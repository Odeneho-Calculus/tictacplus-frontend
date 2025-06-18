import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  initializeSocket,
  disconnectSocket,
  emitSocketEvent,
} from '../store/middleware/socketMiddleware';
import {
  selectSocket,
  selectIsConnected,
  selectIsConnecting,
  selectConnectionError,
} from '../store/slices/socketSlice';

/**
 * Custom hook for managing socket connection and operations
 */
export const useSocket = () => {
  const dispatch = useDispatch();

  // Socket state from Redux
  const socketState = useSelector(selectSocket);
  const isConnected = useSelector(selectIsConnected);
  const isConnecting = useSelector(selectIsConnecting);
  const connectionError = useSelector(selectConnectionError);

  // Initialize socket connection on mount
  useEffect(() => {
    if (!isConnected && !isConnecting && !connectionError) {
      dispatch(initializeSocket());
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        dispatch(disconnectSocket());
      }
    };
  }, [dispatch, isConnected, isConnecting, connectionError]);

  // Socket operations
  const connect = useCallback(() => {
    if (!isConnected && !isConnecting) {
      dispatch(initializeSocket());
    }
  }, [dispatch, isConnected, isConnecting]);

  const disconnect = useCallback(() => {
    if (isConnected) {
      dispatch(disconnectSocket());
    }
  }, [dispatch, isConnected]);

  const emit = useCallback((eventType, data) => {
    if (isConnected) {
      dispatch(emitSocketEvent(eventType, data));
    } else {
      console.warn('Cannot emit event: socket not connected');
    }
  }, [dispatch, isConnected]);

  // Convenience methods for common operations
  const joinGame = useCallback((gameId) => {
    emit('joinGame', { gameId });
  }, [emit]);

  const leaveGame = useCallback((gameId) => {
    emit('leaveGame', { gameId });
  }, [emit]);

  const makeMove = useCallback((gameId, position) => {
    emit('makeMove', { gameId, position });
  }, [emit]);

  const sendMessage = useCallback((message) => {
    emit('sendMessage', message);
  }, [emit]);

  const findMatch = useCallback((preferences = {}) => {
    emit('findMatch', preferences);
  }, [emit]);

  const cancelMatch = useCallback(() => {
    emit('cancelMatch');
  }, [emit]);

  return {
    // State
    socket: socketState.socket,
    isConnected,
    isConnecting,
    connectionError,

    // Operations
    connect,
    disconnect,
    emit,

    // Game operations
    joinGame,
    leaveGame,
    makeMove,
    sendMessage,
    findMatch,
    cancelMatch,
  };
};

export default useSocket;