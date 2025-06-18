import React, { memo } from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

// Components
import XPiece from './XPiece';
import OPiece from './OPiece';

// Styles
import styles from './GamePiece.module.scss';

const GamePiece = ({
  type,
  size = 'medium',
  animated = true,
  glowing = false,
  color = null,
  className,
  style,
  ...props
}) => {
  // Validate type
  if (!type || !['X', 'O'].includes(type)) {
    return null;
  }

  // Size configurations
  const sizeConfig = {
    small: {
      width: 30,
      height: 30,
      strokeWidth: 3,
    },
    medium: {
      width: 50,
      height: 50,
      strokeWidth: 4,
    },
    large: {
      width: 70,
      height: 70,
      strokeWidth: 5,
    },
    xlarge: {
      width: 100,
      height: 100,
      strokeWidth: 6,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Animation variants
  const pieceVariants = {
    initial: {
      scale: 0,
      rotate: -180,
      opacity: 0,
    },
    animate: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.6,
      },
    },
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.2,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
    glow: {
      filter: 'drop-shadow(0 0 10px currentColor)',
      transition: {
        duration: 0.3,
      },
    },
  };

  // Determine piece color
  const pieceColor = color || (type === 'X' ? '#ef4444' : '#3b82f6');

  // Component props
  const pieceProps = {
    width: config.width,
    height: config.height,
    strokeWidth: config.strokeWidth,
    color: pieceColor,
    animated,
    className: styles.piece,
  };

  return (
    <motion.div
      className={classNames(styles.gamePiece, className, {
        [styles[size]]: size,
        [styles.glowing]: glowing,
        [styles.animated]: animated,
      })}
      variants={animated ? pieceVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? ["animate", glowing ? "glow" : ""].filter(Boolean) : undefined}
      whileHover={animated ? "hover" : undefined}
      whileTap={animated ? "tap" : undefined}
      style={{
        width: config.width,
        height: config.height,
        ...style,
      }}
      {...props}
    >
      {type === 'X' ? (
        <XPiece {...pieceProps} />
      ) : (
        <OPiece {...pieceProps} />
      )}
    </motion.div>
  );
};

// Memoize the GamePiece component to prevent unnecessary re-renders
export default memo(GamePiece, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.size === nextProps.size &&
    prevProps.animated === nextProps.animated &&
    prevProps.glowing === nextProps.glowing &&
    prevProps.color === nextProps.color
  );
});