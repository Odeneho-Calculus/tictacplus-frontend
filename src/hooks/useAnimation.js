import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAnimationLevel } from '../store/slices/settingsSlice';
import { ANIMATIONS } from '../utils/constants';

/**
 * Custom hook for managing animations and visual effects
 */
export const useAnimation = () => {
  const animationLevel = useSelector(selectAnimationLevel);
  const animationRefs = useRef(new Map());

  // Check if animations are enabled
  const isAnimationEnabled = useCallback((level = ANIMATIONS.BASIC) => {
    if (animationLevel === ANIMATIONS.NONE) return false;

    const levels = {
      [ANIMATIONS.NONE]: 0,
      [ANIMATIONS.BASIC]: 1,
      [ANIMATIONS.ENHANCED]: 2,
      [ANIMATIONS.FULL]: 3,
    };

    return levels[animationLevel] >= levels[level];
  }, [animationLevel]);

  // Trigger an animation
  const triggerAnimation = useCallback((elementId, animationType, options = {}) => {
    if (!isAnimationEnabled()) return;

    const element = typeof elementId === 'string'
      ? document.getElementById(elementId)
      : elementId;

    if (!element) return;

    const {
      duration = 300,
      easing = 'ease-out',
      delay = 0,
      iterations = 1,
      direction = 'normal',
      fillMode = 'both',
    } = options;

    // Define animation keyframes
    const animations = {
      fadeIn: [
        { opacity: 0 },
        { opacity: 1 }
      ],
      fadeOut: [
        { opacity: 1 },
        { opacity: 0 }
      ],
      slideInUp: [
        { transform: 'translateY(100%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      slideInDown: [
        { transform: 'translateY(-100%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      slideInLeft: [
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      slideInRight: [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      scaleIn: [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      scaleOut: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0)', opacity: 0 }
      ],
      bounceIn: [
        { transform: 'scale(0.3)', opacity: 0 },
        { transform: 'scale(1.05)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0.9)', offset: 0.7 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      shake: [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ],
      pulse: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.05)', opacity: 0.7 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      spin: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ],
      wiggle: [
        { transform: 'rotate(-3deg)' },
        { transform: 'rotate(3deg)' },
        { transform: 'rotate(-3deg)' }
      ],
      cellClick: [
        { transform: 'scale(1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
      ],
      pieceAppear: [
        { transform: 'scale(0) rotate(180deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(90deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1) rotate(0deg)', opacity: 1 }
      ],
      glow: [
        { boxShadow: '0 0 5px currentColor' },
        { boxShadow: '0 0 20px currentColor' },
        { boxShadow: '0 0 5px currentColor' }
      ],
    };

    const keyframes = animations[animationType];
    if (!keyframes) {
      console.warn(`Animation type "${animationType}" not found`);
      return;
    }

    // Create animation
    const animation = element.animate(keyframes, {
      duration,
      easing,
      delay,
      iterations,
      direction,
      fill: fillMode,
    });

    // Store animation reference
    const animationId = `${elementId}_${animationType}_${Date.now()}`;
    animationRefs.current.set(animationId, animation);

    // Cleanup when animation finishes
    animation.addEventListener('finish', () => {
      animationRefs.current.delete(animationId);
    });

    return animation;
  }, [isAnimationEnabled]);

  // Animate multiple elements in sequence
  const animateSequence = useCallback((animations, interval = 100) => {
    if (!isAnimationEnabled()) return;

    animations.forEach((anim, index) => {
      setTimeout(() => {
        triggerAnimation(anim.element, anim.type, anim.options);
      }, index * interval);
    });
  }, [isAnimationEnabled, triggerAnimation]);

  // Stop all animations
  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach(animation => {
      animation.cancel();
    });
    animationRefs.current.clear();
  }, []);

  // Stop specific animation
  const stopAnimation = useCallback((elementId, animationType) => {
    const animationId = `${elementId}_${animationType}`;
    const animation = animationRefs.current.get(animationId);
    if (animation) {
      animation.cancel();
      animationRefs.current.delete(animationId);
    }
  }, []);

  // Create a spring animation
  const createSpringAnimation = useCallback((element, from, to, options = {}) => {
    if (!isAnimationEnabled(ANIMATIONS.ENHANCED)) return;

    const {
      stiffness = 300,
      damping = 20,
      mass = 1,
      duration = 600,
    } = options;

    // Simple spring physics simulation
    const keyframes = [];
    const steps = 60;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const progress = springEasing(t, stiffness, damping, mass);

      const frame = {};
      Object.keys(to).forEach(prop => {
        const fromValue = from[prop] || 0;
        const toValue = to[prop];
        frame[prop] = fromValue + (toValue - fromValue) * progress;
      });

      keyframes.push(frame);
    }

    return element.animate(keyframes, {
      duration,
      easing: 'linear',
      fill: 'both',
    });
  }, [isAnimationEnabled]);

  // Spring easing function
  const springEasing = useCallback((t, stiffness, damping, mass) => {
    const w = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    if (zeta < 1) {
      const wd = w * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w * t) * Math.cos(wd * t);
    } else {
      return 1 - Math.exp(-w * t);
    }
  }, []);

  // Create particle effect
  const createParticleEffect = useCallback((container, options = {}) => {
    if (!isAnimationEnabled(ANIMATIONS.FULL)) return;

    const {
      count = 20,
      colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
      size = 4,
      duration = 2000,
      spread = 100,
    } = options;

    const particles = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
      `;

      container.appendChild(particle);
      particles.push(particle);

      // Animate particle
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 50 + Math.random() * spread;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity;

      particle.animate([
        {
          transform: 'translate(0, 0) scale(1)',
          opacity: 1
        },
        {
          transform: `translate(${x}px, ${y}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: duration + Math.random() * 500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }).addEventListener('finish', () => {
        particle.remove();
      });
    }

    return particles;
  }, [isAnimationEnabled]);

  // Get animation duration based on level
  const getAnimationDuration = useCallback((baseDuration = 300) => {
    switch (animationLevel) {
      case ANIMATIONS.NONE:
        return 0;
      case ANIMATIONS.BASIC:
        return baseDuration * 0.5;
      case ANIMATIONS.ENHANCED:
        return baseDuration;
      case ANIMATIONS.FULL:
        return baseDuration * 1.2;
      default:
        return baseDuration;
    }
  }, [animationLevel]);

  return {
    // Core functions
    triggerAnimation,
    animateSequence,
    stopAllAnimations,
    stopAnimation,
    createSpringAnimation,
    createParticleEffect,

    // Utility functions
    isAnimationEnabled,
    getAnimationDuration,

    // State
    animationLevel,
    isEnabled: animationLevel !== ANIMATIONS.NONE,
  };
};

export default useAnimation;