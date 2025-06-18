/**
 * Error handling utilities for the frontend
 */

/**
 * Parse backend validation errors into user-friendly messages
 * @param {Object|string} error - Error object from backend or error string
 * @returns {Object} Parsed error with field-specific messages
 */
export const parseValidationError = (error) => {
    // Default result structure
    const result = {
        message: 'An error occurred',
        fieldErrors: {}
    };

    // Handle null or undefined errors
    if (!error) {
        return result;
    }

    // Handle string errors
    if (typeof error === 'string') {
        result.message = error;
        return result;
    }

    try {
        // Handle Error instances
        if (error instanceof Error) {
            result.message = error.message || error.toString();
            return result;
        }

        // Handle objects with message property
        if (error.message && typeof error.message === 'string') {
            result.message = error.message;
        }

        // Parse detailed validation errors
        if (error.details && error.details.errors && Array.isArray(error.details.errors)) {
            error.details.errors.forEach(fieldError => {
                if (fieldError.field && fieldError.message) {
                    result.fieldErrors[fieldError.field] = fieldError.message;
                }
            });
        }

        // Handle objects with errors property (common in API responses)
        if (error.errors && typeof error.errors === 'object') {
            Object.entries(error.errors).forEach(([field, message]) => {
                if (typeof message === 'string') {
                    result.fieldErrors[field] = message;
                } else if (Array.isArray(message) && message.length > 0) {
                    result.fieldErrors[field] = message.join(', ');
                }
            });
        }

        // Handle objects with fields property (another common pattern)
        if (error.fields && Array.isArray(error.fields)) {
            error.fields.forEach(field => {
                if (field.name && field.error) {
                    result.fieldErrors[field.name] = field.error;
                }
            });
        }

        // If we have field errors but no message, create a summary message
        if (Object.keys(result.fieldErrors).length > 0 && result.message === 'An error occurred') {
            result.message = 'Please correct the following errors:';
        }

        return result;
    } catch (e) {
        // If any error occurs during parsing
        return {
            message: 'An unexpected error occurred',
            fieldErrors: {}
        };
    }
};

/**
 * Format error message for display in UI
 * @param {string|Object} error - Error message or error object
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
    // Handle null or undefined errors
    if (!error) {
        return 'An unexpected error occurred';
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    try {
        // Handle Error instances
        if (error instanceof Error) {
            return error.message || error.toString();
        }

        // Handle objects with message property
        if (error.message && typeof error.message === 'string') {
            return error.message;
        }

        // Handle validation errors with details
        if (error.details && error.details.errors && Array.isArray(error.details.errors)) {
            const fieldErrors = error.details.errors.map(err => {
                if (err.field && err.message) {
                    return `${err.field}: ${err.message}`;
                }
                return err.message || err.toString();
            }).filter(Boolean);

            if (fieldErrors.length > 0) {
                return fieldErrors.join('\n');
            }
        }

        // Handle objects with code property
        if (error.code) {
            switch (error.code) {
                case 'UNAUTHORIZED':
                    return 'Authentication failed. Please check your credentials.';
                case 'FORBIDDEN':
                    return 'You do not have permission to perform this action.';
                case 'NOT_FOUND':
                    return 'The requested resource could not be found.';
                case 'RATE_LIMIT_EXCEEDED':
                    return 'Too many requests. Please try again later.';
                case 'SERVER_ERROR':
                    return 'Server error. Please try again later.';
                default:
                    return `Error: ${error.code}`;
            }
        }

        // Handle objects with status and statusText (like HTTP responses)
        if (error.status && error.statusText) {
            return `${error.status} ${error.statusText}`;
        }

        // Last resort: stringify the error
        if (typeof error === 'object') {
            try {
                return JSON.stringify(error);
            } catch (e) {
                // If JSON stringify fails
                return 'An unexpected error occurred';
            }
        }

        return 'An unexpected error occurred';
    } catch (e) {
        // If any error occurs during formatting
        return 'An unexpected error occurred';
    }
};

/**
 * Check if error is a validation error
 * @param {Object} error - Error object
 * @returns {boolean} True if validation error
 */
export const isValidationError = (error) => {
    return error && (
        error.code === 'VALIDATION_ERROR' ||
        (error.details && error.details.errors && Array.isArray(error.details.errors))
    );
};

/**
 * Check if error is a network error
 * @param {Object} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
    // First check if error and error.message exist
    if (!error || typeof error !== 'object') {
        return false;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error.includes('fetch') ||
            error.includes('network') ||
            error.includes('connection') ||
            error.includes('offline');
    }

    // Handle error objects with message property
    if (error.message && typeof error.message === 'string') {
        return error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('connection') ||
            error.message.includes('offline');
    }

    // Handle error objects with code property
    if (error.code && typeof error.code === 'string') {
        return error.code.includes('NETWORK_ERROR') ||
            error.code.includes('ECONNREFUSED') ||
            error.code.includes('ECONNABORTED') ||
            error.code.includes('TIMEOUT');
    }

    // Handle error objects with name property
    if (error.name && typeof error.name === 'string') {
        return error.name.includes('NetworkError') ||
            error.name.includes('AbortError') ||
            error.name.includes('TimeoutError');
    }

    return false;
};

/**
 * Get user-friendly error title based on error type
 * @param {Object|string} error - Error object or string
 * @returns {string} Error title
 */
