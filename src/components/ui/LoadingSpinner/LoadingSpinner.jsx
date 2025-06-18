import React from 'react';
import { motion } from 'framer-motion';
import classNames from 'classnames';

// Styles
import styles from './LoadingSpinner.module.scss';

const LoadingSpinner = ({
  size = 'medium',
  variant = 'default',
  color = 'primary',
  text = null,
  className,
  ...props
}) => {
  // Animation variants
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={styles.dotsContainer}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={styles.dot}
                variants={dotVariants}
                animate="animate"
                transition={{ delay: i * 0.2 }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={styles.pulse}
            variants={pulseVariants}
            animate="animate"
          />
        );

      case 'bars':
        return (
          <div className={styles.barsContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={styles.bar}
                animate={{
                  scaleY: [0.4, 1, 0.4],
                  transition: {
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <motion.div
            className={styles.ring}
            variants={spinnerVariants}
            animate="animate"
          >
            <div className={styles.ringInner} />
          </motion.div>
        );

      default:
        return (
          <motion.div
            className={styles.spinner}
            variants={spinnerVariants}
            animate="animate"
          >
            <div className={styles.spinnerInner} />
          </motion.div>
        );
    }
  };

  return (
    <div
      className={classNames(styles.loadingSpinner, className, {
        [styles[size]]: size,
        [styles[variant]]: variant,
        [styles[color]]: color,
        [styles.withText]: text,
      })}
      role="status"
      aria-label={text || "Loading"}
      {...props}
    >
      <div className={styles.spinnerWrapper}>
        {renderSpinner()}
      </div>

      {text && (
        <motion.div
          className={styles.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.div>
      )}

      <span className="sr-only">
        {text || "Loading, please wait..."}
      </span>
    </div>
  );
};

export default LoadingSpinner;