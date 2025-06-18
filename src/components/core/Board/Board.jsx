import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames';

// Components
import Cell from '../Cell/Cell';

// Store
import {
  makeMove,
  makeAIMove,
  makeOnlineMove,
  selectGame,
  selectCanMakeMove,
  selectIsOnlineGame
} from '../../../store/slices/gameSlice';

// Utils
import { GAME_MODES, GAME_STATES, PLAYER_TYPES } from '../../../utils/constants';
import { isValidMove } from '../../../utils/gameLogic';

// Hooks
import { useSound } from '../../../hooks/useSound';
import { useAnimation } from '../../../hooks/useAnimation';

// Styles
import styles from './Board.module.scss';

const Board = ({
  className,
  disabled = false,
  showCoordinates = false,
  onCellClick,
  ...props
}) => {
  const dispatch = useDispatch();
  const boardRef = useRef(null);

  // Redux state
  const game = useSelector(selectGame);
  const canMakeMove = useSelector(selectCanMakeMove);
  const isOnlineGame = useSelector(selectIsOnlineGame);

  // Hooks
  const { playSound } = useSound();
  const { triggerAnimation } = useAnimation();

  const {
    board,
    currentPlayer,
    mode,
    playerX,
    playerO,
    winner,
    winningLine,
    lastMove,
    highlightedCells,
    animatingCells,
    isThinking,
    status,
  } = game;

  // Handle cell click with debouncing
  const handleCellClick = useCallback(async (position) => {
    // Prevent clicks if disabled or game conditions don't allow
    if (disabled || !canMakeMove || !isValidMove(board, position)) {
      return;
    }

    // Prevent rapid multiple clicks on the same cell
    const cellKey = `cell-${position}`;
    if (boardRef.current?.dataset.processing === cellKey) {
      return;
    }

    // Custom click handler
    if (onCellClick) {
      onCellClick(position);
      return;
    }

    // Mark as processing
    if (boardRef.current) {
      boardRef.current.dataset.processing = cellKey;
    }

    try {
      // Play click sound
      playSound('click');

      // Determine current player ID
      const currentPlayerId = currentPlayer === 'X' ? playerX.id : playerO.id;

      // Debug logging for development (reduced verbosity)
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MOVES) {
        console.log('Making move:', {
          position,
          currentPlayer,
          currentPlayerId,
          playerX: playerX.id,
          playerO: playerO.id
        });
      }

      // Make the move - use online move for online games
      if (isOnlineGame) {
        await dispatch(makeOnlineMove({
          position,
          playerId: currentPlayerId,
          gameId: game.gameId
        })).unwrap();
      } else {
        await dispatch(makeMove({ position, playerId: currentPlayerId })).unwrap();
      }

      // Trigger cell animation
      triggerAnimation('cellClick', position);

    } catch (error) {
      // Only log non-game-logic errors to avoid spam
      if (error.message !== 'Not your turn' &&
        error.message !== 'Cell already occupied' &&
        error.message !== 'Game is not in playing state') {
        console.error('Failed to make move:', error);
      }
      playSound('error');
    } finally {
      // Clear processing flag
      if (boardRef.current) {
        delete boardRef.current.dataset.processing;
      }
    }
  }, [
    disabled,
    canMakeMove,
    board,
    onCellClick,
    dispatch,
    currentPlayer,
    playerX.id,
    playerO.id,
    mode,
    isOnlineGame,
    game.gameId,
    playSound,
    triggerAnimation
  ]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!canMakeMove || disabled) return;

    const { key } = event;
    const focusedElement = document.activeElement;

    // Check if a cell is focused
    if (!focusedElement?.dataset?.position) return;

    const currentPosition = parseInt(focusedElement.dataset.position);
    let newPosition = currentPosition;

    switch (key) {
      case 'ArrowUp':
        newPosition = currentPosition - 3;
        break;
      case 'ArrowDown':
        newPosition = currentPosition + 3;
        break;
      case 'ArrowLeft':
        newPosition = currentPosition - 1;
        break;
      case 'ArrowRight':
        newPosition = currentPosition + 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleCellClick(currentPosition);
        return;
      default:
        return;
    }

    // Validate new position
    if (newPosition >= 0 && newPosition < 9) {
      event.preventDefault();
      const newCell = boardRef.current?.querySelector(`[data-position="${newPosition}"]`);
      newCell?.focus();
    }
  }, [canMakeMove, disabled, handleCellClick]);

  // Handle AI moves when it's AI's turn
  // Memoize AI move callback to prevent unnecessary re-runs
  const handleAIMove = useCallback(() => {
    if (mode === GAME_MODES.AI &&
      status === GAME_STATES.PLAYING &&
      currentPlayer === 'O' &&
      !isThinking) {
      console.log('Triggering AI move in 500ms...');
      // Small delay for better UX
      const timeoutId = setTimeout(() => {
        console.log('Dispatching AI move now');
        dispatch(makeAIMove());
      }, 500);

      return timeoutId;
    }
    return null;
  }, [mode, status, currentPlayer, isThinking, dispatch]);

  useEffect(() => {
    // Only log when conditions actually change
    const shouldTriggerAI = mode === GAME_MODES.AI &&
      status === GAME_STATES.PLAYING &&
      currentPlayer === 'O' &&
      !isThinking;

    // Only log when AI should actually trigger to reduce noise
    if (shouldTriggerAI) {
      console.log('AI useEffect triggered - AI will move:', {
        mode,
        status,
        currentPlayer,
        isThinking
      });
    }

    const timeoutId = handleAIMove();

    if (timeoutId) {
      return () => {
        console.log('Clearing AI timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [mode, status, currentPlayer, isThinking, handleAIMove]);

  // Add keyboard event listener
  useEffect(() => {
    const boardElement = boardRef.current;
    if (boardElement) {
      boardElement.addEventListener('keydown', handleKeyDown);
      return () => boardElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Determine if board should be disabled
  const isBoardDisabled = disabled ||
    !canMakeMove ||
    isThinking ||
    (mode === GAME_MODES.AI && currentPlayer === 'O' && playerO.type === PLAYER_TYPES.AI);

  return (
    <motion.div
      ref={boardRef}
      className={classNames(styles.board, className, {
        [styles.disabled]: isBoardDisabled,
        [styles.thinking]: isThinking,
        [styles.gameOver]: winner,
        [styles.showCoordinates]: showCoordinates,
      })}
      layout={false}
      role="grid"
      aria-label="Tic Tac Toe Game Board"
      aria-describedby="game-status"
      {...props}
    >
      {/* Board cells */}
      <div className={styles.cells}>
        {board.map((cell, index) => (
          <div
            key={`cell-${index}`}
            className={styles.cellWrapper}
          >
            <Cell
              position={index}
              value={cell}
              onClick={() => handleCellClick(index)}
              disabled={isBoardDisabled || cell !== null}
              isLastMove={lastMove === index}
              isHighlighted={highlightedCells.includes(index)}
              isAnimating={animatingCells.includes(index)}
              isWinning={winningLine?.includes(index)}
              showCoordinates={showCoordinates}
              tabIndex={canMakeMove && cell === null ? 0 : -1}
              data-position={index}
              aria-label={`Cell ${index + 1}, ${cell ? `occupied by ${cell}` : 'empty'
                }`}
            />
          </div>
        ))}
      </div>

      {/* Coordinates display */}
      {showCoordinates && (
        <div className={styles.coordinates}>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className={styles.coordinate}>
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Screen reader game status */}
      <div id="game-status" className="sr-only">
        {winner
          ? `Game over. ${winner} wins!`
          : `Current turn: ${currentPlayer}. ${canMakeMove ? 'Make your move.' : 'Waiting for opponent.'
          }`
        }
      </div>
    </motion.div>
  );
};

// Export the Board component without memoization to prevent comparison issues
export default Board;