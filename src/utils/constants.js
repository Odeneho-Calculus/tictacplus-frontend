// Game States
export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
};

// Game Modes
export const GAME_MODES = {
  LOCAL: 'local',
  AI: 'ai',
  ONLINE: 'online',
  TOURNAMENT: 'tournament',
};

// Player Types
export const PLAYER_TYPES = {
  HUMAN: 'human',
  AI: 'ai',
  REMOTE: 'remote',
};

// AI Difficulty Levels
export const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',

  // Matchmaking
  FIND_MATCH: 'findMatch',
  MATCH_FOUND: 'matchFound',
  MATCH_CANCELLED: 'matchCancelled',
  MATCH_ERROR: 'matchError',

  // Game Events
  JOIN_GAME: 'joinGame',
  LEAVE_GAME: 'leaveGame',
  GAME_JOINED: 'gameJoined',
  GAME_LEFT: 'gameLeft',
  GAME_START: 'gameStart',
  GAME_END: 'gameEnd',
  GAME_STATE_UPDATE: 'gameStateUpdate',

  // Moves
  MAKE_MOVE: 'makeMove',
  MOVE_MADE: 'moveMade',
  INVALID_MOVE: 'invalidMove',

  // Player Events
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  PLAYER_RECONNECTED: 'playerReconnected',
  PLAYER_DISCONNECTED: 'playerDisconnected',

  // Chat
  SEND_MESSAGE: 'sendMessage',
  MESSAGE_RECEIVED: 'messageReceived',

  // Spectating
  SPECTATE_GAME: 'spectateGame',
  SPECTATOR_JOINED: 'spectatorJoined',
  SPECTATOR_LEFT: 'spectatorLeft',

  // Room Management
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  ROOM_CREATED: 'roomCreated',
  ROOM_JOINED: 'roomJoined',
  ROOM_LEFT: 'roomLeft',
  ROOM_UPDATE: 'roomUpdate',

  // Errors
  ERROR: 'error',
  GAME_ERROR: 'gameError',
  ROOM_ERROR: 'roomError',
};

// UI Themes
export const THEMES = {
  DARK: 'dark',
  NEON: 'neon',
  AUTO: 'auto',
  // LIGHT theme removed
};

// Animation Types
export const ANIMATIONS = {
  NONE: 'none',
  BASIC: 'basic',
  ENHANCED: 'enhanced',
  FULL: 'full',
};

// Sound Types
export const SOUNDS = {
  CLICK: 'click',
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
  MOVE: 'move',
  NOTIFICATION: 'notification',
  AMBIENT: 'ambient',
  BUTTON_HOVER: 'buttonHover',
  BUTTON_CLICK: 'buttonClick',
  GAME_START: 'gameStart',
  COUNTDOWN: 'countdown',
  ERROR: 'error',
};

// Board Configuration
export const BOARD_CONFIG = {
  SIZE: 3,
  TOTAL_CELLS: 9,
  WINNING_COMBINATIONS: [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6], // Diagonal top-right to bottom-left
  ],
};

// Game Rules
export const GAME_RULES = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 2,
  MAX_SPECTATORS: 10,
  DEFAULT_TIME_LIMIT: 30, // seconds per turn
  MAX_TIME_LIMIT: 300, // 5 minutes
  MIN_TIME_LIMIT: 5, // 5 seconds
  MAX_ROUNDS: 10,
  DEFAULT_ROUNDS: 1,
};

// Player Symbols
export const PLAYER_SYMBOLS = {
  X: 'X',
  O: 'O',
  EMPTY: null,
};

