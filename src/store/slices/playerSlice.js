import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../utils/constants';
import playerService from '../../services/playerService';
import authService from '../../services/authService';

// Async thunks
export const loadPlayerData = createAsyncThunk(
  'player/loadPlayerData',
  async (_, { rejectWithValue }) => {
    try {
      // If user is authenticated, fetch data from API
      if (authService.isAuthenticated()) {
        return await playerService.getPlayerData();
      }

      // Otherwise, try to load from localStorage
      const savedData = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
      if (savedData) {
        return JSON.parse(savedData);
      }

      // Return default player data if none exists
      return {
        id: `player_${Date.now()}`,
        username: 'Player',
        displayName: 'Player',
        avatar: null,
        stats: {
          level: 1,
          experience: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDraw: 0,
          rank: 'Novice',
          elo: 1200,
          winRate: 0,
          winStreak: 0,
          bestWinStreak: 0
        },
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error('Failed to load player data:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const savePlayerData = createAsyncThunk(
  'player/savePlayerData',
  async (playerData, { rejectWithValue }) => {
    try {
      // If user is authenticated, save to API
      if (authService.isAuthenticated()) {
        const updateData = {
          displayName: playerData.displayName,
          avatar: playerData.avatar,
          preferences: playerData.preferences
        };
        return await playerService.updateProfile(updateData);
      }

      // Otherwise, save to localStorage
      localStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(playerData));
      return playerData;
    } catch (error) {
      console.error('Failed to save player data:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'player/updateProfile',
  async (profileData, { getState, dispatch, rejectWithValue }) => {
    try {
      const { player } = getState();
      const { auth } = getState();

      // If user is authenticated, update via API
      if (authService.isAuthenticated()) {
        // Make sure to include email in the profile data if it's not already there
        const updatedProfileData = {
          ...profileData,
          email: profileData.email || player.email || auth.user?.email
        };
        console.log('Updating profile with data:', updatedProfileData);
        return await playerService.updateProfile(updatedProfileData);
      }

      // Otherwise, update locally
      const updatedPlayer = {
        ...player,
        ...profileData,
        // Make sure email is preserved
        email: profileData.email || player.email || auth.user?.email,
        updatedAt: Date.now(),
      };

      await dispatch(savePlayerData(updatedPlayer)).unwrap();
      return updatedPlayer;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Basic info
  id: null,
  name: 'Player',
  displayName: 'Player', // Added displayName for consistent naming
  email: null,
  avatar: null,

  // Game stats
  level: 1,
  experience: 0,
  experienceToNext: 100,

  // Game statistics
  totalGames: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDraw: 0,
  winStreak: 0,
  bestWinStreak: 0,

  // Performance stats
  averageGameTime: 0,
  fastestWin: null,
  totalPlayTime: 0,

  // AI difficulty stats
  easyWins: 0,
  mediumWins: 0,
  hardWins: 0,
  expertWins: 0,

  // Achievements
  achievements: [],
  unlockedAchievements: [],

  // Preferences
  preferredDifficulty: 'medium',
  favoriteTheme: 'dark',

  // Social
  friends: [],
  blockedUsers: [],

  // Timestamps
  createdAt: null,
  updatedAt: null,
  lastLoginAt: null,

  // Loading states
  isLoading: false,
  isSaving: false,
  error: null,
};

// Player slice
const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    // Basic profile updates
    setPlayerName: (state, action) => {
      state.name = action.payload;
      // Also update displayName if it matches the previous name or is empty
      if (!state.displayName || state.displayName === state.name) {
        state.displayName = action.payload;
      }
      state.updatedAt = Date.now();
    },

    // Set display name separately
    setPlayerDisplayName: (state, action) => {
      state.displayName = action.payload;
      state.updatedAt = Date.now();
    },

    setPlayerAvatar: (state, action) => {
      state.avatar = action.payload;
      state.updatedAt = Date.now();
    },

    setPlayerEmail: (state, action) => {
      state.email = action.payload;
      state.updatedAt = Date.now();
    },

    // Experience and leveling
    addExperience: (state, action) => {
      const xpGained = action.payload;
      state.experience += xpGained;

      // Check for level up
      while (state.experience >= state.experienceToNext) {
        state.experience -= state.experienceToNext;
        state.level += 1;
        state.experienceToNext = calculateExperienceToNext(state.level);
      }

      state.updatedAt = Date.now();
    },

    // Game statistics
    recordGameResult: (state, action) => {
      const { result, gameTime, difficulty, opponent } = action.payload;

      state.totalGames += 1;
      state.totalPlayTime += gameTime;

      if (state.totalGames > 0) {
        state.averageGameTime = state.totalPlayTime / state.totalGames;
      }

      switch (result) {
        case 'win':
          state.gamesWon += 1;
          state.winStreak += 1;

          if (state.winStreak > state.bestWinStreak) {
            state.bestWinStreak = state.winStreak;
          }

          // Record fastest win
          if (!state.fastestWin || gameTime < state.fastestWin) {
            state.fastestWin = gameTime;
          }

          // Record AI difficulty wins
          if (opponent === 'ai') {
            switch (difficulty) {
              case 'easy':
                state.easyWins += 1;
                break;
              case 'medium':
                state.mediumWins += 1;
                break;
              case 'hard':
                state.hardWins += 1;
                break;
              case 'expert':
                state.expertWins += 1;
                break;
            }
          }

          // Add experience for winning
          const xpGained = calculateWinExperience(difficulty, opponent);
          state.experience += xpGained;
          break;

        case 'lose':
          state.gamesLost += 1;
          state.winStreak = 0;

          // Add small experience for participation
          state.experience += 10;
          break;

        case 'draw':
          state.gamesDraw += 1;
          state.winStreak = 0;

          // Add moderate experience for draw
          state.experience += 25;
          break;
      }

      // Check for level up
      while (state.experience >= state.experienceToNext) {
        state.experience -= state.experienceToNext;
        state.level += 1;
        state.experienceToNext = calculateExperienceToNext(state.level);
      }

      state.updatedAt = Date.now();
    },

    // Achievements
    unlockAchievement: (state, action) => {
      const achievementId = action.payload;

      if (!state.unlockedAchievements.includes(achievementId)) {
        state.unlockedAchievements.push(achievementId);
        state.updatedAt = Date.now();
      }
    },

    // Preferences
    setPreferredDifficulty: (state, action) => {
      state.preferredDifficulty = action.payload;
      state.updatedAt = Date.now();
    },

    setFavoriteTheme: (state, action) => {
      state.favoriteTheme = action.payload;
      state.updatedAt = Date.now();
    },

    // Social features
    addFriend: (state, action) => {
      const friendId = action.payload;
      if (!state.friends.includes(friendId)) {
        state.friends.push(friendId);
        state.updatedAt = Date.now();
      }
    },

    removeFriend: (state, action) => {
      const friendId = action.payload;
      state.friends = state.friends.filter(id => id !== friendId);
      state.updatedAt = Date.now();
    },

    blockUser: (state, action) => {
      const userId = action.payload;
      if (!state.blockedUsers.includes(userId)) {
        state.blockedUsers.push(userId);
        // Remove from friends if they were a friend
        state.friends = state.friends.filter(id => id !== userId);
        state.updatedAt = Date.now();
      }
    },

    unblockUser: (state, action) => {
      const userId = action.payload;
      state.blockedUsers = state.blockedUsers.filter(id => id !== userId);
      state.updatedAt = Date.now();
    },

    // Timestamps
    updateLastLogin: (state) => {
      state.lastLoginAt = Date.now();
    },

    // Reset player data
    resetPlayerData: (state) => {
      Object.assign(state, {
        ...initialState,
        id: `player_${Date.now()}`,
        createdAt: Date.now(),
      });
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
      // Load player data
      .addCase(loadPlayerData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPlayerData.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isLoading = false;
        state.lastLoginAt = Date.now();
      })
      .addCase(loadPlayerData.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      })

      // Save player data
      .addCase(savePlayerData.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(savePlayerData.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(savePlayerData.rejected, (state, action) => {
        state.error = action.error.message;
        state.isSaving = false;
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isSaving = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.error.message;
        state.isSaving = false;
      });
  },
});

// Helper functions
const calculateExperienceToNext = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const calculateWinExperience = (difficulty, opponent) => {
  let baseXP = 50;

  // Bonus for AI difficulty
  if (opponent === 'ai') {
    switch (difficulty) {
      case 'easy':
        baseXP += 10;
        break;
      case 'medium':
        baseXP += 25;
        break;
      case 'hard':
        baseXP += 50;
        break;
      case 'expert':
        baseXP += 100;
        break;
    }
  } else if (opponent === 'human') {
    baseXP += 75; // Bonus for beating human players
  }

  return baseXP;
};

// Export actions
export const {
  setPlayerName,
  setPlayerDisplayName, // Added new action
  setPlayerAvatar,
  setPlayerEmail,
  addExperience,
  recordGameResult,
  unlockAchievement,
  setPreferredDifficulty,
  setFavoriteTheme,
  addFriend,
  removeFriend,
  blockUser,
  unblockUser,
  updateLastLogin,
  resetPlayerData,
  setError,
  clearError,
} = playerSlice.actions;

// Selectors
export const selectPlayer = (state) => state.player;
export const selectPlayerStats = (state) => ({
  totalGames: state.player.totalGames,
  gamesWon: state.player.gamesWon,
  gamesLost: state.player.gamesLost,
  gamesDraw: state.player.gamesDraw,
  winRate: state.player.totalGames > 0
    ? (state.player.gamesWon / state.player.totalGames * 100).toFixed(1)
    : 0,
  winStreak: state.player.winStreak,
  bestWinStreak: state.player.bestWinStreak,
});

export const selectPlayerLevel = (state) => ({
  level: state.player.level,
  experience: state.player.experience,
  experienceToNext: state.player.experienceToNext,
  progress: state.player.experienceToNext > 0
    ? (state.player.experience / state.player.experienceToNext * 100).toFixed(1)
    : 0,
});

export const selectPlayerAchievements = (state) => state.player.unlockedAchievements;
export const selectPlayerPreferences = (state) => ({
  preferredDifficulty: state.player.preferredDifficulty,
  favoriteTheme: state.player.favoriteTheme,
});

export default playerSlice.reducer;