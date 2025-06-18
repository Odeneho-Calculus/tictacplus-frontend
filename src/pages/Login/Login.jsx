import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';

// Store
import {
  registerUser,
  loginUser,
  clearError,
  selectAuth,
  selectAuthLoading,
  selectAuthError
} from '../../store/slices/authSlice';

// Components
import ErrorDisplay from '../../components/ui/ErrorDisplay/ErrorDisplay';
import { GamingButton } from '../../components/ui';

// Styles
import styles from './Login.module.scss';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector(selectAuth);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // Get the page the user was trying to access
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (formData.username.length > 20) {
        errors.username = 'Username must be no more than 20 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
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
          displayName: formData.username
        })).unwrap();
      } else if (mode === 'login') {
        await dispatch(loginUser({
          email: formData.email,
          password: formData.password
        })).unwrap();
      }
    } catch (error) {
      console.error('Authentication failed:', error);

      // Handle specific error cases
      if (typeof error === 'string' && error.includes('Login failed')) {
        // Set a more user-friendly error message for login failures
        dispatch({
          type: 'auth/loginUser/rejected',
          payload: 'Invalid email or password. Please try again.'
        });
      } else if (!error) {
        // Handle undefined errors
        dispatch({
          type: 'auth/loginUser/rejected',
          payload: 'Authentication failed. Please try again.'
        });
      }
      // Other errors will be handled by the reducer
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <Helmet>
        <title>{mode === 'login' ? 'Login' : 'Register'} | TicTac+</title>
        <meta name="description" content={mode === 'login' ? 'Log in to your TicTac+ account' : 'Create a new TicTac+ account'} />
      </Helmet>

      <motion.div
        className={styles.loginPage}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className={styles.loginCard} variants={itemVariants}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className={styles.subtitle}>
              {mode === 'login'
                ? 'Sign in to continue to TicTac+'
                : 'Join the TicTac+ community today'}
            </p>
          </div>

          {error && (
            <ErrorDisplay
              error={error}
              variant="inline"
              onClose={() => dispatch(clearError())}
            />
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
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

            <div className={styles.actions}>
              <GamingButton
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                fullWidth
                glowEffect
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </GamingButton>
            </div>
          </form>

          <div className={styles.switchMode}>
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => setMode('login')}
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          <div className={styles.backToHome}>
            <Link to="/" className={styles.backLink}>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Login;