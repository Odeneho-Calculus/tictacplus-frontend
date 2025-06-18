import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { THEMES, MODAL_TYPES, NOTIFICATION_TYPES } from '../../utils/constants';

// Async thunks
export const initializeApp = createAsyncThunk(
  'ui/initializeApp',
  async (_, { dispatch }) => {
    try {
      // Always use dark theme as default
      let savedTheme = localStorage.getItem('tictacplus_theme');
      // If no theme is saved or it's 'light' or 'auto', set it to dark
      if (!savedTheme || savedTheme === 'light' || savedTheme === 'auto') {
        savedTheme = 'dark';
        localStorage.setItem('tictacplus_theme', 'dark');
      }
      const theme = savedTheme;

      // Initialize other UI settings
      const animationLevel = localStorage.getItem('tictacplus_animations') || 'full';
      const soundEnabled = localStorage.getItem('tictacplus_sound') !== 'false';

      return {
        theme,
        animationLevel,
        soundEnabled,
        isInitialized: true,
      };
    } catch (error) {
      console.error('Failed to initialize app:', error);
      throw error;
    }
  }
);

// Initial state
const initialState = {
  // App state
  isInitialized: false,
  isLoading: false,

  // Theme and appearance
  theme: THEMES.DARK,
  animationLevel: 'full',
  soundEnabled: true,
  particlesEnabled: true,

  // Layout
  sidebarOpen: false,
  fullscreen: false,

  // Modals
  activeModal: null,
  modalData: null,
  modalHistory: [],

  // Notifications
  notifications: [],
  notificationId: 0,

  // Navigation
  currentPage: 'home',
  navigationHistory: [],

  // Performance
  fps: 60,
  performanceMode: 'auto',

  // Accessibility
  highContrast: false,
  reducedMotion: false,
  screenReaderMode: false,

  // Debug
  debugMode: false,
  showPerformanceStats: false,

  // Error handling
  error: null,
  errorHistory: [],
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('tictacplus_theme', action.payload);
    },

    toggleTheme: (state) => {
      // Only toggle between dark and neon themes
      state.theme = state.theme === THEMES.DARK ? THEMES.NEON : THEMES.DARK;
      localStorage.setItem('tictacplus_theme', state.theme);
    },

    // Animation settings
    setAnimationLevel: (state, action) => {
      state.animationLevel = action.payload;
      localStorage.setItem('tictacplus_animations', action.payload);
    },

    // Sound settings
    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
      localStorage.setItem('tictacplus_sound', action.payload.toString());
    },

    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('tictacplus_sound', state.soundEnabled.toString());
    },

    // Particles
    setParticlesEnabled: (state, action) => {
      state.particlesEnabled = action.payload;
    },

    // Layout
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setFullscreen: (state, action) => {
      state.fullscreen = action.payload;
    },

    toggleFullscreen: (state) => {
      state.fullscreen = !state.fullscreen;
    },

    // Modal management
    openModal: (state, action) => {
      const { type, data } = action.payload;

      // Add current modal to history if exists
      if (state.activeModal) {
        state.modalHistory.push({
          type: state.activeModal,
          data: state.modalData,
        });
      }

      state.activeModal = type;
      state.modalData = data || null;
    },

    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },

    goBackModal: (state) => {
      if (state.modalHistory.length > 0) {
        const previous = state.modalHistory.pop();
        state.activeModal = previous.type;
        state.modalData = previous.data;
      } else {
        state.activeModal = null;
        state.modalData = null;
      }
    },

    clearModalHistory: (state) => {
      state.modalHistory = [];
    },

    // Notification management
    addNotification: (state, action) => {
      const { type, message, duration = 4000, persistent = false } = action.payload;

      const notification = {
        id: state.notificationId++,
        type,
        message,
        duration,
        persistent,
        timestamp: Date.now(),
      };

      state.notifications.push(notification);

      // Limit notifications to prevent memory issues
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(-10);
      }
    },

    removeNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== id);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Navigation
    setCurrentPage: (state, action) => {
      const page = action.payload;

      // Add to history
      if (state.currentPage !== page) {
        state.navigationHistory.push(state.currentPage);

        // Limit history
        if (state.navigationHistory.length > 20) {
          state.navigationHistory = state.navigationHistory.slice(-20);
        }
      }

      state.currentPage = page;
    },

    // Performance
    setFPS: (state, action) => {
      state.fps = action.payload;
    },

    setPerformanceMode: (state, action) => {
      state.performanceMode = action.payload;
    },

    // Accessibility
    setHighContrast: (state, action) => {
      state.highContrast = action.payload;
    },

    setReducedMotion: (state, action) => {
      state.reducedMotion = action.payload;
    },

    setScreenReaderMode: (state, action) => {
      state.screenReaderMode = action.payload;
    },

    // Debug
    setDebugMode: (state, action) => {
      state.debugMode = action.payload;
    },

    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
    },

    setShowPerformanceStats: (state, action) => {
      state.showPerformanceStats = action.payload;
    },

    // Loading
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // Error handling
    setError: (state, action) => {
      const error = action.payload;
      state.error = error;

      // Add to error history
      if (error) {
        state.errorHistory.push({
          error,
          timestamp: Date.now(),
        });

        // Limit error history
        if (state.errorHistory.length > 50) {
          state.errorHistory = state.errorHistory.slice(-50);
        }
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    clearErrorHistory: (state) => {
      state.errorHistory = [];
    },

    // Reset UI state
    resetUI: (state) => {
      Object.assign(state, {
        ...initialState,
        theme: state.theme,
        animationLevel: state.animationLevel,
        soundEnabled: state.soundEnabled,
        isInitialized: true,
      });
    },
  },

  extraReducers: (builder) => {
    builder
      // Initialize app
      .addCase(initializeApp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isLoading = false;
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
        state.isInitialized = true; // Still mark as initialized to prevent infinite loading
      });
  },
});

