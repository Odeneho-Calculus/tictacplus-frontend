import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaInfoCircle, FaWifi, FaTimes } from 'react-icons/fa';
import { parseValidationError, isValidationError, isNetworkError, getErrorTitle, getErrorAction, formatErrorMessage } from '../../../utils/errorUtils';
import styles from './ErrorDisplay.module.scss';

const ErrorDisplay = ({
    error,
    onClose,
    showDetails = false,
    className = '',
    variant = 'default' // 'default', 'inline', 'toast'
}) => {
    if (!error) return null;

    // Safely handle different error types
    let parsedError;
    try {
        parsedError = typeof error === 'string'
            ? { message: error, fieldErrors: {} }
            : parseValidationError(error);
    } catch (e) {
        // Fallback if error parsing fails
        parsedError = {
            message: 'An unexpected error occurred',
            fieldErrors: {}
        };
    }

    // Ensure message is always available
    if (!parsedError.message) {
        parsedError.message = 'An unexpected error occurred';
    }

    const isValidation = isValidationError(error);
    const isNetwork = isNetworkError(error);
    const errorTitle = getErrorTitle(error);
    const errorAction = getErrorAction(error);

    const getIcon = () => {
        if (isNetwork) return <FaWifi className={styles.icon} />;
        if (isValidation) return <FaInfoCircle className={styles.icon} />;
        return <FaExclamationTriangle className={styles.icon} />;
    };

    const getVariantClass = () => {
        switch (variant) {
            case 'inline': return styles.inline;
            case 'toast': return styles.toast;
            default: return styles.default;
        }
    };

    const getTypeClass = () => {
        if (isNetwork) return styles.network;
        if (isValidation) return styles.validation;
        return styles.error;
    };

    return (
        <AnimatePresence>
            <motion.div
                className={`${styles.errorDisplay} ${getVariantClass()} ${getTypeClass()} ${className}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        {getIcon()}
                        <h4 className={styles.title}>{errorTitle}</h4>
                    </div>
                    {onClose && (
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Close error"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className={styles.content}>
                    <p className={styles.message}>
                        {parsedError.message || 'An unexpected error occurred'}
                    </p>

                    {Object.keys(parsedError.fieldErrors || {}).length > 0 && (
                        <div className={styles.fieldErrors}>
                            <h5 className={styles.fieldErrorsTitle}>Details:</h5>
                            <ul className={styles.fieldErrorsList}>
                                {Object.entries(parsedError.fieldErrors).map(([field, message]) => (
                                    <li key={field} className={styles.fieldError}>
                                        <strong>{field}:</strong> {message || 'Invalid value'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {showDetails && error && error.details && (
                        <details className={styles.details}>
                            <summary className={styles.detailsSummary}>Technical Details</summary>
                            <pre className={styles.detailsContent}>
                                {JSON.stringify(
                                    typeof error.details === 'object' ? error.details : { error: String(error) },
                                    null,
                                    2
                                )}
                            </pre>
                        </details>
                    )}

                    <p className={styles.action}>{errorAction || 'Please try again.'}</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;