import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useSound } from '../../../hooks/useSound';
import styles from './Card.module.scss';

/**
 * Advanced 3D Card component with modern effects
 */
const Card = ({
    children,
    variant = 'default',
    elevation = 'medium',
    interactive = false,
    glowEffect = false,
    holographic = false,
    neonBorder = false,
    glassMorphism = true,
    floating = false,
    className = '',
    onClick,
    onHover,
    ...props
}) => {
    const { playSound } = useSound();

    const handleClick = (e) => {
        if (!interactive) return;
        playSound('cardClick');
        if (onClick) {
            onClick(e);
        }
    };

    const handleHover = () => {
        if (!interactive) return;
        playSound('buttonHover');
        if (onHover) {
            onHover();
        }
    };

    const cardClasses = [
        styles.card,
        styles[variant],
        styles[`elevation-${elevation}`],
        interactive && styles.interactive,
        glowEffect && styles.glowEffect,
        holographic && styles.holographic,
        neonBorder && styles.neonBorder,
        glassMorphism && styles.glassMorphism,
        floating && styles.floating,
        className
    ].filter(Boolean).join(' ');

    const cardVariants = {
        initial: {
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            z: 0
        },
        hover: interactive ? {
            scale: 1.02,
            rotateX: -2,
            rotateY: 2,
            z: 10,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        } : {},
        tap: interactive ? {
            scale: 0.98,
            rotateX: -1,
            rotateY: 1,
            z: 5,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 17
            }
        } : {}
    };

    return (
        <motion.div
            className={cardClasses}
            onClick={handleClick}
            onMouseEnter={handleHover}
            onFocus={handleHover}
            variants={cardVariants}
            initial="initial"
            whileHover={interactive ? "hover" : "initial"}
            whileTap={interactive ? "tap" : "initial"}
            style={{ transformStyle: 'preserve-3d' }}
            {...props}
        >
            {/* Background Effects */}
            <div className={styles.cardBg}></div>
            <div className={styles.cardGlow}></div>
            <div className={styles.cardShine}></div>

            {/* Content */}
            <div className={styles.cardContent}>
                {children}
            </div>

            {/* 3D Edge Effect */}
            <div className={styles.cardEdge}></div>
        </motion.div>
    );
};

Card.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['default', 'game', 'feature', 'stats', 'profile', 'neon', 'danger']),
    elevation: PropTypes.oneOf(['low', 'medium', 'high']),
    interactive: PropTypes.bool,
    glowEffect: PropTypes.bool,
    holographic: PropTypes.bool,
    neonBorder: PropTypes.bool,
    glassMorphism: PropTypes.bool,
    floating: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
    onHover: PropTypes.func
};

// Specialized Card Components
export const GameCard = (props) => {
    const { playSound } = useSound();

    const cardVariants = {
        initial: {
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            z: 0
        },
        hover: {
            scale: 1.03,
            rotateX: -2,
            rotateY: 2,
            z: 10,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        },
        tap: {
            scale: 0.98,
            rotateX: -1,
            rotateY: 1,
            z: 5,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        }
    };

    // Simple mouse move effect for subtle 3D tilt
    const [rotateXY, setRotateXY] = React.useState([0, 0]);

    const handleMouseMove = (e) => {
        if (!props.interactive) return;

        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();

        // Calculate mouse position relative to card center (in percentage from -50 to 50)
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 100;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 100;

        // Set rotation values (negative Y for correct tilt direction)
        setRotateXY([-y / 10, x / 10]); // Divide by 10 for a more subtle effect
    };

    const handleMouseLeave = () => {
        setRotateXY([0, 0]);
    };

    const handleHover = () => {
        if (props.onHover) {
            props.onHover();
        } else {
            playSound('buttonHover');
        }
    };

    return (
        <Card
            variant="game"
            interactive
            glowEffect
            elevation="medium"
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onHover={handleHover}
            style={{
                rotateX: rotateXY[0],
                rotateY: rotateXY[1]
            }}
            {...props}
        />
    );
};

export const FeatureCard = (props) => (
    <Card
        variant="feature"
        interactive
        glassMorphism
        elevation="medium"
        {...props}
    />
);

export const StatsCard = ({ value, label, ...props }) => (
    <Card
        variant="stats"
        interactive
        elevation="low"
        {...props}
    >
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            position: 'relative',
            zIndex: 50
        }}>
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white'
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.8)'
            }}>
                {label}
            </div>
        </div>
    </Card>
);

export const ProfileCard = (props) => (
    <Card
        variant="profile"
        interactive
        glassMorphism
        elevation="high"
        floating
        {...props}
    />
);

export const NeonCard = (props) => (
    <Card
        variant="neon"
        interactive
        neonBorder
        glowEffect
        holographic
        elevation="high"
        {...props}
    />
);

export default Card;