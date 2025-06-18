import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { THEMES, ANIMATIONS, STORAGE_KEYS } from '../../utils/constants';

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }

      // Return default settings
      return {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      throw error;
    }
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
);

// Initial state
const initialState = {
  // Display settings
  theme: THEMES.AUTO,
  animationLevel: ANIMATIONS.FULL,
  particlesEnabled: true,
  backgroundEffects: true,

  // Audio settings
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.7,
  musicVolume: 0.5,
  soundEffects: {
    click: true,
    move: true,
    win: true,
    lose: true,
    draw: true,
    notification: true,
    ambient: true,
    buttonHover: true,
    buttonClick: true,
    gameStart: true,
    countdown: true,
    error: true,
  },

  // Game settings
  showCoordinates: false,
  showMoveHistory: true,
  showTimer: true,
  autoSave: true,
  confirmMoves: false,

  // AI settings
  defaultDifficulty: 'medium',
  aiThinkingTime: 1000, // milliseconds
  showAIThinking: true,

  // Multiplayer settings
  autoAcceptInvites: false,
  allowSpectators: true,
  showPlayerStats: true,
  chatEnabled: true,
  profanityFilter: true,

  // Accessibility settings
  highContrast: false,
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
  fontSize: 'medium',
  colorBlindSupport: false,

  // Performance settings
  targetFPS: 60,
  vsync: true,
  hardwareAcceleration: true,
  lowPowerMode: false,

  // Privacy settings
  analytics: true,
  crashReporting: true,
  shareStats: true,

  // Notification settings
  gameInvites: true,
  friendRequests: true,
  achievements: true,
  systemNotifications: true,

  // Advanced settings
  debugMode: false,
  developerMode: false,
  experimentalFeatures: false,

  // Loading states
  isLoading: false,
  isSaving: false,
  error: null,

  // Timestamps
  lastUpdated: null,
};

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Display settings
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.lastUpdated = Date.now();
    },

    setAnimationLevel: (state, action) => {
      state.animationLevel = action.payload;
      state.lastUpdated = Date.now();
    },

    setParticlesEnabled: (state, action) => {
      state.particlesEnabled = action.payload;
      state.lastUpdated = Date.now();
    },

    setBackgroundEffects: (state, action) => {
      state.backgroundEffects = action.payload;
      state.lastUpdated = Date.now();
    },

    // Audio settings
    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
      state.lastUpdated = Date.now();
    },

    setMusicEnabled: (state, action) => {
      state.musicEnabled = action.payload;
      state.lastUpdated = Date.now();
    },

    setSoundVolume: (state, action) => {
      state.soundVolume = Math.max(0, Math.min(1, action.payload));
      state.lastUpdated = Date.now();
    },

    setMusicVolume: (state, action) => {
      state.musicVolume = Math.max(0, Math.min(1, action.payload));
      state.lastUpdated = Date.now();
    },

    setSoundEffect: (state, action) => {
      const { effect, enabled } = action.payload;
      if (state.soundEffects.hasOwnProperty(effect)) {
        state.soundEffects[effect] = enabled;
        state.lastUpdated = Date.now();
      }
    },

    // Game settings
    setShowCoordinates: (state, action) => {
      state.showCoordinates = action.payload;
      state.lastUpdated = Date.now();
    },

    setShowMoveHistory: (state, action) => {
      state.showMoveHistory = action.payload;
      state.lastUpdated = Date.now();
    },

    setShowTimer: (state, action) => {
      state.showTimer = action.payload;
      state.lastUpdated = Date.now();
    },

    setAutoSave: (state, action) => {
      state.autoSave = action.payload;
      state.lastUpdated = Date.now();
    },

    setConfirmMoves: (state, action) => {
      state.confirmMoves = action.payload;
      state.lastUpdated = Date.now();
    },

    // AI settings
    setDefaultDifficulty: (state, action) => {
      state.defaultDifficulty = action.payload;
      state.lastUpdated = Date.now();
    },

    setAIThinkingTime: (state, action) => {
      state.aiThinkingTime = Math.max(0, action.payload);
      state.lastUpdated = Date.now();
    },

    setShowAIThinking: (state, action) => {
      state.showAIThinking = action.payload;
      state.lastUpdated = Date.now();
    },

    // Multiplayer settings
    setAutoAcceptInvites: (state, action) => {
      state.autoAcceptInvites = action.payload;
      state.lastUpdated = Date.now();
    },

    setAllowSpectators: (state, action) => {
      state.allowSpectators = action.payload;
      state.lastUpdated = Date.now();
    },

    setShowPlayerStats: (state, action) => {
      state.showPlayerStats = action.payload;
      state.lastUpdated = Date.now();
    },

    setChatEnabled: (state, action) => {
      state.chatEnabled = action.payload;
      state.lastUpdated = Date.now();
    },

    setProfanityFilter: (state, action) => {
      state.profanityFilter = action.payload;
      state.lastUpdated = Date.now();
    },

    // Accessibility settings
    setHighContrast: (state, action) => {
      state.highContrast = action.payload;
      state.lastUpdated = Date.now();
    },

    setReducedMotion: (state, action) => {
      state.reducedMotion = action.payload;
      state.lastUpdated = Date.now();
    },

    setScreenReaderMode: (state, action) => {
      state.screenReaderMode = action.payload;
      state.lastUpdated = Date.now();
    },

    setKeyboardNavigation: (state, action) => {
      state.keyboardNavigation = action.payload;
      state.lastUpdated = Date.now();
    },

    setFontSize: (state, action) => {
      state.fontSize = action.payload;
      state.lastUpdated = Date.now();
    },

    setColorBlindSupport: (state, action) => {
      state.colorBlindSupport = action.payload;
      state.lastUpdated = Date.now();
    },

    // Performance settings
    setTargetFPS: (state, action) => {
      state.targetFPS = Math.max(30, Math.min(120, action.payload));
      state.lastUpdated = Date.now();
    },

    setVsync: (state, action) => {
      state.vsync = action.payload;
      state.lastUpdated = Date.now();
    },

    setHardwareAcceleration: (state, action) => {
      state.hardwareAcceleration = action.payload;
      state.lastUpdated = Date.now();
    },

    setLowPowerMode: (state, action) => {
      state.lowPowerMode = action.payload;
      state.lastUpdated = Date.now();
    },

    // Privacy settings
    setAnalytics: (state, action) => {
      state.analytics = action.payload;
      state.lastUpdated = Date.now();
    },

    setCrashReporting: (state, action) => {
      state.crashReporting = action.payload;
      state.lastUpdated = Date.now();
    },

    setShareStats: (state, action) => {
      state.shareStats = action.payload;
      state.lastUpdated = Date.now();
    },

    // Notification settings
    setNotificationSetting: (state, action) => {
      const { type, enabled } = action.payload;
      if (state.hasOwnProperty(type)) {
        state[type] = enabled;
        state.lastUpdated = Date.now();
      }
    },

    // Advanced settings
    setDebugMode: (state, action) => {
      state.debugMode = action.payload;
      state.lastUpdated = Date.now();
    },

    setDeveloperMode: (state, action) => {
      state.developerMode = action.payload;
      state.lastUpdated = Date.now();
    },

    setExperimentalFeatures: (state, action) => {
      state.experimentalFeatures = action.payload;
      state.lastUpdated = Date.now();
    },

    // Bulk updates
    updateSettings: (state, action) => {
      Object.assign(state, action.payload);
      state.lastUpdated = Date.now();
    },

    // Reset settings
    resetSettings: (state) => {
      Object.assign(state, {
        ...initialState,
        lastUpdated: Date.now(),
      });
    },

    resetToDefaults: (state, action) => {
      const category = action.payload;
      const defaults = {
        display: {
          theme: THEMES.AUTO,
          animationLevel: ANIMATIONS.FULL,
          particlesEnabled: true,
          backgroundEffects: true,
        },
        audio: {
          soundEnabled: true,
          musicEnabled: true,
          soundVolume: 0.7,
          musicVolume: 0.5,
          soundEffects: {
            click: true,
            move: true,
            win: true,
            lose: true,
            notification: true,
            ambient: true,
          },
        },
        game: {
          showCoordinates: false,
          showMoveHistory: true,
          showTimer: true,
          autoSave: true,
          confirmMoves: false,
        },
        // Add more categories as needed
      };

      if (category && defaults[category]) {
        Object.assign(state, defaults[category]);
      } else {
        Object.assign(state, initialState);
      }

      state.lastUpdated = Date.now();
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Load settings
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isLoading = false;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      })

      // Save settings
      .addCase(saveSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.error = action.error.message;
        state.isSaving = false;
      });
  },
});

