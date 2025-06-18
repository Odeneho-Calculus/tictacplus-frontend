import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useSound } from '../../../hooks/useSound';
import styles from './Button.module.scss';

/**
 * Advanced 3D Button component with modern effects
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon = null,
    iconPosition = 'left',
    fullWidth = false,
    glowEffect = false,
    holographic = false,
    neonBorder = false,
    className = '',
    onClick,
    type = 'button',
    ...props
}) => {
    const { playSound } = useSound();

    const handleClick = (e) => {
        if (disabled || loading) return;

        playSound('buttonClick');
        if (onClick) {
            onClick(e);
        }
    };

    const handleHover = () => {
        if (disabled || loading) return;
        playSound('buttonHover');
    };

    const buttonClasses = [
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        loading && styles.loading,
        fullWidth && styles.fullWidth,
        glowEffect && styles.glowEffect,
        holographic && styles.holographic,
        neonBorder && styles.neonBorder,
        className
    ].filter(Boolean).join(' ');

    const buttonVariants = {
        initial: {
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            z: 0
        },
        hover: {
            scale: 1.05,
            rotateX: -5,
            rotateY: 5,
            z: 10,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 17
            }
        },
        tap: {
            scale: 0.95,
            rotateX: -2,
            rotateY: 2,
            z: 5,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 17
            }
        }
    };

    const LoadingSpinner = () => (
        <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
        </div>
    );

    const IconComponent = ({ icon, position }) => {
        if (!icon) return null;

        return (
            <span className={`${styles.icon} ${styles[`icon-${position}`]}`}>
                {typeof icon === 'string' ? (
                    <span className={styles.iconText}>{icon}</span>
                ) : (
                    icon
                )}
            </span>
        );
    };

    return (
        <motion.button
            className={buttonClasses}
            onClick={handleClick}
            onMouseEnter={handleHover}
            onFocus={handleHover}
            disabled={disabled || loading}
            type={type}
            variants={buttonVariants}
            initial="initial"
            whileHover={!disabled && !loading ? "hover" : "initial"}
            whileTap={!disabled && !loading ? "tap" : "initial"}
            style={{ transformStyle: 'preserve-3d' }}
            {...props}
        >
            {/* Background Effects */}
            <div className={styles.buttonBg}></div>
            <div className={styles.buttonShine}></div>
            <div className={styles.buttonGlow}></div>

            {/* Content */}
            <span className={styles.buttonContent}>
                {loading && <LoadingSpinner />}
                {!loading && iconPosition === 'left' && <IconComponent icon={icon} position="left" />}
                <span className={styles.buttonText}>{children}</span>
                {!loading && iconPosition === 'right' && <IconComponent icon={icon} position="right" />}
            </span>

            {/* 3D Edge Effect */}
            <div className={styles.buttonEdge}></div>
        </motion.button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'success', 'neon', 'gaming']),
    size: PropTypes.oneOf(['small', 'medium', 'large', 'extraLarge']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    iconPosition: PropTypes.oneOf(['left', 'right']),
    fullWidth: PropTypes.bool,
    glowEffect: PropTypes.bool,
    holographic: PropTypes.bool,
    neonBorder: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

// Button variants for common use cases
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const NeonButton = (props) => {
    const neonButtonVariants = {
        initial: {
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            z: 0
        },
        hover: {
            scale: 1.05,
            rotateX: -5,
            rotateY: 5,
            z: 15,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
            }
        },
        tap: {
            scale: 0.95,
            rotateX: -2,
            rotateY: 2,
            z: 5,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 17
            }
        }
    };

    return (
        <Button
            variant="neon"
            holographic
            neonBorder
            glowEffect
            variants={neonButtonVariants}
            {...props}
        />
    );
};
export const GamingButton = (props) => <Button variant="gaming" glowEffect {...props} />;

export default Button;