// Export actions
export const {
  setTheme,
  toggleTheme,
  setAnimationLevel,
  setSoundEnabled,
  toggleSound,
  setParticlesEnabled,
  setSidebarOpen,
  toggleSidebar,
  setFullscreen,
  toggleFullscreen,
  openModal,
  closeModal,
  goBackModal,
  clearModalHistory,
  addNotification,
  removeNotification,
  clearNotifications,
  setCurrentPage,
  setFPS,
  setPerformanceMode,
  setHighContrast,
  setReducedMotion,
  setScreenReaderMode,
  setDebugMode,
  toggleDebugMode,
  setShowPerformanceStats,
  setLoading,
  setError,
  clearError,
  clearErrorHistory,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectUI = (state) => state.ui;
export const selectTheme = (state) => state.ui.theme;
export const selectIsInitialized = (state) => state.ui.isInitialized;
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalData = (state) => state.ui.modalData;
export const selectNotifications = (state) => state.ui.notifications;
export const selectCurrentPage = (state) => state.ui.currentPage;
export const selectSoundEnabled = (state) => state.ui.soundEnabled;
export const selectAnimationLevel = (state) => state.ui.animationLevel;
export const selectParticlesEnabled = (state) => state.ui.particlesEnabled;
export const selectDebugMode = (state) => state.ui.debugMode;
export const selectError = (state) => state.ui.error;

// Helper action creators
export const showNotification = (type, message, options = {}) => (dispatch) => {
  dispatch(addNotification({
    type,
    message,
    ...options,
  }));
};

export const showSuccess = (message, options = {}) => (dispatch) => {
  dispatch(showNotification(NOTIFICATION_TYPES.SUCCESS, message, options));
};

export const showError = (message, options = {}) => (dispatch) => {
  dispatch(showNotification(NOTIFICATION_TYPES.ERROR, message, {
    duration: 6000,
    ...options
  }));
};

export const showWarning = (message, options = {}) => (dispatch) => {
  dispatch(showNotification(NOTIFICATION_TYPES.WARNING, message, options));
};

export const showInfo = (message, options = {}) => (dispatch) => {
  dispatch(showNotification(NOTIFICATION_TYPES.INFO, message, options));
};

export default uiSlice.reducer;