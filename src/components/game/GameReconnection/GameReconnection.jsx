import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaWifi,
    FaExclamationTriangle,
    FaSpinner,
    FaArrowLeft,
    FaRedo,
    FaClock,
    FaGamepad
} from 'react-icons/fa';

// Store
import {
    selectIsOnlineGame,
    selectGameId,
    selectGame,
    reconnectToGame,
    leaveGame,
    selectReconnectionAttempts
} from '../../../store/slices/gameSlice';

// Components
import { GamingButton, NeonButton } from '../../ui';

// Hooks
import { useSocket } from '../../../hooks/useSocket';
import { useSound } from '../../../hooks/useSound';

// Utils
import { GAME_STATES } from '../../../utils/constants';

// Styles
import styles from './GameReconnection.module.scss';

const GameReconnection = ({
    isVisible,
    onReconnect,
    onLeave,
    maxReconnectAttempts = 5,
    reconnectTimeout = 30000
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { playSound } = useSound();

    const isOnlineGame = useSelector(selectIsOnlineGame);
    const gameId = useSelector(selectGameId);
    const game = useSelector(selectGame);
    const reconnectionAttempts = useSelector(selectReconnectionAttempts);
    const { socket, isConnected, connectionState } = useSocket();

    const [isReconnecting, setIsReconnecting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(reconnectTimeout / 1000);
    const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
    const [reconnectError, setReconnectError] = useState(null);

    // Countdown timer for auto-leave
    useEffect(() => {
        if (!isVisible || isConnected) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleAutoLeave();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isVisible, isConnected]);

    // Reset timer when visibility changes
    useEffect(() => {
        if (isVisible && !isConnected) {
            setTimeLeft(reconnectTimeout / 1000);
            setReconnectError(null);
        }
    }, [isVisible, isConnected, reconnectTimeout]);

    // Auto-reconnect logic
    useEffect(() => {
        if (isVisible && !isConnected && !isReconnecting &&
            reconnectionAttempts < maxReconnectAttempts) {

            const now = Date.now();
            const timeSinceLastAttempt = now - lastReconnectAttempt;

            // Wait at least 3 seconds between attempts
            if (timeSinceLastAttempt > 3000) {
                handleReconnect();
            }
        }
    }, [isVisible, isConnected, isReconnecting, reconnectionAttempts, maxReconnectAttempts, lastReconnectAttempt]);

    const handleReconnect = useCallback(async () => {
        if (isReconnecting || !gameId) return;

        setIsReconnecting(true);
        setLastReconnectAttempt(Date.now());
        setReconnectError(null);

        try {
            playSound('buttonClick');

            await dispatch(reconnectToGame({
                gameId,
                playerData: {
                    id: game.currentPlayer?.id,
                    name: game.currentPlayer?.name
                }
            })).unwrap();

            if (onReconnect) {
                onReconnect();
            }

            playSound('success');
        } catch (error) {
            console.error('Reconnection failed:', error);
            setReconnectError(error.message || 'Failed to reconnect');
            playSound('error');
        } finally {
            setIsReconnecting(false);
        }
    }, [dispatch, gameId, game.currentPlayer, isReconnecting, onReconnect, playSound]);

    const handleManualReconnect = () => {
        if (reconnectionAttempts >= maxReconnectAttempts) {
            setReconnectError('Maximum reconnection attempts reached');
            return;
        }
        handleReconnect();
    };

    const handleLeave = useCallback(() => {
        playSound('buttonClick');

        if (gameId) {
            dispatch(leaveGame());
        }

        if (onLeave) {
            onLeave();
        } else {
            navigate('/');
        }
    }, [dispatch, gameId, navigate, onLeave, playSound]);

    const handleAutoLeave = useCallback(() => {
        playSound('warning');
        handleLeave();
    }, [handleLeave, playSound]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getConnectionStatusText = () => {
        switch (connectionState) {
            case 'connecting':
                return 'Connecting to server...';
            case 'reconnecting':
                return `Reconnecting... (${reconnectionAttempts}/${maxReconnectAttempts})`;
            case 'disconnected':
                return 'Connection lost';
            case 'error':
                return 'Connection error';
            default:
                return 'Connection issues';
        }
    };

    const canReconnect = reconnectionAttempts < maxReconnectAttempts && timeLeft > 0;

    if (!isVisible || !isOnlineGame || isConnected) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className={styles.reconnectionOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className={styles.reconnectionModal}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <div className={styles.header}>
                        <div className={styles.statusIcon}>
                            {isReconnecting ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <FaSpinner />
                                </motion.div>
                            ) : (
                                <FaExclamationTriangle />
                            )}
                        </div>
                        <div className={styles.title}>
                            <h2>Connection Lost</h2>
                            <p className={styles.subtitle}>{getConnectionStatusText()}</p>
                        </div>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.gameInfo}>
                            <div className={styles.gameIcon}>
                                <FaGamepad />
                            </div>
                            <div className={styles.gameDetails}>
                                <h3>Game in Progress</h3>
                                <p>Your online game is still active</p>
                                {gameId && (
                                    <div className={styles.gameId}>
                                        Game ID: {gameId.slice(-8)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.reconnectionInfo}>
                            <div className={styles.attempts}>
                                <span className={styles.label}>Reconnection Attempts:</span>
                                <span className={styles.value}>
                                    {reconnectionAttempts}/{maxReconnectAttempts}
                                </span>
                            </div>

                            <div className={styles.timer}>
                                <FaClock className={styles.timerIcon} />
                                <span className={styles.label}>Auto-leave in:</span>
                                <motion.span
                                    className={styles.timeValue}
                                    animate={timeLeft <= 10 ? {
                                        color: ['#ff4757', '#ff6b7a', '#ff4757']
                                    } : {}}
                                    transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
                                >
                                    {formatTime(timeLeft)}
                                </motion.span>
                            </div>

                            {reconnectError && (
                                <motion.div
                                    className={styles.errorMessage}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <FaExclamationTriangle />
                                    <span>{reconnectError}</span>
                                </motion.div>
                            )}
                        </div>

                        <div className={styles.progressSection}>
                            <div className={styles.progressLabel}>
                                {isReconnecting ? 'Reconnecting...' : 'Waiting for connection'}
                            </div>
                            <div className={styles.progressBar}>
                                <motion.div
                                    className={styles.progressFill}
                                    animate={isReconnecting ? {
                                        width: ['0%', '100%', '0%']
                                    } : {
                                        width: `${((reconnectTimeout / 1000 - timeLeft) / (reconnectTimeout / 1000)) * 100}%`
                                    }}
                                    transition={isReconnecting ? {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    } : {
                                        duration: 0.3
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <GamingButton
                            onClick={handleManualReconnect}
                            disabled={!canReconnect || isReconnecting}
                            variant="primary"
                            size="large"
                            className={styles.reconnectButton}
                        >
                            {isReconnecting ? (
                                <>
                                    <FaSpinner className={styles.spinningIcon} />
                                    Reconnecting...
                                </>
                            ) : (
                                <>
                                    <FaRedo />
                                    Reconnect Now
                                </>
                            )}
                        </GamingButton>

                        <NeonButton
                            onClick={handleLeave}
                            variant="secondary"
                            size="large"
                            className={styles.leaveButton}
                        >
                            <FaArrowLeft />
                            Leave Game
                        </NeonButton>
                    </div>

                    {/* Connection quality indicator */}
                    <div className={styles.connectionQuality}>
                        <div className={styles.qualityBars}>
                            {[1, 2, 3, 4].map((bar) => (
                                <motion.div
                                    key={bar}
                                    className={`${styles.qualityBar} ${connectionState === 'connecting' && bar <= 2 ? styles.active :
                                            connectionState === 'reconnecting' && bar <= 1 ? styles.active : ''
                                        }`}
                                    animate={connectionState === 'connecting' || connectionState === 'reconnecting' ? {
                                        opacity: [0.3, 1, 0.3]
                                    } : {}}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: bar * 0.2
                                    }}
                                />
                            ))}
                        </div>
                        <span className={styles.qualityLabel}>
                            {connectionState === 'connecting' ? 'Connecting...' :
                                connectionState === 'reconnecting' ? 'Reconnecting...' :
                                    'Disconnected'}
                        </span>
                    </div>

                    {/* Animated background elements */}
                    <div className={styles.backgroundElements}>
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={styles.floatingElement}
                                animate={{
                                    y: [0, -30, 0],
                                    opacity: [0.2, 0.5, 0.2],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    duration: 4 + i * 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.4
                                }}
                                style={{
                                    left: `${10 + i * 12}%`,
                                    top: `${15 + (i % 3) * 25}%`
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GameReconnection;