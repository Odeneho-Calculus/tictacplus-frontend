import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Slices
import gameReducer from './slices/gameSlice';
import playerReducer from './slices/playerSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import socketReducer from './slices/socketSlice';
import settingsReducer from './slices/settingsSlice';

// Middleware
import { socketMiddleware } from './middleware/socketMiddleware';

// Persist configuration
const persistConfig = {
  key: 'tictacplus',
  version: 1,
  storage,
  whitelist: ['player', 'settings', 'game', 'auth'], // Persist player, settings, game state, and auth
  blacklist: ['socket', 'ui'], // Don't persist socket or UI
};

// Game-specific persist config
const gamePersistConfig = {
  key: 'game',
  storage,
  // Only persist active game state, not loading states or errors
  blacklist: ['isLoading', 'error', 'isThinking']
};

// Auth-specific persist config
const authPersistConfig = {
  key: 'auth',
  storage,
  // Don't persist loading states or errors
  blacklist: ['isLoading', 'error']
};

// Combine reducers
const rootReducer = {
  game: persistReducer(gamePersistConfig, gameReducer),
  player: persistReducer(
    { ...persistConfig, key: 'player' },
    playerReducer
  ),
  auth: persistReducer(authPersistConfig, authReducer),
  ui: uiReducer,
  socket: socketReducer,
  settings: persistReducer(
    { ...persistConfig, key: 'settings' },
    settingsReducer
  ),
};

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER
        ],
      },
    }).concat(socketMiddleware),
  devTools: import.meta.env.VITE_SHOW_REDUX_DEVTOOLS === 'true',
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (if needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept('./slices/gameSlice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/playerSlice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/uiSlice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/socketSlice', () => {
    store.replaceReducer(rootReducer);
  });

  import.meta.hot.accept('./slices/settingsSlice', () => {
    store.replaceReducer(rootReducer);
  });
}