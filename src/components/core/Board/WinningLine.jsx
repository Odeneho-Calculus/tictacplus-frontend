import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

// Styles
import styles from './WinningLine.module.scss';

const WinningLine = ({
  line,
  winner,
  onAnimationComplete,
  className,
  ...props
}) => {
  const [lineStyle, setLineStyle] = useState({});

  useEffect(() => {
    if (!line || line.length !== 3) return;

    // Calculate line position and rotation based on winning combination
    const getLineStyle = (winningLine) => {
      const [a, b, c] = winningLine;

      // Define line styles for each winning combination
      const lineStyles = {
        // Rows
        '0,1,2': { // Top row
          top: '16.67%',
          left: '10%',
          right: '10%',
          height: '4px',
          transform: 'translateY(-50%)',
        },
        '3,4,5': { // Middle row
          top: '50%',
          left: '10%',
          right: '10%',
          height: '4px',
          transform: 'translateY(-50%)',
        },
        '6,7,8': { // Bottom row
          top: '83.33%',
          left: '10%',
          right: '10%',
          height: '4px',
          transform: 'translateY(-50%)',
        },

        // Columns
        '0,3,6': { // Left column
          left: '16.67%',
          top: '10%',
          bottom: '10%',
          width: '4px',
          transform: 'translateX(-50%)',
        },
        '1,4,7': { // Middle column
          left: '50%',
          top: '10%',
          bottom: '10%',
          width: '4px',
          transform: 'translateX(-50%)',
        },
        '2,5,8': { // Right column
          left: '83.33%',
          top: '10%',
          bottom: '10%',
          width: '4px',
          transform: 'translateX(-50%)',
        },

        // Diagonals - using width instead of height for proper diagonal rendering
        '0,4,8': { // Top-left to bottom-right diagonal
          top: '16.67%',
          left: '16.67%',
          width: '94.28%', // √((83.33-16.67)² + (83.33-16.67)²) diagonal length
          height: '4px',
          transform: 'rotate(45deg)',
          transformOrigin: 'left center',
        },
        '2,4,6': { // Top-right to bottom-left diagonal
          top: '16.67%',
          right: '16.67%',
          width: '94.28%', // Same diagonal length
          height: '4px',
          transform: 'rotate(-45deg)',
          transformOrigin: 'right center',
        },
      };

      const key = winningLine.join(',');
      return lineStyles[key] || {};
    };

    setLineStyle(getLineStyle(line));
  }, [line]);

  // Animation variants - optimized for both horizontal/vertical and diagonal lines
  const lineVariants = {
    initial: {
      scaleX: 0,
      opacity: 0,
    },
    animate: {
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2,
      },
    },
    glow: {
      boxShadow: [
        '0 0 10px currentColor',
        '0 0 20px currentColor',
        '0 0 10px currentColor',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
  };

  // Determine line color based on winner
  const getLineColor = () => {
    if (winner === 'X') return '#ef4444'; // Red for X
    if (winner === 'O') return '#3b82f6'; // Blue for O
    return '#10b981'; // Green default
  };

  if (!line || line.length !== 3) return null;

  return (
    <motion.div
      className={classNames(styles.winningLine, className)}
      style={{
        ...lineStyle,
        backgroundColor: getLineColor(),
        boxShadow: `0 0 10px ${getLineColor()}`,
      }}
      variants={lineVariants}
      initial="initial"
      animate={["animate", "glow"]}
      onAnimationComplete={onAnimationComplete}
      {...props}
    >
      {/* Sparkle effects */}
      <div className={styles.sparkles}>
        {Array.from({ length: 5 }, (_, i) => (
          <motion.div
            key={i}
            className={styles.sparkle}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1,
              delay: 0.5 + i * 0.1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              left: `${20 + i * 15}%`,
              backgroundColor: getLineColor(),
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default WinningLine;