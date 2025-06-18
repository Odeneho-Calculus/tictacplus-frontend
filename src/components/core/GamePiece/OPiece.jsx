import React from 'react';
import { motion } from 'framer-motion';

const OPiece = ({
  width = 50,
  height = 50,
  strokeWidth = 4,
  color = '#3b82f6',
  animated = true,
  className,
  ...props
}) => {
  // Calculate circle properties
  const padding = strokeWidth * 2;
  const radius = (Math.min(width, height) - padding * 2) / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  // Animation variants for the circle
  const circleVariants = {
    initial: {
      pathLength: 0,
      opacity: 0,
      rotate: -90,
    },
    animate: {
      pathLength: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
        rotate: {
          duration: 0.4,
        },
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
      {/* Circle */}
      <motion.circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        variants={animated ? circleVariants : undefined}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        style={{
          filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.2))',
          transformOrigin: `${centerX}px ${centerY}px`,
        }}
      />
    </svg>
  );
};

export default OPiece;