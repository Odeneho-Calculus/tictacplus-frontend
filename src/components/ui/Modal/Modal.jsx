import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames';
import styles from './Modal.module.scss';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    size = 'medium',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    ...props
}) => {
    // Handle escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        className={classNames(
                            styles.modal,
                            styles[size],
                            className
                        )}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        {...props}
                    >
                        {(title || showCloseButton) && (
                            <div className={styles.header}>
                                {title && <h2 className={styles.title}>{title}</h2>}
                                {showCloseButton && (
                                    <button
                                        className={styles.closeButton}
                                        onClick={onClose}
                                        aria-label="Close modal"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        )}

                        <div className={styles.content}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Render modal in portal
    return createPortal(modalContent, document.body);
};

export default Modal;