// Export actions
export const {
  setTheme,
  setAnimationLevel,
  setParticlesEnabled,
  setBackgroundEffects,
  setSoundEnabled,
  setMusicEnabled,
  setSoundVolume,
  setMusicVolume,
  setSoundEffect,
  setShowCoordinates,
  setShowMoveHistory,
  setShowTimer,
  setAutoSave,
  setConfirmMoves,
  setDefaultDifficulty,
  setAIThinkingTime,
  setShowAIThinking,
  setAutoAcceptInvites,
  setAllowSpectators,
  setShowPlayerStats,
  setChatEnabled,
  setProfanityFilter,
  setHighContrast,
  setReducedMotion,
  setScreenReaderMode,
  setKeyboardNavigation,
  setFontSize,
  setColorBlindSupport,
  setTargetFPS,
  setVsync,
  setHardwareAcceleration,
  setLowPowerMode,
  setAnalytics,
  setCrashReporting,
  setShareStats,
  setNotificationSetting,
  setDebugMode,
  setDeveloperMode,
  setExperimentalFeatures,
  updateSettings,
  resetSettings,
  resetToDefaults,
  setError,
  clearError,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state) => state.settings;

// Display settings selectors
export const selectDisplaySettings = createSelector(
  [(state) => state.settings.theme,
  (state) => state.settings.animationLevel,
  (state) => state.settings.particlesEnabled,
  (state) => state.settings.backgroundEffects],
  (theme, animationLevel, particlesEnabled, backgroundEffects) => ({
    theme,
    animationLevel,
    particlesEnabled,
    backgroundEffects,
  })
);

