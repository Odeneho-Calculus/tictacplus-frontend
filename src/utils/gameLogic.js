import { BOARD_CONFIG, PLAYER_SYMBOLS } from './constants';

/**
 * Check if there's a winner on the board
 * @param {Array} board - The game board array
 * @returns {Object|null} - Winner object with player and winning line, or null
 */
export const checkWinner = (board) => {
  const { WINNING_COMBINATIONS } = BOARD_CONFIG;

  for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
    const [a, b, c] = WINNING_COMBINATIONS[i];

    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        player: board[a],
        line: WINNING_COMBINATIONS[i],
        combination: i,
      };
    }
  }

  return null;
};

/**
 * Check if the game is over (board is full)
 * @param {Array} board - The game board array
 * @returns {boolean} - True if game is over
 */
export const isGameOver = (board) => {
  return board.every(cell => cell !== null);
};

/**
 * Check if the game is a draw
 * @param {Array} board - The game board array
 * @returns {boolean} - True if game is a draw
 */
export const isDraw = (board) => {
  return isGameOver(board) && !checkWinner(board);
};

/**
 * Get all available moves on the board
 * @param {Array} board - The game board array
 * @returns {Array} - Array of available position indices
 */
export const getAvailableMoves = (board) => {
  return board
    .map((cell, index) => cell === null ? index : null)
    .filter(index => index !== null);
};

/**
 * Check if a move is valid
 * @param {Array} board - The game board array
 * @param {number} position - The position to check
 * @returns {boolean} - True if move is valid
 */
export const isValidMove = (board, position) => {
  return position >= 0 &&
         position < BOARD_CONFIG.TOTAL_CELLS &&
         board[position] === null;
};

/**
 * Make a move on the board (returns new board, doesn't mutate)
 * @param {Array} board - The game board array
 * @param {number} position - The position to place the piece
 * @param {string} player - The player symbol ('X' or 'O')
 * @returns {Array} - New board with the move applied
 */
export const makeMove = (board, position, player) => {
  if (!isValidMove(board, position)) {
    throw new Error('Invalid move');
  }

  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
};

/**
 * Get the opposite player
 * @param {string} player - Current player ('X' or 'O')
 * @returns {string} - Opposite player
 */
export const getOpponent = (player) => {
  return player === PLAYER_SYMBOLS.X ? PLAYER_SYMBOLS.O : PLAYER_SYMBOLS.X;
};

/**
 * Evaluate the board for AI (minimax algorithm helper)
 * @param {Array} board - The game board array
 * @param {string} aiPlayer - The AI player symbol
 * @returns {number} - Board evaluation score
 */
export const evaluateBoard = (board, aiPlayer) => {
  const winner = checkWinner(board);

  if (winner) {
    return winner.player === aiPlayer ? 10 : -10;
  }

  return 0; // Draw or game not finished
};

/**
 * Get all winning lines that pass through a position
 * @param {number} position - The board position
 * @returns {Array} - Array of winning combinations that include this position
 */
export const getWinningLinesForPosition = (position) => {
  return BOARD_CONFIG.WINNING_COMBINATIONS.filter(combination =>
    combination.includes(position)
  );
};

/**
 * Check if a position is a corner
 * @param {number} position - The board position
 * @returns {boolean} - True if position is a corner
 */
export const isCorner = (position) => {
  return [0, 2, 6, 8].includes(position);
};

/**
 * Check if a position is the center
 * @param {number} position - The board position
 * @returns {boolean} - True if position is the center
 */
export const isCenter = (position) => {
  return position === 4;
};

/**
 * Check if a position is an edge
 * @param {number} position - The board position
 * @returns {boolean} - True if position is an edge
 */
export const isEdge = (position) => {
  return [1, 3, 5, 7].includes(position);
};

/**
 * Get strategic value of a position
 * @param {number} position - The board position
 * @returns {number} - Strategic value (higher is better)
 */
export const getPositionValue = (position) => {
  if (isCenter(position)) return 3;
  if (isCorner(position)) return 2;
  if (isEdge(position)) return 1;
  return 0;
};

/**
 * Find immediate winning move for a player
 * @param {Array} board - The game board array
 * @param {string} player - The player to check for winning moves
 * @returns {number|null} - Winning position or null
 */
export const findWinningMove = (board, player) => {
  const availableMoves = getAvailableMoves(board);

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    if (checkWinner(testBoard)) {
      return move;
    }
  }

  return null;
};

/**
 * Find blocking move to prevent opponent from winning
 * @param {Array} board - The game board array
 * @param {string} player - The current player
 * @returns {number|null} - Blocking position or null
 */
