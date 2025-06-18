import React from 'react';
import { motion } from 'framer-motion';

const XPiece = ({
  width = 50,
  height = 50,
  strokeWidth = 4,
  color = '#ef4444',
  animated = true,
  className,
  ...props
}) => {
  // Calculate padding to ensure the X fits nicely within the bounds
  const padding = strokeWidth * 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Animation variants for the X lines
  const lineVariants = {
    initial: {
      pathLength: 0,
      opacity: 0,
    },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      {...props}
    >
      {/* First diagonal line (top-left to bottom-right) */}
      <motion.line
        x1={padding}
        y1={padding}
        x2={width - padding}
        y2={height - padding}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        variants={animated ? lineVariants : undefined}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        style={{
          filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.2))',
        }}
      />

      {/* Second diagonal line (top-right to bottom-left) */}
      <motion.line
        x1={width - padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        variants={animated ? lineVariants : undefined}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        transition={animated ? { delay: 0.1 } : undefined}
        style={{
          filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.2))',
        }}
      />
    </svg>
  );
};

export default XPiece;