export const selectTheme = (state) => state.settings.theme;
export const selectAnimationLevel = (state) => state.settings.animationLevel;
export const selectParticlesEnabled = (state) => state.settings.particlesEnabled;
export const selectBackgroundEffects = (state) => state.settings.backgroundEffects;

// Audio settings selectors
export const selectAudioSettings = createSelector(
  [(state) => state.settings.soundEnabled,
  (state) => state.settings.musicEnabled,
  (state) => state.settings.soundVolume,
  (state) => state.settings.musicVolume,
  (state) => state.settings.soundEffects],
  (soundEnabled, musicEnabled, soundVolume, musicVolume, soundEffects) => ({
    soundEnabled,
    musicEnabled,
    soundVolume,
    musicVolume,
    soundEffects,
  })
);

export const selectSoundEnabled = (state) => state.settings.soundEnabled;
export const selectMusicEnabled = (state) => state.settings.musicEnabled;
export const selectSoundVolume = (state) => state.settings.soundVolume;
export const selectMusicVolume = (state) => state.settings.musicVolume;
export const selectSoundEffects = (state) => state.settings.soundEffects;

// Game settings selectors
export const selectGameSettings = createSelector(
  [(state) => state.settings.showCoordinates,
  (state) => state.settings.showMoveHistory,
  (state) => state.settings.showTimer,
  (state) => state.settings.autoSave,
  (state) => state.settings.confirmMoves],
  (showCoordinates, showMoveHistory, showTimer, autoSave, confirmMoves) => ({
    showCoordinates,
    showMoveHistory,
    showTimer,
    autoSave,
    confirmMoves,
  })
);

export const selectShowCoordinates = (state) => state.settings.showCoordinates;
export const selectShowMoveHistory = (state) => state.settings.showMoveHistory;
export const selectShowTimer = (state) => state.settings.showTimer;
export const selectAutoSave = (state) => state.settings.autoSave;
export const selectConfirmMoves = (state) => state.settings.confirmMoves;

// AI settings selectors
export const selectAISettings = (state) => ({
  defaultDifficulty: state.settings.defaultDifficulty,
  aiThinkingTime: state.settings.aiThinkingTime,
  showAIThinking: state.settings.showAIThinking,
});

export const selectDefaultDifficulty = (state) => state.settings.defaultDifficulty;
export const selectAIThinkingTime = (state) => state.settings.aiThinkingTime;
export const selectShowAIThinking = (state) => state.settings.showAIThinking;

// Accessibility settings selectors
export const selectAccessibilitySettings = (state) => ({
  highContrast: state.settings.highContrast,
  reducedMotion: state.settings.reducedMotion,
  screenReaderMode: state.settings.screenReaderMode,
  keyboardNavigation: state.settings.keyboardNavigation,
  fontSize: state.settings.fontSize,
  colorBlindSupport: state.settings.colorBlindSupport,
});

export const selectHighContrast = (state) => state.settings.highContrast;
export const selectReducedMotion = (state) => state.settings.reducedMotion;
export const selectScreenReaderMode = (state) => state.settings.screenReaderMode;
export const selectKeyboardNavigation = (state) => state.settings.keyboardNavigation;
export const selectFontSize = (state) => state.settings.fontSize;
export const selectColorBlindSupport = (state) => state.settings.colorBlindSupport;

// Performance settings selectors
export const selectPerformanceSettings = (state) => ({
  targetFPS: state.settings.targetFPS,
  vsync: state.settings.vsync,
  hardwareAcceleration: state.settings.hardwareAcceleration,
  lowPowerMode: state.settings.lowPowerMode,
});

export const selectTargetFPS = (state) => state.settings.targetFPS;
export const selectVsync = (state) => state.settings.vsync;
export const selectHardwareAcceleration = (state) => state.settings.hardwareAcceleration;
export const selectLowPowerMode = (state) => state.settings.lowPowerMode;

// Loading state selectors
export const selectSettingsLoading = (state) => state.settings.isLoading;
export const selectSettingsSaving = (state) => state.settings.isSaving;
export const selectSettingsError = (state) => state.settings.error;

export default settingsSlice.reducer;