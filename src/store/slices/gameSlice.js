import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { GAME_STATES, PLAYER_TYPES, GAME_MODES, STORAGE_KEYS } from '../../utils/constants';
import { checkWinner, getAvailableMoves, isGameOver } from '../../utils/gameLogic';
import { gameService } from '../../services/gameService';

// Async thunks
export const makeMove = createAsyncThunk(
  'game/makeMove',
  async ({ position, playerId }, { getState, dispatch }) => {
    const { game, socket } = getState();

    // Validate move
    if (game.board[position] !== null) {
      throw new Error('Cell already occupied');
    }

    // Check if it's the correct player's turn
    const expectedPlayerId = game.currentPlayer === 'X' ? game.playerX.id : game.playerO.id;
    if (expectedPlayerId !== playerId) {
      throw new Error('Not your turn');
    }

    if (game.status !== GAME_STATES.PLAYING) {
      throw new Error('Game is not in playing state');
    }

    // If online game, emit move to server
    if (game.mode === GAME_MODES.ONLINE && socket.socket) {
      socket.socket.emit('makeMove', {
        gameId: game.gameId,
        position,
        playerId
      });
    }

    return { position, playerId };
  }
);

export const startNewGame = createAsyncThunk(
  'game/startNewGame',
  async (gameConfig, { dispatch }) => {
    const {
      mode = GAME_MODES.LOCAL,
      difficulty = 'medium',
      playerX = null,
      playerO = null,
      gameId = null
    } = gameConfig;

    return {
      mode,
      difficulty,
      playerX,
      playerO,
      gameId,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: GAME_STATES.PLAYING,
      winner: null,
      winningLine: null,
      moveHistory: [],
      startTime: Date.now(),
    };
  }
);

export const makeAIMove = createAsyncThunk(
  'game/makeAIMove',
  async (_, { getState }) => {
    const { game } = getState();

    if (game.status !== GAME_STATES.PLAYING) {
      throw new Error('Game is not in playing state');
    }

    // Import AI service dynamically to avoid circular dependencies
    const { getAIMove } = await import('../../services/ai/minimax');
    const position = getAIMove(game.board, game.difficulty);

    if (position === -1) {
      throw new Error('No valid moves available');
    }

    return { position, playerId: 'O' };
  }
);

