import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';

// Hooks
import { useSound } from '../../../hooks/useSound';

// Store
import { setTheme } from '../../../store/slices/uiSlice';
import { selectIsAuthenticated, logoutUser } from '../../../store/slices/authSlice';

// Styles
import styles from './Navigation.module.scss';

const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { playSound } = useSound();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    const { theme } = useSelector((state) => state.ui);
    const { isConnected } = useSelector((state) => state.socket);
    const player = useSelector((state) => state.player);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on location change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Navigation items
    const navigationItems = [
        {
            id: 'home',
            label: 'Home',
            path: '/',
            icon: '🏠',
            color: 'var(--neon-blue)',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        {
            id: 'game',
            label: 'Game',
            path: '/game',
            icon: '🎮',
            color: 'var(--neon-green)',
            gradient: 'linear-gradient(135deg, #8338ec 0%, #3f37c9 100%)'
        },
        {
            id: 'matchmaking',
            label: 'Matchmaking',
            path: '/matchmaking',
            icon: '🔍',
            color: '#ff9e00',
            gradient: 'linear-gradient(135deg, #ff9e00 0%, #ff0069 100%)'
        },
        {
            id: 'leaderboard',
            label: 'Leaderboard',
            path: '/leaderboard',
            icon: '🏆',
            color: 'var(--neon-pink)',
            gradient: 'linear-gradient(135deg, #ff006e 0%, #fb8500 100%)'
        },
        {
            id: 'profile',
            label: 'Profile',
            path: '/profile',
            icon: '👤',
            color: '#ffd60a',
            gradient: 'linear-gradient(135deg, #ffd60a 0%, #f77f00 100%)'
        },
        {
            id: 'settings',
            label: 'Settings',
            path: '/settings',
            icon: '⚙️',
            color: '#06ffa5',
            gradient: 'linear-gradient(135deg, #06ffa5 0%, #00d4ff 100%)'
        }
    ];

    const handleThemeChange = () => {
        const themes = ['dark', 'neon']; // Removed 'light' theme
        const currentIndex = themes.indexOf(theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];

        dispatch(setTheme(nextTheme));
        playSound('buttonClick');
    };

    const handleLogout = () => {
        playSound('buttonClick');
        dispatch(logoutUser());
        navigate('/');
    };

    const handleNavClick = (path) => {
        playSound('buttonClick');
        navigate(path);
        setIsMenuOpen(false); // Close mobile menu when navigating
    };

    const handleItemHover = (itemId) => {
        setHoveredItem(itemId);
        playSound('buttonHover');
    };

    const isActiveRoute = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Main Navigation */}
            <motion.nav
                className={`${styles.navigation} ${isScrolled ? styles.scrolled : ''}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <div className={styles.container}>
                    {/* Logo */}
                    <motion.div
                        className={styles.logo}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNavClick('/')}
                    >
                        <div className={styles.logoIcon}>
                            <span className={styles.logoText}>TicTac</span>
                            <span className={styles.logoAccent}>+</span>
                        </div>
                        <div className={styles.logoGlow}></div>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className={styles.desktopNav}>
                        {navigationItems.map((item) => (
                            <motion.div
                                key={item.id}
                                className={`${styles.navItem} ${isActiveRoute(item.path) ? styles.active : ''}`}
                                onMouseEnter={() => handleItemHover(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    to={item.path}
                                    className={styles.navLink}
                                    onClick={() => playSound('buttonClick')}
                                >
                                    <div className={styles.navIcon}>{item.icon}</div>
                                    <span className={styles.navLabel}>{item.label}</span>

                                    {/* Hover effect */}
                                    {hoveredItem === item.id && (
                                        <motion.div
                                            className={styles.hoverEffect}
                                            layoutId="hoverEffect"
                                            style={{ background: item.gradient }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        />
                                    )}

                                    {/* Active indicator */}
                                    {isActiveRoute(item.path) && (
                                        <motion.div
                                            className={styles.activeIndicator}
                                            style={{ background: item.color }}
                                            layoutId="activeIndicator"
                                        />
                                    )}
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className={styles.controls}>
                        {/* Connection Status */}
                        <motion.div
                            className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}
                            title={isConnected ? 'Connected' : 'Disconnected'}
                            animate={{
                                boxShadow: isConnected
                                    ? '0 0 15px rgba(0, 255, 0, 0.5)'
                                    : '0 0 15px rgba(255, 0, 0, 0.5)'
                            }}
                        >
                            <div className={styles.statusDot}></div>
                        </motion.div>

                        {/* Theme Toggle */}
                        <motion.button
                            className={styles.themeToggle}
                            onClick={handleThemeChange}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Change Theme"
                        >
                            <div className={styles.themeIcon}>
                                {theme === 'dark' && '🌙'}
                                {theme === 'neon' && '⚡'}
                            </div>
                        </motion.button>

                        {/* Authentication Controls */}
                        {isAuthenticated ? (
                            <>
                                {/* Player Level */}
                                {player.level > 0 && (
                                    <motion.div
                                        className={styles.playerLevel}
                                        whileHover={{ scale: 1.05 }}
                                        title={`Level ${player.level}`}
                                    >
                                        <div className={styles.levelBadge}>
                                            <span className={styles.levelNumber}>{player.level}</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Logout Button */}
                                <motion.button
                                    className={styles.authButton}
                                    onClick={handleLogout}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Logout"
                                >
                                    Logout
                                </motion.button>
                            </>
                        ) : (
                            <>
                                {/* Login Button */}
                                <motion.button
                                    className={`${styles.authButton} ${styles.loginButton}`}
                                    onClick={() => navigate('/login')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Login
                                </motion.button>
                            </>
                        )}

                        {/* Mobile Menu Toggle */}
                        <motion.button
                            className={styles.mobileToggle}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className={styles.mobileMenu}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.button
                            className={styles.closeButton}
                            onClick={() => setIsMenuOpen(false)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span>×</span>
                        </motion.button>
                        <div className={styles.mobileMenuContent}>
                            {navigationItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    className={`${styles.mobileNavItem} ${isActiveRoute(item.path) ? styles.active : ''}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={item.path}
                                        className={styles.mobileNavLink}
                                        onClick={() => handleNavClick(item.path)}
                                    >
                                        <div className={styles.mobileNavIcon}>{item.icon}</div>
                                        <span className={styles.mobileNavLabel}>{item.label}</span>
                                    </Link>
                                </motion.div>
                            ))}

                            {/* Authentication Controls for Mobile */}
                            <motion.div
                                className={styles.mobileAuthControls}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: navigationItems.length * 0.1 }}
                            >
                                {isAuthenticated ? (
                                    <button
                                        className={`${styles.mobileNavLink} ${styles.logoutButton}`}
                                        onClick={handleLogout}
                                    >
                                        <div className={styles.mobileNavIcon}>🚪</div>
                                        <span className={styles.mobileNavLabel}>Logout</span>
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        className={`${styles.mobileNavLink} ${styles.loginButton}`}
                                        onClick={() => handleNavClick('/login')}
                                    >
                                        <div className={styles.mobileNavIcon}>🔑</div>
                                        <span className={styles.mobileNavLabel}>Login</span>
                                    </Link>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu Backdrop */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className={styles.mobileBackdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Navigation;