export const getErrorTitle = (error) => {
    // Handle null or undefined errors
    if (!error) {
        return 'Error';
    }

    // Handle string errors
    if (typeof error === 'string') {
        if (error.toLowerCase().includes('network') ||
            error.toLowerCase().includes('connection') ||
            error.toLowerCase().includes('offline')) {
            return 'Connection Error';
        }
        if (error.toLowerCase().includes('validation') ||
            error.toLowerCase().includes('invalid')) {
            return 'Invalid Input';
        }
        if (error.toLowerCase().includes('auth') ||
            error.toLowerCase().includes('login') ||
            error.toLowerCase().includes('permission')) {
            return 'Authentication Error';
        }
        return 'Error';
    }

    // Handle error objects
    try {
        if (isValidationError(error)) {
            return 'Invalid Input';
        }

        if (isNetworkError(error)) {
            return 'Connection Error';
        }

        // Check for specific error codes
        if (error.code) {
            switch (error.code) {
                case 'RATE_LIMIT_EXCEEDED':
                    return 'Too Many Requests';
                case 'UNAUTHORIZED':
                case 'AUTH_FAILED':
                    return 'Authentication Required';
                case 'FORBIDDEN':
                    return 'Access Denied';
                case 'NOT_FOUND':
                    return 'Not Found';
                case 'SERVER_ERROR':
                    return 'Server Error';
                default:
                    if (error.code.includes('AUTH')) return 'Authentication Error';
                    if (error.code.includes('VALIDATION')) return 'Invalid Input';
            }
        }

        // Check for specific error names
        if (error.name) {
            switch (error.name) {
                case 'ValidationError':
                    return 'Invalid Input';
                case 'AuthenticationError':
                    return 'Authentication Error';
                case 'NetworkError':
                    return 'Connection Error';
            }
        }

        // Check message content for clues
        if (error.message) {
            if (error.message.toLowerCase().includes('auth') ||
                error.message.toLowerCase().includes('login') ||
                error.message.toLowerCase().includes('password')) {
                return 'Authentication Error';
            }
        }

        return 'Error';
    } catch (e) {
        return 'Error';
    }
};

/**
 * Get suggested action for error
 * @param {Object|string} error - Error object or string
 * @returns {string} Suggested action
 */
export const getErrorAction = (error) => {
    // Handle null or undefined errors
    if (!error) {
        return 'Please try again. If the problem persists, contact support.';
    }

    // Handle string errors
    if (typeof error === 'string') {
        if (error.toLowerCase().includes('network') ||
            error.toLowerCase().includes('connection') ||
            error.toLowerCase().includes('offline')) {
            return 'Please check your internet connection and try again.';
        }
        if (error.toLowerCase().includes('validation') ||
            error.toLowerCase().includes('invalid')) {
            return 'Please correct your input and try again.';
        }
        if (error.toLowerCase().includes('auth') ||
            error.toLowerCase().includes('login') ||
            error.toLowerCase().includes('permission')) {
            return 'Please check your credentials and try again.';
        }
        return 'Please try again. If the problem persists, contact support.';
    }

    // Handle error objects
    try {
        if (isValidationError(error)) {
            return 'Please correct the highlighted fields and try again.';
        }

        if (isNetworkError(error)) {
            return 'Please check your internet connection and try again.';
        }

        // Check for specific error codes
        if (error.code) {
            switch (error.code) {
                case 'RATE_LIMIT_EXCEEDED':
                    return 'Please wait a moment before trying again.';
                case 'UNAUTHORIZED':
                case 'AUTH_FAILED':
                    return 'Please log in with valid credentials and try again.';
                case 'FORBIDDEN':
                    return 'You do not have permission to perform this action.';
                case 'NOT_FOUND':
                    return 'The requested resource could not be found.';
                case 'SERVER_ERROR':
                    return 'There was a problem with the server. Please try again later.';
            }
        }

        // Check message content for clues
        if (error.message) {
            if (error.message.toLowerCase().includes('auth') ||
                error.message.toLowerCase().includes('login') ||
                error.message.toLowerCase().includes('password')) {
                return 'Please check your credentials and try again.';
            }

            if (error.message.toLowerCase().includes('network') ||
                error.message.toLowerCase().includes('connection')) {
                return 'Please check your internet connection and try again.';
            }
        }

        return 'Please try again. If the problem persists, contact support.';
    } catch (e) {
        return 'Please try again. If the problem persists, contact support.';
    }
};

export default {
    parseValidationError,
    formatErrorMessage,
    isValidationError,
    isNetworkError,
    getErrorTitle,
    getErrorAction
};