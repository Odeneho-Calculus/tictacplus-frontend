import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { STORAGE_KEYS } from '../../utils/constants';

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const result = await authService.register(userData);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const result = await authService.login(credentials);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
            return true;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const refreshAuthToken = createAsyncThunk(
    'auth/refreshAuthToken',
    async (_, { rejectWithValue }) => {
        try {
            const newToken = await authService.refreshAuthToken();
            return newToken;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const loadStoredAuth = createAsyncThunk(
    'auth/loadStoredAuth',
    async (_, { rejectWithValue }) => {
        try {
            if (authService.isAuthenticated()) {
                const user = authService.getCurrentUser();
                return {
                    user,
                    token: authService.token,
                    isAuthenticated: true
                };
            }
            return {
                user: null,
                token: null,
                isAuthenticated: false
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkAuthStatus = createAsyncThunk(
    'auth/checkAuthStatus',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            // Check if token is expired
            const isValid = await authService.validateToken();

            if (!isValid) {
                // Try to refresh the token
                try {
                    await dispatch(refreshAuthToken()).unwrap();
                    return {
                        isAuthenticated: true,
                        user: authService.getCurrentUser(),
                        token: authService.token
                    };
                } catch (refreshError) {
                    // If refresh fails, log the user out
                    await dispatch(logoutUser()).unwrap();
                    return {
                        isAuthenticated: false,
                        user: null,
                        token: null
                    };
                }
            }

            return {
                isAuthenticated: true,
                user: authService.getCurrentUser(),
                token: authService.token
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Initial state
const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastAuthCheck: null,
    authMethod: null, // 'guest' | 'registered'
};

// Auth slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },

        setAuthLoading: (state, action) => {
            state.isLoading = action.payload;
        },

        updateUserProfile: (state, action) => {
            if (state.user) {
                state.user = {
                    ...state.user,
                    ...action.payload
                };
            }
        },

        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            state.authMethod = null;
            authService.clearTokens();
        }
    },
    extraReducers: (builder) => {
        builder
            // Load stored auth
            .addCase(loadStoredAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadStoredAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = action.payload.isAuthenticated;
                state.lastAuthCheck = Date.now();
                if (action.payload.user?.isGuest) {
                    state.authMethod = 'guest';
                } else if (action.payload.user) {
                    state.authMethod = 'registered';
                }

                // Authenticate socket connection with the stored token if user is authenticated
                if (action.payload.isAuthenticated && action.payload.token) {
                    import('../../services/socketManager').then(({ socketManager }) => {
                        if (socketManager.isConnected()) {
                            socketManager.emit('authenticate', { token: action.payload.token });
                        }
                    });
                }
            })
            .addCase(loadStoredAuth.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })



            // User registration
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.refreshToken = action.payload.refreshToken;
                state.isAuthenticated = true;
                state.authMethod = 'registered';
                state.lastAuthCheck = Date.now();

                // Authenticate socket connection with the new token
                import('../../services/socketManager').then(({ socketManager }) => {
                    if (socketManager.isConnected()) {
                        socketManager.emit('authenticate', { token: action.payload.token });
                    }
                });
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // User login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.refreshToken = action.payload.refreshToken;
                state.isAuthenticated = true;
                state.authMethod = 'registered';
                state.lastAuthCheck = Date.now();

                // Authenticate socket connection with the new token
                import('../../services/socketManager').then(({ socketManager }) => {
                    if (socketManager.isConnected()) {
                        socketManager.emit('authenticate', { token: action.payload.token });
                    }
                });
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // User logout
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.error = null;
                state.authMethod = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Token refresh
            .addCase(refreshAuthToken.pending, (state) => {
                // Don't set loading for token refresh to avoid UI flicker
            })
            .addCase(refreshAuthToken.fulfilled, (state, action) => {
                state.token = action.payload;
                state.lastAuthCheck = Date.now();
            })
            .addCase(refreshAuthToken.rejected, (state, action) => {
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.authMethod = null;
            })

            // Check auth status
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = action.payload.isAuthenticated;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.lastAuthCheck = Date.now();
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                // Don't automatically clear auth state on check failure
            });
    },
});

// Action creators
export const { clearError, setAuthLoading, updateUserProfile, clearAuth } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthMethod = (state) => state.auth.authMethod;
export const selectIsGuest = (state) => state.auth.user?.isGuest || false;

export default authSlice.reducer;