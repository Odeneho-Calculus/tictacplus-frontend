import React, { useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames';

// Components
import GamePiece from '../GamePiece/GamePiece';

// Hooks
import { useSound } from '../../../hooks/useSound';

// Styles
import styles from './Cell.module.scss';

const Cell = ({
  position,
  value,
  onClick,
  disabled = false,
  isLastMove = false,
  isHighlighted = false,
  isAnimating = false,
  isWinning = false,
  showCoordinates = false,
  className,
  tabIndex = -1,
  'data-position': dataPosition,
  'aria-label': ariaLabel,
  ...props
}) => {
  const cellRef = useRef(null);
  const { playSound } = useSound();

  // Handle click with sound and animation
  const handleClick = useCallback((event) => {
    if (disabled || value !== null) return;

    // Prevent event bubbling
    event.stopPropagation();

    // Play hover sound
    playSound('buttonClick');

    // Call parent onClick
    if (onClick) {
      onClick(position);
    }
  }, [disabled, value, onClick, position, playSound]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((event) => {
    if (disabled || value !== null) return;

    const { key } = event;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  }, [disabled, value, handleClick]);

  // Handle mouse enter for sound
  const handleMouseEnter = useCallback(() => {
    if (!disabled && value === null) {
      playSound('buttonHover');
    }
  }, [disabled, value, playSound]);

  // Focus management for accessibility
  useEffect(() => {
    const cell = cellRef.current;
    if (!cell) return;

    // Add event listeners
    cell.addEventListener('keydown', handleKeyDown);

    return () => {
      cell.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Animation variants
  const cellVariants = {
    initial: {
      scale: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    hover: {
      scale: 1.05,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    highlighted: {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      scale: 1.02,
      transition: { duration: 0.3 }
    },
    winning: {
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
      scale: 1.1,
      boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse'
      }
    },
    lastMove: {
      backgroundColor: 'rgba(251, 146, 60, 0.2)',
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  const pieceVariants = {
    initial: {
      scale: 1,
      rotate: 0,
      opacity: 1
    },
    animate: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.2
      }
    },
    exit: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: { duration: 0 }
    }
  };

  // Determine cell state for styling
  const cellState = isWinning ? 'winning' :
    isHighlighted ? 'highlighted' :
      isLastMove ? 'lastMove' :
        'initial';

  return (
    <motion.button
      ref={cellRef}
      className={classNames(styles.cell, className, {
        [styles.empty]: value === null,
        [styles.occupied]: value !== null,
        [styles.disabled]: disabled,
        [styles.lastMove]: isLastMove,
        [styles.highlighted]: isHighlighted,
        [styles.animating]: isAnimating,
        [styles.winning]: isWinning,
        [styles.showCoordinates]: showCoordinates,
      })}
      variants={cellVariants}
      initial="initial"
      animate={cellState}
      whileHover={!disabled && value === null ? "hover" : undefined}
      whileTap={!disabled && value === null ? "tap" : undefined}
      layout={false}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled || value !== null}
      tabIndex={tabIndex}
      data-position={dataPosition || position}
      aria-label={ariaLabel || `Cell ${position + 1}, ${value ? `occupied by ${value}` : 'empty'}`}
      role="gridcell"
      aria-pressed={value !== null}
      {...props}
    >
      {/* Cell content */}
      <div className={styles.content}>
        <AnimatePresence>
          {value && (
            <motion.div
              key={`piece-${position}-${value}`}
              variants={pieceVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={styles.pieceContainer}
            >
              <GamePiece
                type={value}
                size="medium"
                animated={true}
                glowing={isWinning}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty cell indicator */}
        {value === null && !disabled && (
          <motion.div
            className={styles.emptyIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            whileHover={{ opacity: 0.6 }}
          >
            <div className={styles.crosshair}>
              <span className={styles.horizontal}></span>
              <span className={styles.vertical}></span>
            </div>
          </motion.div>
        )}

        {/* Position number for coordinates */}
        {showCoordinates && (
          <div className={styles.positionNumber}>
            {position + 1}
          </div>
        )}
      </div>

      {/* Ripple effect */}
      <motion.div
        className={styles.ripple}
        initial={{ scale: 0, opacity: 0.5 }}
        animate={isAnimating ? {
          scale: 2,
          opacity: 0,
          transition: { duration: 0.6 }
        } : {}}
      />

      {/* Focus indicator */}
      <div className={styles.focusIndicator} />
    </motion.button>
  );
};

// Memoize the Cell component to prevent unnecessary re-renders
export default memo(Cell, (prevProps, nextProps) => {
  // Only re-render if meaningful props have changed
  return (
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isLastMove === nextProps.isLastMove &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isAnimating === nextProps.isAnimating &&
    prevProps.isWinning === nextProps.isWinning &&
    prevProps.showCoordinates === nextProps.showCoordinates &&
    prevProps.position === nextProps.position
  );
});