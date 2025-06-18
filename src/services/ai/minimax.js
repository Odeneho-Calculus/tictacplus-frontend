import {
  checkWinner,
  isGameOver,
  getAvailableMoves,
  makeMove,
  getOpponent,
  evaluateBoard,
  findWinningMove,
  findBlockingMove,
  getBestStrategicMove,
  isCenter,
  isCorner,
  getPositionValue,
} from '../../utils/gameLogic';

/**
 * Get AI move based on difficulty level
 * @param {Array} board - Current board state
 * @param {string} difficulty - AI difficulty level
 * @returns {number} - Position to play (0-8) or -1 if no moves available
 */
export const getAIMove = (board, difficulty = 'medium') => {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) {
    return -1; // No moves available
  }

  switch (difficulty) {
    case 'easy':
      return getEasyMove(board, availableMoves);
    case 'medium':
      return getMediumMove(board, availableMoves);
    case 'hard':
      return getHardMove(board, availableMoves);
    case 'expert':
      return getExpertMove(board, availableMoves);
    default:
      return getMediumMove(board, availableMoves);
  }
};

/**
 * Easy AI - mostly random with occasional good moves
 */
const getEasyMove = (board, availableMoves) => {
  // 70% random, 30% strategic
  if (Math.random() < 0.7) {
    return getRandomMove(availableMoves);
  }

  // Try to win if possible
  const winMove = findWinningMove(board, 'O');
  if (winMove !== null) {
    return winMove;
  }

  // Sometimes block player wins
  if (Math.random() < 0.5) {
    const blockMove = findBlockingMove(board, 'O');
    if (blockMove !== null) {
      return blockMove;
    }
  }

  return getRandomMove(availableMoves);
};

/**
 * Medium AI - strategic but not perfect
 */
const getMediumMove = (board, availableMoves) => {
  // Always try to win
  const winMove = findWinningMove(board, 'O');
  if (winMove !== null) {
    return winMove;
  }

  // Always block player wins
  const blockMove = findBlockingMove(board, 'O');
  if (blockMove !== null) {
    return blockMove;
  }

  // Take center if available
  if (availableMoves.includes(4)) {
    return 4;
  }

  // Take corners
  const corners = availableMoves.filter(pos => isCorner(pos));
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // Take any remaining move
  return getBestStrategicMove(board) || getRandomMove(availableMoves);
};

/**
 * Hard AI - uses minimax with limited depth
 */
const getHardMove = (board, availableMoves) => {
  // Always try to win
  const winMove = findWinningMove(board, 'O');
  if (winMove !== null) {
    return winMove;
  }

  // Always block player wins
  const blockMove = findBlockingMove(board, 'O');
  if (blockMove !== null) {
    return blockMove;
  }

  // Use minimax with depth 4
  return minimaxMove(board, 'O', 4);
};

/**
 * Expert AI - uses full minimax algorithm
 */
const getExpertMove = (board, availableMoves) => {
  // Use full minimax (depth 9 for tic-tac-toe is manageable)
  return minimaxMove(board, 'O', 9);
};

/**
 * Minimax algorithm implementation
 */
const minimaxMove = (board, aiPlayer, maxDepth) => {
  const availableMoves = getAvailableMoves(board);
  let bestMove = availableMoves[0];
  let bestScore = -Infinity;

  for (const move of availableMoves) {
    const newBoard = makeMove(board, move, aiPlayer);
    const score = minimax(newBoard, 0, false, aiPlayer, maxDepth, -Infinity, Infinity);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

/**
 * Minimax algorithm with alpha-beta pruning
 */
const minimax = (board, depth, isMaximizing, aiPlayer, maxDepth, alpha, beta) => {
  const winner = checkWinner(board);

  // Terminal states
  if (winner) {
    if (winner.player === aiPlayer) {
      return 10 - depth; // Prefer faster wins
    } else {
      return depth - 10; // Prefer slower losses
    }
  }

  if (isGameOver(board) || depth >= maxDepth) {
    return 0; // Draw
  }

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxScore = -Infinity;

    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, aiPlayer);
      const score = minimax(newBoard, depth + 1, false, aiPlayer, maxDepth, alpha, beta);
      maxScore = Math.max(score, maxScore);
      alpha = Math.max(alpha, score);

      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }

    return maxScore;
  } else {
    let minScore = Infinity;
    const humanPlayer = getOpponent(aiPlayer);

    for (const move of availableMoves) {
      const newBoard = makeMove(board, move, humanPlayer);
      const score = minimax(newBoard, depth + 1, true, aiPlayer, maxDepth, alpha, beta);
      minScore = Math.min(score, minScore);
      beta = Math.min(beta, score);

      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }

    return minScore;
  }
};