// Game Results
export const GAME_RESULTS = {
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
  ABANDONED: 'abandoned',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Modal Types
export const MODAL_TYPES = {
  GAME_OVER: 'gameOver',
  SETTINGS: 'settings',
  PLAYER_SETUP: 'playerSetup',
  MATCHMAKING: 'matchmaking',
  LEADERBOARD: 'leaderboard',
  HELP: 'help',
  ABOUT: 'about',
  CONFIRM: 'confirm',
};

// Storage Keys
export const STORAGE_KEYS = {
  PLAYER_DATA: 'tictacplus_player',
  GAME_SETTINGS: 'tictacplus_settings',
  GAME_HISTORY: 'tictacplus_history',
  THEME: 'tictacplus_theme',
  SOUND_ENABLED: 'tictacplus_sound',
  ANIMATION_LEVEL: 'tictacplus_animations',
  TUTORIAL_COMPLETED: 'tictacplus_tutorial',
  AUTH_TOKEN: 'tictacplus_auth_token',
  REFRESH_TOKEN: 'tictacplus_refresh_token',
  DEVICE_ID: 'tictacplus_device_id',
  USER_SESSION: 'tictacplus_user_session',
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://172.236.22.145/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://172.236.22.145',

  // Authentication
  AUTH: '/api/auth',
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',

  // Player
  PLAYER: '/api/player',
  PLAYER_PROFILE: '/api/player/profile',
  PLAYER_STATS: '/api/player/stats',
  PLAYER_HISTORY: '/api/player/history',

  // Game
  GAMES: '/api/games',
  GAME_CREATE: '/api/games/create',
  GAME_JOIN: '/api/games/join',
  GAME_LEAVE: '/api/games/leave',
  GAME_STATE: '/api/games/state',

  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
  LEADERBOARD_GLOBAL: '/api/leaderboard/global',
  LEADERBOARD_FRIENDS: '/api/leaderboard/friends',

  // Matchmaking
  MATCHMAKING: '/api/matchmaking',
  MATCHMAKING_QUEUE: '/api/matchmaking/queue',
  MATCHMAKING_CANCEL: '/api/matchmaking/cancel',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_MOVE: 'Invalid move. Please try again.',
  GAME_NOT_FOUND: 'Game not found.',
  PLAYER_NOT_FOUND: 'Player not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  GAME_FULL: 'Game is full.',
  ALREADY_IN_GAME: 'You are already in a game.',
  NOT_YOUR_TURN: 'It is not your turn.',
  GAME_ENDED: 'Game has already ended.',
  CONNECTION_LOST: 'Connection to server lost.',
  TIMEOUT: 'Request timed out.',
  VALIDATION_ERROR: 'Invalid input data.',
  RATE_LIMITED: 'Too many requests. Please slow down.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully!',
  GAME_JOINED: 'Joined game successfully!',
  MOVE_MADE: 'Move made successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  MATCH_FOUND: 'Match found! Starting game...',
  CONNECTED: 'Connected to server!',
};

// Validation Rules (Must match backend validation)
export const VALIDATION = {
  PLAYER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
  },
  DEVICE_ID: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 100,
  },
  ROOM_CODE: {
    LENGTH: 6,
    PATTERN: /^[A-Z0-9]{6}$/,
  },
  MESSAGE: {
    MAX_LENGTH: 200,
  },
};

// Performance Metrics
export const PERFORMANCE = {
  TARGET_FPS: 60,
  MAX_PARTICLES: 100,
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
};

// Accessibility
export const A11Y = {
  FOCUS_TRAP_ENABLED: true,
  SCREEN_READER_ENABLED: true,
  HIGH_CONTRAST_SUPPORT: true,
  REDUCED_MOTION_SUPPORT: true,
  KEYBOARD_NAVIGATION: true,
};

// Feature Flags
export const FEATURES = {
  MULTIPLAYER: true,
  AI_OPPONENT: true,
  TOURNAMENTS: false,
  CHAT: true,
  SPECTATING: true,
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  PWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  SOUND: import.meta.env.VITE_ENABLE_SOUND === 'true',
  PARTICLES: true,
  ANIMATIONS: true,
};

// Development
export const DEV = {
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  SHOW_PERFORMANCE: import.meta.env.VITE_SHOW_PERFORMANCE === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
};