export const findBlockingMove = (board, player) => {
  const opponent = getOpponent(player);
  return findWinningMove(board, opponent);
};

/**
 * Find fork opportunities (positions that create two winning threats)
 * @param {Array} board - The game board array
 * @param {string} player - The player to check for forks
 * @returns {Array} - Array of fork positions
 */
export const findForkMoves = (board, player) => {
  const availableMoves = getAvailableMoves(board);
  const forkMoves = [];

  for (const move of availableMoves) {
    const testBoard = makeMove(board, move, player);
    let winningMoves = 0;

    // Count how many winning moves this creates
    for (const nextMove of getAvailableMoves(testBoard)) {
      const nextTestBoard = makeMove(testBoard, nextMove, player);
      if (checkWinner(nextTestBoard)) {
        winningMoves++;
      }
    }

    // If this move creates 2 or more winning opportunities, it's a fork
    if (winningMoves >= 2) {
      forkMoves.push(move);
    }
  }

  return forkMoves;
};

/**
 * Get the best strategic move based on position values
 * @param {Array} board - The game board array
 * @returns {number|null} - Best strategic position or null
 */
export const getBestStrategicMove = (board) => {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) return null;

  // Sort moves by strategic value
  availableMoves.sort((a, b) => getPositionValue(b) - getPositionValue(a));

  return availableMoves[0];
};

/**
 * Calculate game statistics
 * @param {Array} moveHistory - Array of moves made in the game
 * @returns {Object} - Game statistics
 */
export const calculateGameStats = (moveHistory) => {
  const totalMoves = moveHistory.length;
  const gameDuration = totalMoves > 0
    ? moveHistory[moveHistory.length - 1].timestamp - moveHistory[0].timestamp
    : 0;

  const playerXMoves = moveHistory.filter(move => move.player === 'X').length;
  const playerOMoves = moveHistory.filter(move => move.player === 'O').length;

  return {
    totalMoves,
    gameDuration,
    playerXMoves,
    playerOMoves,
    averageTimePerMove: totalMoves > 0 ? gameDuration / totalMoves : 0,
  };
};

/**
 * Convert board position to row and column
 * @param {number} position - Board position (0-8)
 * @returns {Object} - Object with row and col properties
 */
export const positionToRowCol = (position) => {
  return {
    row: Math.floor(position / 3),
    col: position % 3,
  };
};

/**
 * Convert row and column to board position
 * @param {number} row - Row index (0-2)
 * @param {number} col - Column index (0-2)
 * @returns {number} - Board position (0-8)
 */
export const rowColToPosition = (row, col) => {
  return row * 3 + col;
};

/**
 * Get adjacent positions to a given position
 * @param {number} position - Board position
 * @returns {Array} - Array of adjacent positions
 */
export const getAdjacentPositions = (position) => {
  const { row, col } = positionToRowCol(position);
  const adjacent = [];

  // Check all 8 directions
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < 3 && c >= 0 && c < 3 && !(r === row && c === col)) {
        adjacent.push(rowColToPosition(r, c));
      }
    }
  }

  return adjacent;
};

/**
 * Check if two positions are adjacent
 * @param {number} pos1 - First position
 * @param {number} pos2 - Second position
 * @returns {boolean} - True if positions are adjacent
 */
export const arePositionsAdjacent = (pos1, pos2) => {
  const adjacent = getAdjacentPositions(pos1);
  return adjacent.includes(pos2);
};

/**
 * Generate a random valid move
 * @param {Array} board - The game board array
 * @returns {number|null} - Random valid position or null
 */
export const getRandomMove = (board) => {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
};

/**
 * Validate game state
 * @param {Object} gameState - The game state object
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateGameState = (gameState) => {
  const errors = [];

  // Check board
  if (!Array.isArray(gameState.board) || gameState.board.length !== 9) {
    errors.push('Invalid board structure');
  }

  // Check current player
  if (!['X', 'O'].includes(gameState.currentPlayer)) {
    errors.push('Invalid current player');
  }

  // Check move count consistency
  const xCount = gameState.board.filter(cell => cell === 'X').length;
  const oCount = gameState.board.filter(cell => cell === 'O').length;

  if (Math.abs(xCount - oCount) > 1) {
    errors.push('Invalid move count distribution');
  }

  // Check if game should be over
  const winner = checkWinner(gameState.board);
  const gameOver = isGameOver(gameState.board);

  if ((winner || gameOver) && gameState.status === 'playing') {
    errors.push('Game status inconsistent with board state');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};