/**
 * Get random move from available moves
 */
const getRandomMove = (availableMoves) => {
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};

/**
 * Evaluate position strength for move ordering (optimization)
 */
const evaluatePosition = (board, position, player) => {
  const newBoard = makeMove(board, position, player);

  // Check for immediate win
  if (checkWinner(newBoard)) {
    return 1000;
  }

  // Check for blocking opponent win
  const opponent = getOpponent(player);
  const opponentWin = findWinningMove(board, opponent);
  if (opponentWin === position) {
    return 500;
  }

  // Position value (center > corners > edges)
  return getPositionValue(position);
};

/**
 * Get ordered moves for better alpha-beta pruning
 */
const getOrderedMoves = (board, player) => {
  const availableMoves = getAvailableMoves(board);

  return availableMoves
    .map(move => ({
      move,
      score: evaluatePosition(board, move, player)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.move);
};

/**
 * Advanced AI that considers multiple strategies
 */
export const getAdvancedAIMove = (board, difficulty = 'expert') => {
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) {
    return -1;
  }

  // First move strategy
  if (availableMoves.length === 9) {
    // Take center or corner randomly
    return Math.random() < 0.7 ? 4 : [0, 2, 6, 8][Math.floor(Math.random() * 4)];
  }

  // Always try to win
  const winMove = findWinningMove(board, 'O');
  if (winMove !== null) {
    return winMove;
  }

  // Always block player wins
  const blockMove = findBlockingMove(board, 'O');
  if (blockMove !== null) {
    return blockMove;
  }

  // Use minimax for remaining moves
  const depth = difficulty === 'expert' ? 9 :
                difficulty === 'hard' ? 6 :
                difficulty === 'medium' ? 4 : 2;

  return minimaxMove(board, 'O', depth);
};

/**
 * Get AI thinking time based on difficulty
 */
export const getAIThinkingTime = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return 300 + Math.random() * 500; // 300-800ms
    case 'medium':
      return 500 + Math.random() * 700; // 500-1200ms
    case 'hard':
      return 800 + Math.random() * 1000; // 800-1800ms
    case 'expert':
      return 1000 + Math.random() * 1500; // 1000-2500ms
    default:
      return 500 + Math.random() * 700;
  }
};

/**
 * Get AI personality response based on game state
 */
export const getAIResponse = (gameState, difficulty) => {
  const responses = {
    easy: {
      win: ["Lucky me!", "Oops, did I win?", "That was fun!"],
      lose: ["Good game!", "You got me!", "Well played!"],
      draw: ["Tie game!", "Not bad!", "Let's play again!"],
    },
    medium: {
      win: ["Good game!", "I enjoyed that!", "Well played!"],
      lose: ["Congratulations!", "You played well!", "Nice strategy!"],
      draw: ["Good match!", "Evenly matched!", "Shall we play again?"],
    },
    hard: {
      win: ["Excellent game!", "That was challenging!", "Well fought!"],
      lose: ["Impressive strategy!", "You outplayed me!", "Remarkable game!"],
      draw: ["Perfectly balanced!", "Neither of us gave an inch!", "Masterful play!"],
    },
    expert: {
      win: ["A worthy opponent!", "Fascinating game!", "Your skills are impressive!"],
      lose: ["Exceptional play!", "You have mastered the game!", "I am impressed by your strategy!"],
      draw: ["A perfect stalemate!", "Neither could break the other's defense!", "Truly masterful!"],
    },
  };

  const difficultyResponses = responses[difficulty] || responses.medium;
  const gameResult = gameState.winner ? (gameState.winner === 'O' ? 'win' : 'lose') : 'draw';
  const responseArray = difficultyResponses[gameResult];

  return responseArray[Math.floor(Math.random() * responseArray.length)];
};