import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTimes, FaGamepad } from 'react-icons/fa';

// Store
import {
  registerUser,
  loginUser,
  clearError,
  selectAuth,
  selectAuthLoading,
  selectAuthError
} from '../../../store/slices/authSlice';

// Utils
import { generateDeviceId } from '../../../utils/deviceUtils';
import { VALIDATION } from '../../../utils/constants';

// Components
import ErrorDisplay from '../../ui/ErrorDisplay/ErrorDisplay';

// Styles
import styles from './AuthModal.module.scss';

const AuthModal = ({ isOpen, onClose, mode: initialMode = 'login' }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(selectAuth);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [mode, setMode] = useState(initialMode); // 'login', 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Update mode when initialMode changes (e.g., when parent component changes it)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Close modal when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  // Clear errors when mode changes
  useEffect(() => {
    dispatch(clearError());
    setValidationErrors({});
  }, [mode, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (mode === 'register') {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < VALIDATION.USERNAME.MIN_LENGTH) {
        errors.username = `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters`;
      } else if (formData.username.length > VALIDATION.USERNAME.MAX_LENGTH) {
        errors.username = `Username must be no more than ${VALIDATION.USERNAME.MAX_LENGTH} characters`;
      } else if (!VALIDATION.USERNAME.PATTERN.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (mode === 'login') {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      }
      if (!formData.password) {
        errors.password = 'Password is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'register') {
        await dispatch(registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.username,
          deviceId: generateDeviceId()
        })).unwrap();
      } else if (mode === 'login') {
        await dispatch(loginUser({
          email: formData.email,
          password: formData.password,
          deviceId: generateDeviceId()
        })).unwrap();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const handleClose = () => {
    dispatch(clearError());
    setFormData({
      username: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setValidationErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 className={styles.title}>
              <FaGamepad className={styles.icon} />
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
            </h2>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.content}>
            {error && (
              <ErrorDisplay
                error={error}
                variant="inline"
                onClose={() => dispatch(clearError())}
              />
            )}

            <form onSubmit={handleSubmit} className={styles.form}>

              {(mode === 'login' || mode === 'register') && (
                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaEnvelope className={styles.inputIcon} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${styles.input} ${validationErrors.email ? styles.error : ''}`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {validationErrors.email && (
                    <span className={styles.fieldError}>{validationErrors.email}</span>
                  )}
                </div>
              )}

              {mode === 'register' && (
                <div className={styles.field}>
                  <label htmlFor="username" className={styles.label}>
                    Username
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaUser className={styles.inputIcon} />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`${styles.input} ${validationErrors.username ? styles.error : ''}`}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  {validationErrors.username && (
                    <span className={styles.fieldError}>{validationErrors.username}</span>
                  )}
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className={styles.field}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`${styles.input} ${validationErrors.password ? styles.error : ''}`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className={styles.fieldError}>{validationErrors.password}</span>
                  )}
                </div>
              )}

              {mode === 'register' && (
                <div className={styles.field}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`${styles.input} ${validationErrors.confirmPassword ? styles.error : ''}`}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <span className={styles.fieldError}>{validationErrors.confirmPassword}</span>
                  )}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.spinner} />
                ) : (
                  <>
                    {mode === 'guest' && 'Start Playing'}
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <div className={styles.footer}>
              {mode === 'guest' && (
                <div className={styles.authOptions}>
                  <p>Want to save your progress?</p>
                  <div className={styles.authButtons}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => setMode('login')}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => setMode('register')}
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className={styles.authOptions}>
                  <p>Don't have an account?</p>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setMode('register')}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {mode === 'register' && (
                <div className={styles.authOptions}>
                  <p>Already have an account?</p>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setMode('login')}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;