// Save game state to database
export const saveGameState = createAsyncThunk(
  'game/saveGameState',
  async (_, { getState, rejectWithValue }) => {
    const { game, player, auth } = getState();

    // Only save if game is active and has meaningful progress
    if (game.status !== GAME_STATES.PLAYING || game.moveHistory.length === 0) {
      return null;
    }

    // Skip saving if not authenticated and game is local mode
    if (!auth?.user?.id && !auth?.token) {
      console.log('Skipping game state save - no authentication available');
      return null;
    }

    try {
      const gameState = {
        gameId: game.gameId,
        board: game.board,
        currentPlayer: game.currentPlayer,
        mode: game.mode,
        playerX: game.playerX,
        playerO: game.playerO,
        status: game.status,
        moveHistory: game.moveHistory,
        startTime: game.startTime,
        difficulty: game.difficulty,
        playerId: auth.user?.id || player.id
      };

      const result = await gameService.saveGameState({ gameState });
      return result.data?.gameId || result.gameId;
    } catch (error) {
      console.error('Error saving game state:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Load game state from database
export const loadGameState = createAsyncThunk(
  'game/loadGameState',
  async (gameId, { getState, rejectWithValue }) => {
    const { player, auth } = getState();

    try {
      const result = await gameService.loadGameState(gameId);
      return result.data?.gameState || result.gameState;
    } catch (error) {
      console.error('Error loading game state:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Check for saved game state
export const checkSavedGame = createAsyncThunk(
  'game/checkSavedGame',
  async (_, { getState, rejectWithValue }) => {
    const { player, auth } = getState();

    try {
      const result = await gameService.checkSavedGame();
      return result.data || result;
    } catch (error) {
      console.error('Error checking saved game:', error);
      return null; // Return null instead of rejecting for this case
    }
  }
);

// Create online game
export const createOnlineGame = createAsyncThunk(
  'game/createOnlineGame',
  async (gameConfig, { getState, rejectWithValue }) => {
    const { auth } = getState();

    // Ensure user is authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return rejectWithValue('Authentication required to create an online game');
    }

    try {
      const result = await gameService.createGame({
        ...gameConfig,
        mode: GAME_MODES.ONLINE,
        createdBy: auth.user.id,
        token: auth.token // Include token for authentication
      });
      return result.data || result;
    } catch (error) {
      console.error('Error creating online game:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Join online game
export const joinOnlineGame = createAsyncThunk(
  'game/joinOnlineGame',
  async (gameId, { getState, rejectWithValue }) => {
    const { auth } = getState();

    // Ensure user is authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return rejectWithValue('Authentication required to join an online game');
    }

    try {
      const result = await gameService.joinGame(gameId, {
        playerId: auth.user.id,
        playerName: auth.user.displayName || auth.user.username,
        token: auth.token // Include token for authentication
      });
      return result.data || result;
    } catch (error) {
      console.error('Error joining online game:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Find match (matchmaking)
export const findMatch = createAsyncThunk(
  'game/findMatch',
  async (preferences, { getState, rejectWithValue }) => {
    const { auth } = getState();

    // Ensure user is authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return rejectWithValue('Authentication required to find a match');
    }

    try {
      const result = await gameService.findMatch({
        ...preferences,
        playerId: auth.user.id,
        playerName: auth.user.displayName || auth.user.username,
        elo: auth.user.stats?.elo || 1200,
        token: auth.token // Include token for authentication
      });
      return result.data || result;
    } catch (error) {
      console.error('Error finding match:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Cancel matchmaking
export const cancelMatchmaking = createAsyncThunk(
  'game/cancelMatchmaking',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();

    // Ensure user is authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return rejectWithValue('Authentication required to cancel matchmaking');
    }

    try {
      const result = await gameService.cancelMatchmaking({
        playerId: auth.user.id,
        token: auth.token // Include token for authentication
      });
      return result.data || result;
    } catch (error) {
      console.error('Error canceling matchmaking:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Make online move
export const makeOnlineMove = createAsyncThunk(
  'game/makeOnlineMove',
  async ({ gameId, position }, { getState, rejectWithValue }) => {
    const { auth } = getState();

    // Ensure user is authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return rejectWithValue('Authentication required to make a move in an online game');
    }

    try {
      const result = await gameService.makeMove(gameId, {
        position,
        playerId: auth.user.id,
        token: auth.token // Include token for authentication
      });
      return result.data || result;
    } catch (error) {
      console.error('Error making online move:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Leave online game
export const leaveOnlineGame = createAsyncThunk(
  'game/leaveOnlineGame',
  async (gameId, { getState, rejectWithValue }) => {
    const { auth } = getState();

    // Ensure user is authenticated
    if (!auth.isAuthenticated || !auth.user?.id) {
      return rejectWithValue('Authentication required to leave an online game');
    }

    try {
      const result = await gameService.leaveGame(gameId, {
        playerId: auth.user.id,
        token: auth.token // Include token for authentication
      });
      return result.data || result;
    } catch (error) {
      console.error('Error leaving online game:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get active games
export const getActiveGames = createAsyncThunk(
  'game/getActiveGames',
  async (filters, { rejectWithValue }) => {
    try {
      const result = await gameService.getActiveGames(filters);
      return result.data || result;
    } catch (error) {
      console.error('Error getting active games:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get matchmaking queue info
export const getMatchmakingQueueInfo = createAsyncThunk(
  'game/getMatchmakingQueueInfo',
  async (_, { rejectWithValue }) => {
    try {
      const result = await gameService.getMatchmakingQueueInfo();
      return result.data || result;
    } catch (error) {
      console.error('Error getting matchmaking queue info:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get pending invitations
export const getPendingInvitations = createAsyncThunk(
  'game/getPendingInvitations',
  async (_, { rejectWithValue }) => {
    try {
      const result = await gameService.getPendingInvitations();
      return result.data || result;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Restore game state from saved data
export const restoreGameState = createAsyncThunk(
  'game/restoreGameState',
  async (savedGameState, { dispatch }) => {
    // Restore the game state
    dispatch(gameSlice.actions.restoreState(savedGameState));

    // If it's an AI game and it's AI's turn, make AI move
    if (savedGameState.mode === GAME_MODES.AI &&
      savedGameState.currentPlayer === 'O' &&
      savedGameState.status === GAME_STATES.PLAYING) {
      setTimeout(() => {
        dispatch(makeAIMove());
      }, 1000);
    }

    return savedGameState;
  }
);

// Clear saved game
export const clearSavedGame = createAsyncThunk(
  'game/clearSavedGame',
  async (gameId, { rejectWithValue }) => {
    try {
      if (gameId) {
        await gameService.deleteSavedGame(gameId);
      }
      return true;
    } catch (error) {
      console.error('Error clearing saved game:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Game invitation async thunks
export const acceptGameInvitation = createAsyncThunk(
  'game/acceptGameInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await gameService.acceptGameInvitation(invitationId);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const declineGameInvitation = createAsyncThunk(
  'game/declineGameInvitation',
  async (invitationId, { rejectWithValue }) => {
    try {
      const response = await gameService.declineGameInvitation(invitationId);
      return response.data;
    } catch (error) {
      console.error('Error declining invitation:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const sendGameInvitation = createAsyncThunk(
  'game/sendGameInvitation',
  async ({ playerId, message }, { rejectWithValue }) => {
    try {
      const response = await gameService.sendGameInvitation({
        playerId,
        message: message || 'Would you like to play a game?'
      });
      return response.data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Game reconnection async thunks
export const reconnectToGame = createAsyncThunk(
  'game/reconnectToGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await gameService.reconnectToGame(gameId);
      return response.data;
    } catch (error) {
      console.error('Error reconnecting to game:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const leaveGame = createAsyncThunk(
  'game/leaveGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await gameService.leaveGame(gameId);
      return response.data;
    } catch (error) {
      console.error('Error leaving game:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Tournament async thunks
export const joinTournament = createAsyncThunk(
  'game/joinTournament',
  async ({ tournamentId, player }, { rejectWithValue }) => {
    try {
      const response = await gameService.joinTournament(tournamentId, player);
      return response.data;
    } catch (error) {
      console.error('Error joining tournament:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const leaveTournament = createAsyncThunk(
  'game/leaveTournament',
  async ({ tournamentId, playerId }, { rejectWithValue }) => {
    try {
      const response = await gameService.leaveTournament(tournamentId, playerId);
      return response.data;
    } catch (error) {
      console.error('Error leaving tournament:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const startTournamentMatch = createAsyncThunk(
  'game/startTournamentMatch',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await gameService.startTournamentMatch(matchId);
      return response.data;
    } catch (error) {
      console.error('Error starting tournament match:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Game state
  gameId: null,
  mode: GAME_MODES.LOCAL,
  status: GAME_STATES.WAITING,
  board: Array(9).fill(null),
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  isDraw: false,

  // Players
  playerX: {
    id: 'player1',
    name: 'Player 1',
    type: PLAYER_TYPES.HUMAN,
    score: 0,
    avatar: null,
  },
  playerO: {
    id: 'ai',
    name: 'AI Opponent',
    displayName: 'AI Opponent',
    type: PLAYER_TYPES.AI,
    score: 0,
    avatar: null,
  },

  // Game settings
  difficulty: 'medium',
  timeLimit: null,
  roundLimit: null,

  // Game history
  moveHistory: [],
  gameHistory: [],
  currentRound: 1,

  // Timing
  startTime: null,
  endTime: null,
  turnStartTime: null,
  timeRemaining: null,

  // UI state
  isThinking: false,
  lastMove: null,
  highlightedCells: [],
  animatingCells: [],

  // Statistics
  totalGames: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDraw: 0,
  isForfeited: false,

  // Online game state
  isMatchmaking: false,
  matchmakingPreferences: null,
  activeGames: [],
  spectators: [],

  // Additional online game properties
  pendingInvitations: [],
  reconnectionAttempts: 0,
  matchmakingStatus: 'idle',
  matchmakingTime: 0,
  matchmakingQueue: [],
  tournament: null,
  tournamentBracket: null,
  tournamentMatches: [],

  // Saved game state
  hasSavedGame: false,
  savedGameId: null,

  // Loading states
  isLoading: false,
  error: null,
};

// Game slice
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Game control
    resetGame: (state) => {
      state.board = Array(9).fill(null);
      state.currentPlayer = 'X';
      state.status = GAME_STATES.PLAYING;
      state.winner = null;
      state.winningLine = null;
      state.isDraw = false;
      state.moveHistory = [];
      state.startTime = Date.now();
      state.endTime = null;
      state.turnStartTime = Date.now();
      state.timeRemaining = state.timeLimit;
      state.lastMove = null;
      state.highlightedCells = [];
      state.animatingCells = [];
      state.isThinking = false;
      state.isForfeited = false;
      state.error = null;
    },

    setGameMode: (state, action) => {
      state.mode = action.payload;
    },

    setDifficulty: (state, action) => {
      state.difficulty = action.payload;
    },

    setPlayers: (state, action) => {
      const { playerX, playerO } = action.payload;
      if (playerX) state.playerX = { ...state.playerX, ...playerX };
      if (playerO) state.playerO = { ...state.playerO, ...playerO };
    },

    // Turn management
    switchPlayer: (state) => {
      state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
      state.turnStartTime = Date.now();
      state.timeRemaining = state.timeLimit;
    },

    setThinking: (state, action) => {
      state.isThinking = action.payload;
    },

    // Board updates
    updateBoard: (state, action) => {
      const { position, player } = action.payload;
      state.board[position] = player;
      state.lastMove = position;
      state.moveHistory.push({
        position,
        player,
        timestamp: Date.now(),
      });
    },

    highlightCells: (state, action) => {
      state.highlightedCells = action.payload;
    },

    setAnimatingCells: (state, action) => {
      state.animatingCells = action.payload;
    },

    // Game end
    setWinner: (state, action) => {
      const { winner, winningLine } = action.payload;
      state.winner = winner;
      state.winningLine = winningLine;
      state.status = GAME_STATES.FINISHED;
      state.endTime = Date.now();

      // Update scores
      if (winner === 'X') {
        state.playerX.score += 1;
        state.gamesWon += 1;
      } else if (winner === 'O') {
        state.playerO.score += 1;
        state.gamesLost += 1;
      }

      state.totalGames += 1;
    },

    setDraw: (state) => {
      state.isDraw = true;
      state.status = GAME_STATES.FINISHED;
      state.endTime = Date.now();
      state.gamesDraw += 1;
      state.totalGames += 1;
    },

    // Timer
    updateTimeRemaining: (state, action) => {
      state.timeRemaining = action.payload;
    },

    setTimeLimit: (state, action) => {
      state.timeLimit = action.payload;
      state.timeRemaining = action.payload;
    },

    // Online game
    setGameId: (state, action) => {
      state.gameId = action.payload;
    },

    updateGameState: (state, action) => {
      const gameState = action.payload;
      Object.assign(state, gameState);
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Loading
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // Game control actions

    forfeitGame: (state) => {
      if (state.status === GAME_STATES.PLAYING) {
        state.status = GAME_STATES.FINISHED;
        state.endTime = Date.now();

        // Determine winner based on current player (opponent wins)
        const winner = state.currentPlayer === 'X' ? 'O' : 'X';
        state.winner = winner;

        // Update scores
        if (winner === 'X') {
          state.playerX.score += 1;
          state.gamesLost += 1; // Current player forfeited
        } else {
          state.playerO.score += 1;
          state.gamesWon += 1; // Current player forfeited
        }

        state.totalGames += 1;
        state.isForfeited = true;
      }
    },

    playAgain: (state) => {
      // Keep the same game configuration but reset the game state
      const currentMode = state.mode;
      const currentDifficulty = state.difficulty;
      const currentPlayerX = { ...state.playerX };
      const currentPlayerO = { ...state.playerO };

      // Reset game state
      state.board = Array(9).fill(null);
      state.currentPlayer = 'X';
      state.status = GAME_STATES.PLAYING;
      state.winner = null;
      state.winningLine = null;
      state.isDraw = false;
      state.moveHistory = [];
      state.startTime = Date.now();
      state.endTime = null;
      state.turnStartTime = Date.now();
      state.timeRemaining = state.timeLimit;
      state.lastMove = null;
      state.highlightedCells = [];
      state.animatingCells = [];
      state.isThinking = false;
      state.isForfeited = false;
      state.error = null;
      state.isLoading = false;

      // Restore configuration
      state.mode = currentMode;
      state.difficulty = currentDifficulty;
      state.playerX = currentPlayerX;
      state.playerO = currentPlayerO;
    },

    // Online game reducers
    setMatchmaking: (state, action) => {
      state.isMatchmaking = action.payload;
      if (action.payload) {
        state.matchmakingStatus = 'searching';
        state.matchmakingTime = 0;
      } else {
        state.matchmakingStatus = 'idle';
      }
    },

    setMatchmakingPreferences: (state, action) => {
      state.matchmakingPreferences = action.payload;
    },

    setMatchmakingStatus: (state, action) => {
      state.matchmakingStatus = action.payload;
    },

    updateMatchmakingTime: (state, action) => {
      state.matchmakingTime = action.payload;
    },

    setMatchmakingQueue: (state, action) => {
      state.matchmakingQueue = action.payload;
    },

    setActiveGames: (state, action) => {
      state.activeGames = action.payload;
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

    // Restore complete state
    restoreState: (state, action) => {
      const savedState = action.payload;
      Object.assign(state, savedState);
      state.isLoading = false;
      state.error = null;
    },

    // Set saved game info
    setSavedGameInfo: (state, action) => {
      const { hasSavedGame, savedGameId } = action.payload;
      state.hasSavedGame = hasSavedGame;
      state.savedGameId = savedGameId;
    },
  },

  extraReducers: (builder) => {
    builder
      // Make move
      .addCase(makeMove.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makeMove.fulfilled, (state, action) => {
        const { position, playerId } = action.payload;
        const player = playerId === state.playerX.id ? 'X' : 'O';

        // Update board
        state.board[position] = player;
        state.lastMove = position;
        state.moveHistory.push({
          position,
          player,
          playerId,
          timestamp: Date.now(),
        });

        // Check for winner
        const winner = checkWinner(state.board);
        if (winner) {
          state.winner = winner.player;
          state.winningLine = winner.line;
          state.status = GAME_STATES.FINISHED;
          state.endTime = Date.now();

          // Update scores
          if (winner.player === 'X') {
            state.playerX.score += 1;
            state.gamesWon += 1;
          } else {
            state.playerO.score += 1;
            state.gamesLost += 1;
          }
          state.totalGames += 1;
        } else if (isGameOver(state.board)) {
          state.isDraw = true;
          state.status = GAME_STATES.FINISHED;
          state.endTime = Date.now();
          state.gamesDraw += 1;
          state.totalGames += 1;
        } else {
          // Switch player
          state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
          state.turnStartTime = Date.now();
          state.timeRemaining = state.timeLimit;
        }

        state.isLoading = false;
      })
      .addCase(makeMove.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      })

      // Start new game
      .addCase(startNewGame.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startNewGame.fulfilled, (state, action) => {
        // Reset all game state first
        state.board = Array(9).fill(null);
        state.currentPlayer = 'X';
        state.status = GAME_STATES.PLAYING;
        state.winner = null;
        state.winningLine = null;
        state.isDraw = false;
        state.moveHistory = [];
        state.startTime = Date.now();
        state.endTime = null;
        state.turnStartTime = Date.now();
        state.timeRemaining = state.timeLimit;
        state.lastMove = null;
        state.highlightedCells = [];
        state.animatingCells = [];
        state.isThinking = false;
        state.isForfeited = false;
        state.error = null;

        // Then apply the new game configuration
        Object.assign(state, action.payload);
        state.isLoading = false;
      })
      .addCase(startNewGame.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      })

      // AI move
      .addCase(makeAIMove.pending, (state) => {
        state.isThinking = true;
        state.error = null;
      })
      .addCase(makeAIMove.fulfilled, (state, action) => {
        const { position } = action.payload;

        // Update board
        state.board[position] = 'O';
        state.lastMove = position;
        state.moveHistory.push({
          position,
          player: 'O',
          playerId: state.playerO.id,
          timestamp: Date.now(),
        });

        // Check for winner
        const winner = checkWinner(state.board);
        if (winner) {
          state.winner = winner.player;
          state.winningLine = winner.line;
          state.status = GAME_STATES.FINISHED;
          state.endTime = Date.now();

          if (winner.player === 'O') {
            state.playerO.score += 1;
            state.gamesLost += 1;
          }
          state.totalGames += 1;
        } else if (isGameOver(state.board)) {
          state.isDraw = true;
          state.status = GAME_STATES.FINISHED;
          state.endTime = Date.now();
          state.gamesDraw += 1;
          state.totalGames += 1;
        } else {
          // Switch to human player
          state.currentPlayer = 'X';
          state.turnStartTime = Date.now();
          state.timeRemaining = state.timeLimit;
        }

        state.isThinking = false;
      })
      .addCase(makeAIMove.rejected, (state, action) => {
        state.error = action.error.message;
        state.isThinking = false;
      })

      // Save game state
      .addCase(saveGameState.pending, (state) => {
        // Don't show loading for background saves
      })
      .addCase(saveGameState.fulfilled, (state, action) => {
        if (action.payload) {
          state.gameId = action.payload;
        }
      })
      .addCase(saveGameState.rejected, (state, action) => {
        // Silently fail for background saves, but log the error
        console.error('Failed to save game state:', action.error.message);
      })

      // Load game state
      .addCase(loadGameState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGameState.fulfilled, (state, action) => {
        if (action.payload) {
          Object.assign(state, action.payload);
        }
        state.isLoading = false;
      })
      .addCase(loadGameState.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      })

      // Check saved game
      .addCase(checkSavedGame.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSavedGame.fulfilled, (state, action) => {
        if (action.payload) {
          state.hasSavedGame = true;
          state.savedGameId = action.payload.gameId;
        } else {
          state.hasSavedGame = false;
          state.savedGameId = null;
        }
        state.isLoading = false;
      })
      .addCase(checkSavedGame.rejected, (state, action) => {
        state.isLoading = false;
        state.hasSavedGame = false;
        state.savedGameId = null;
      })

      // Create online game
      .addCase(createOnlineGame.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOnlineGame.fulfilled, (state, action) => {
        const gameData = action.payload;
        state.gameId = gameData.gameId || gameData.id;
        state.mode = GAME_MODES.ONLINE;
        state.status = GAME_STATES.WAITING;
        state.isLoading = false;

        if (gameData.playerX) state.playerX = gameData.playerX;
        if (gameData.playerO) state.playerO = gameData.playerO;
      })
      .addCase(createOnlineGame.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Join online game
      .addCase(joinOnlineGame.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinOnlineGame.fulfilled, (state, action) => {
        const gameData = action.payload;
        Object.assign(state, gameData);
        state.mode = GAME_MODES.ONLINE;
        state.isLoading = false;
      })
      .addCase(joinOnlineGame.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Find match
      .addCase(findMatch.pending, (state) => {
        state.isMatchmaking = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findMatch.fulfilled, (state, action) => {
        const matchData = action.payload;
        if (matchData.gameId) {
          // Match found
          state.gameId = matchData.gameId;
          state.mode = GAME_MODES.ONLINE;
          state.status = GAME_STATES.PLAYING;
          state.playerX = matchData.playerX;
          state.playerO = matchData.playerO;
          state.isMatchmaking = false;
        } else {
          // Still searching
          state.matchmakingPreferences = matchData.preferences;
        }
        state.isLoading = false;
      })
      .addCase(findMatch.rejected, (state, action) => {
        state.error = action.payload;
        state.isMatchmaking = false;
        state.isLoading = false;
      })

      // Cancel matchmaking
      .addCase(cancelMatchmaking.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelMatchmaking.fulfilled, (state) => {
        state.isMatchmaking = false;
        state.matchmakingPreferences = null;
        state.isLoading = false;
      })
      .addCase(cancelMatchmaking.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Make online move
      .addCase(makeOnlineMove.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makeOnlineMove.fulfilled, (state, action) => {
        const moveData = action.payload;
        // The actual board update will come from socket events
        state.isLoading = false;
      })
      .addCase(makeOnlineMove.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Leave online game
      .addCase(leaveOnlineGame.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(leaveOnlineGame.fulfilled, (state) => {
        state.gameId = null;
        state.mode = GAME_MODES.LOCAL;
        state.status = GAME_STATES.WAITING;
        state.isLoading = false;
      })
      .addCase(leaveOnlineGame.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Get active games
      .addCase(getActiveGames.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getActiveGames.fulfilled, (state, action) => {
        state.activeGames = action.payload.games || action.payload;
        state.isLoading = false;
      })
      .addCase(getActiveGames.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Get matchmaking queue info
      .addCase(getMatchmakingQueueInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMatchmakingQueueInfo.fulfilled, (state, action) => {
        state.matchmakingQueue = action.payload;
        state.isLoading = false;
      })
      .addCase(getMatchmakingQueueInfo.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Get pending invitations
      .addCase(getPendingInvitations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPendingInvitations.fulfilled, (state, action) => {
        state.pendingInvitations = action.payload;
        state.isLoading = false;
      })
      .addCase(getPendingInvitations.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Send game invitation
      .addCase(sendGameInvitation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendGameInvitation.fulfilled, (state, action) => {
        // Could add the invitation to a sent invitations list if needed
        state.isLoading = false;
      })
      .addCase(sendGameInvitation.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Accept game invitation
      .addCase(acceptGameInvitation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(acceptGameInvitation.fulfilled, (state, action) => {
        // Remove the invitation from pending list
        if (action.payload && action.payload.invitationId) {
          state.pendingInvitations = state.pendingInvitations.filter(
            inv => inv.id !== action.payload.invitationId
          );
        }
        state.isLoading = false;
      })
      .addCase(acceptGameInvitation.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Decline game invitation
      .addCase(declineGameInvitation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(declineGameInvitation.fulfilled, (state, action) => {
        // Remove the invitation from pending list
        if (action.payload && action.payload.invitationId) {
          state.pendingInvitations = state.pendingInvitations.filter(
            inv => inv.id !== action.payload.invitationId
          );
        }
        state.isLoading = false;
      })
      .addCase(declineGameInvitation.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Clear saved game
      .addCase(clearSavedGame.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(clearSavedGame.fulfilled, (state) => {
        state.hasSavedGame = false;
        state.savedGameId = null;
        state.isLoading = false;
      })
      .addCase(clearSavedGame.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      })

      // Restore game state
      .addCase(restoreGameState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreGameState.fulfilled, (state, action) => {
        const savedState = action.payload;
        if (savedState && savedState.status === GAME_STATES.PLAYING) {
          Object.assign(state, savedState);
          // Ensure loading states are reset
          state.isLoading = false;
          state.error = null;
          state.isThinking = false;
        }
      })
      .addCase(restoreGameState.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
      });
  },
});

// Export actions
export const {
  resetGame,
  setGameMode,
  setDifficulty,
  setPlayers,
  switchPlayer,
  setThinking,
  updateBoard,
  highlightCells,
  setAnimatingCells,
  setWinner,
  setDraw,
  updateTimeRemaining,
  setTimeLimit,
  setGameId,
  updateGameState,
  setError,
  clearError,
  setLoading,
  forfeitGame,
  playAgain,
  setMatchmaking,
  setMatchmakingPreferences,
  setMatchmakingStatus,
  updateMatchmakingTime,
  setMatchmakingQueue,
  setActiveGames,
  addSpectator,
  removeSpectator,
  restoreState,
  setSavedGameInfo,
} = gameSlice.actions;

// Selectors
export const selectGame = (state) => state.game;
export const selectBoard = (state) => state.game.board;
export const selectCurrentPlayer = (state) => state.game.currentPlayer;
export const selectGameStatus = (state) => state.game.status;
export const selectGameMode = (state) => state.game.mode;
export const selectGameId = (state) => state.game.gameId;
export const selectWinner = (state) => state.game.winner;
export const selectIsGameOver = (state) =>
  state.game.status === GAME_STATES.FINISHED;
export const selectCanMakeMove = (state) =>
  state.game.status === GAME_STATES.PLAYING && !state.game.isThinking;
export const selectIsOnlineGame = (state) =>
  state.game.mode === GAME_MODES.ONLINE;
export const selectIsMatchmaking = (state) => state.game.isMatchmaking;
export const selectActiveGames = (state) => state.game.activeGames;
export const selectSpectators = (state) => state.game.spectators;
export const selectHasSavedGame = (state) => state.game.hasSavedGame;
export const selectSavedGameId = (state) => state.game.savedGameId;
export const selectGameLoading = (state) => state.game.isLoading;
export const selectGameError = (state) => state.game.error;
export const selectGameStats = (state) => ({
  totalGames: state.game.totalGames,
  gamesWon: state.game.gamesWon,
  gamesLost: state.game.gamesLost,
  gamesDraw: state.game.gamesDraw,
  winRate: state.game.totalGames > 0
    ? (state.game.gamesWon / state.game.totalGames * 100).toFixed(1)
    : 0,
});
export const selectPlayers = (state) => ({
  playerX: state.game.playerX,
  playerO: state.game.playerO,
});

// Missing online game selectors
export const selectPendingInvitations = (state) => state.game.pendingInvitations || [];
export const selectReconnectionAttempts = (state) => state.game.reconnectionAttempts || 0;
export const selectMatchmakingStatus = (state) => state.game.matchmakingStatus || 'idle';
export const selectMatchmakingTime = (state) => state.game.matchmakingTime || 0;
export const selectMatchmakingQueue = (state) => state.game.matchmakingQueue || [];
export const selectTournament = (state) => state.game.tournament || null;
export const selectTournamentBracket = (state) => state.game.tournamentBracket || null;
export const selectTournamentMatches = (state) => state.game.tournamentMatches || [];

export default gameSlice.reducer;