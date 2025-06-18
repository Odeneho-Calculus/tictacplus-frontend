import { createSlice } from '@reduxjs/toolkit';
import { SOCKET_EVENTS } from '../../utils/constants';

// Initial state
const initialState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,

  // Authentication
  isAuthenticated: false,
  authError: null,

  // Room/Game state
  currentRoom: null,
  roomMembers: [],
  spectators: [],

  // Matchmaking
  isInQueue: false,
  queueStartTime: null,
  estimatedWaitTime: null,

  // Messages
  messages: [],
  unreadCount: 0,

  // Events history (for debugging)
  eventHistory: [],
  maxEventHistory: 100,

  // Latency tracking
  latency: null,
  lastPingTime: null,

  // Error handling
  errors: [],
  maxErrors: 50,
};

// Socket slice
const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection management
    setConnecting: (state, action) => {
      state.isConnecting = action.payload;
      if (action.payload) {
        state.connectionError = null;
      }
    },

    setConnected: (state, action) => {
      state.isConnected = action.payload;
      state.isConnecting = false;

      if (action.payload) {
        state.connectionError = null;
        state.reconnectAttempts = 0;
      }
    },

    setConnectionError: (state, action) => {
      state.connectionError = action.payload;
      state.isConnected = false;
      state.isConnecting = false;
    },

    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },

    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },

    // Authentication
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
      if (action.payload) {
        state.authError = null;
      }
    },

    setAuthError: (state, action) => {
      state.authError = action.payload;
      state.isAuthenticated = false;
    },

    // Room management
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload;
    },

    setRoomMembers: (state, action) => {
      state.roomMembers = action.payload;
    },

    addRoomMember: (state, action) => {
      const member = action.payload;
      if (!state.roomMembers.find(m => m.id === member.id)) {
        state.roomMembers.push(member);
      }
    },

    removeRoomMember: (state, action) => {
      const memberId = action.payload;
      state.roomMembers = state.roomMembers.filter(m => m.id !== memberId);
    },

    updateRoomMember: (state, action) => {
      const { id, updates } = action.payload;
      const memberIndex = state.roomMembers.findIndex(m => m.id === id);
      if (memberIndex !== -1) {
        state.roomMembers[memberIndex] = { ...state.roomMembers[memberIndex], ...updates };
      }
    },

    // Spectators
    setSpectators: (state, action) => {
      state.spectators = action.payload;
    },

    addSpectator: (state, action) => {
      const spectator = action.payload;
      if (!state.spectators.find(s => s.id === spectator.id)) {
        state.spectators.push(spectator);
      }
    },

    removeSpectator: (state, action) => {
      const spectatorId = action.payload;
      state.spectators = state.spectators.filter(s => s.id !== spectatorId);
    },

    // Matchmaking
    setInQueue: (state, action) => {
      state.isInQueue = action.payload;

      if (action.payload) {
        state.queueStartTime = Date.now();
      } else {
        state.queueStartTime = null;
        state.estimatedWaitTime = null;
      }
    },

    setEstimatedWaitTime: (state, action) => {
      state.estimatedWaitTime = action.payload;
    },

    // Messages
    addMessage: (state, action) => {
      const message = {
        ...action.payload,
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      state.messages.push(message);
      state.unreadCount += 1;

      // Limit message history
      if (state.messages.length > 100) {
        state.messages = state.messages.slice(-100);
      }
    },

    clearMessages: (state) => {
      state.messages = [];
      state.unreadCount = 0;
    },

    markMessagesAsRead: (state) => {
      state.unreadCount = 0;
    },

    // Event history (for debugging)
    addEvent: (state, action) => {
      const event = {
        ...action.payload,
        timestamp: Date.now(),
      };

      state.eventHistory.push(event);

      // Limit event history
      if (state.eventHistory.length > state.maxEventHistory) {
        state.eventHistory = state.eventHistory.slice(-state.maxEventHistory);
      }
    },

    clearEventHistory: (state) => {
      state.eventHistory = [];
    },

    // Latency tracking
    setLatency: (state, action) => {
      state.latency = action.payload;
    },

    setPingTime: (state, action) => {
      state.lastPingTime = action.payload;
    },

    // Error handling
    addError: (state, action) => {
      const error = {
        ...action.payload,
        timestamp: Date.now(),
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      state.errors.push(error);

      // Limit error history
      if (state.errors.length > state.maxErrors) {
        state.errors = state.errors.slice(-state.maxErrors);
      }
    },

    clearErrors: (state) => {
      state.errors = [];
    },

    removeError: (state, action) => {
      const errorId = action.payload;
      state.errors = state.errors.filter(e => e.id !== errorId);
    },

    // Reset socket state
    resetSocketState: (state) => {
      Object.assign(state, initialState);
    },

    // Complete reset (including socket)
    resetAll: () => initialState,
  },
});

// Export actions
export const {
  setConnecting,
  setConnected,
  setConnectionError,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  setAuthenticated,
  setAuthError,
  setCurrentRoom,
  setRoomMembers,
  addRoomMember,
  removeRoomMember,
  updateRoomMember,
  setSpectators,
  addSpectator,
  removeSpectator,
  setInQueue,
  setEstimatedWaitTime,
  addMessage,
  clearMessages,
  markMessagesAsRead,
  addEvent,
  clearEventHistory,
  setLatency,
  setPingTime,
  addError,
  clearErrors,
  removeError,
  resetSocketState,
  resetAll,
} = socketSlice.actions;

// Selectors
export const selectSocket = (state) => state.socket;
export const selectIsConnected = (state) => state.socket.isConnected;
export const selectIsConnecting = (state) => state.socket.isConnecting;
export const selectConnectionError = (state) => state.socket.connectionError;
export const selectIsAuthenticated = (state) => state.socket.isAuthenticated;
export const selectCurrentRoom = (state) => state.socket.currentRoom;
export const selectRoomMembers = (state) => state.socket.roomMembers;
export const selectSpectators = (state) => state.socket.spectators;
export const selectIsInQueue = (state) => state.socket.isInQueue;
export const selectQueueTime = (state) => {
  if (!state.socket.queueStartTime) return 0;
  return Date.now() - state.socket.queueStartTime;
};
export const selectMessages = (state) => state.socket.messages;
export const selectUnreadCount = (state) => state.socket.unreadCount;
export const selectLatency = (state) => state.socket.latency;
export const selectSocketErrors = (state) => state.socket.errors;
export const selectEventHistory = (state) => state.socket.eventHistory;

// Helper action creators
export const logSocketEvent = (eventType, data = {}) => (dispatch) => {
  dispatch(addEvent({
    type: eventType,
    data,
  }));
};

export const logSocketError = (error, context = {}) => (dispatch) => {
  dispatch(addError({
    error: error.message || error,
    context,
    stack: error.stack,
  }));
};

export default socketSlice.reducer;