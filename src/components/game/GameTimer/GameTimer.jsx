import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';

// Store
import {
    selectGame,
    selectIsOnlineGame,
    makeOnlineMove,
    forfeitGame
} from '../../../store/slices/gameSlice';

// Utils
import { GAME_STATES } from '../../../utils/constants';

// Hooks
import { useSound } from '../../../hooks/useSound';

// Styles
import styles from './GameTimer.module.scss';

const GameTimer = ({
    timeLimit = 30,
    warningTime = 10,
    criticalTime = 5,
    onTimeUp,
    className
}) => {
    const dispatch = useDispatch();
    const game = useSelector(selectGame);
    const isOnlineGame = useSelector(selectIsOnlineGame);
    const { playSound } = useSound();

    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isActive, setIsActive] = useState(false);
    const [hasWarned, setHasWarned] = useState(false);
    const [hasCriticalWarned, setHasCriticalWarned] = useState(false);

    const { status, currentPlayer, playerX, playerO, lastMoveTime } = game;

    // Reset timer when it's a new turn
    useEffect(() => {
        if (status === GAME_STATES.PLAYING && timeLimit > 0) {
            setTimeLeft(timeLimit);
            setIsActive(true);
            setHasWarned(false);
            setHasCriticalWarned(false);
        } else {
            setIsActive(false);
        }
    }, [currentPlayer, status, timeLimit, lastMoveTime]);

    // Timer countdown logic
    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0 && status === GAME_STATES.PLAYING) {
            interval = setInterval(() => {
                setTimeLeft(prevTime => {
                    const newTime = prevTime - 1;

                    // Warning sound at warning threshold
                    if (newTime === warningTime && !hasWarned) {
                        playSound('warning', { volume: 0.7 });
                        setHasWarned(true);
                    }

                    // Critical warning sound at critical threshold
                    if (newTime === criticalTime && !hasCriticalWarned) {
                        playSound('critical', { volume: 0.9 });
                        setHasCriticalWarned(true);
                    }

                    // Time up
                    if (newTime <= 0) {
                        playSound('timeUp', { volume: 1.0 });
                        setIsActive(false);

                        if (onTimeUp) {
                            onTimeUp();
                        } else if (isOnlineGame) {
                            // Auto-forfeit in online games when time runs out
                            dispatch(forfeitGame());
                        }

                        return 0;
                    }

                    return newTime;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval);
    }, [
        isActive,
        timeLeft,
        status,
        warningTime,
        criticalTime,
        hasWarned,
        hasCriticalWarned,
        playSound,
        onTimeUp,
        isOnlineGame,
        dispatch
    ]);

    // Format time display
    const formatTime = useCallback((seconds) => {
        if (seconds <= 0) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Get timer status
    const getTimerStatus = useCallback(() => {
        if (timeLeft <= criticalTime) return 'critical';
        if (timeLeft <= warningTime) return 'warning';
        return 'normal';
    }, [timeLeft, criticalTime, warningTime]);

    // Get current player info
    const getCurrentPlayerInfo = useCallback(() => {
        return currentPlayer === 'X' ? playerX : playerO;
    }, [currentPlayer, playerX, playerO]);

    // Don't render if no time limit or not an online game
    if (!timeLimit || timeLimit <= 0 || !isOnlineGame) {
        return null;
    }

    // Don't render if game is not in playing state
    if (status !== GAME_STATES.PLAYING) {
        return null;
    }

    const timerStatus = getTimerStatus();
    const currentPlayerInfo = getCurrentPlayerInfo();
    const progress = (timeLeft / timeLimit) * 100;

    return (
        <motion.div
            className={`${styles.gameTimer} ${styles[timerStatus]} ${className || ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.timerHeader}>
                <div className={styles.timerIcon}>
                    {timerStatus === 'critical' ? (
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <FaExclamationTriangle />
                        </motion.div>
                    ) : timerStatus === 'warning' ? (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <FaHourglassHalf />
                        </motion.div>
                    ) : (
                        <FaClock />
                    )}
                </div>
                <div className={styles.timerLabel}>
                    {currentPlayerInfo.displayName || currentPlayerInfo.name || 'Player'}'s Turn
                </div>
            </div>

            <div className={styles.timerDisplay}>
                <motion.div
                    className={styles.timeText}
                    animate={timerStatus === 'critical' ? {
                        scale: [1, 1.1, 1],
                        color: ['#ff4757', '#ff6b7a', '#ff4757']
                    } : {}}
                    transition={{ duration: 0.5, repeat: timerStatus === 'critical' ? Infinity : 0 }}
                >
                    {formatTime(timeLeft)}
                </motion.div>
            </div>

            <div className={styles.progressContainer}>
                <motion.div
                    className={styles.progressBar}
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
                <div className={styles.progressTrack} />
            </div>

            {/* Warning messages */}
            <AnimatePresence>
                {timerStatus === 'warning' && (
                    <motion.div
                        className={styles.warningMessage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        Hurry up! {warningTime} seconds left
                    </motion.div>
                )}

                {timerStatus === 'critical' && (
                    <motion.div
                        className={styles.criticalMessage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: [1, 1.05, 1]
                        }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                            scale: { duration: 0.5, repeat: Infinity }
                        }}
                    >
                        TIME RUNNING OUT!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pulse effect for critical time */}
            {timerStatus === 'critical' && (
                <motion.div
                    className={styles.pulseEffect}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </motion.div>
    );
};

// Compact timer for header display
export const CompactTimer = ({
    timeLimit = 30,
    warningTime = 10,
    criticalTime = 5
}) => {
    const game = useSelector(selectGame);
    const isOnlineGame = useSelector(selectIsOnlineGame);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [isActive, setIsActive] = useState(false);

    const { status, currentPlayer, lastMoveTime } = game;

    // Reset timer when it's a new turn
    useEffect(() => {
        if (status === GAME_STATES.PLAYING && timeLimit > 0) {
            setTimeLeft(timeLimit);
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    }, [currentPlayer, status, timeLimit, lastMoveTime]);

    // Timer countdown
    useEffect(() => {
        let interval = null;

        if (isActive && timeLeft > 0 && status === GAME_STATES.PLAYING) {
            interval = setInterval(() => {
                setTimeLeft(prevTime => Math.max(0, prevTime - 1));
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, status]);

    if (!timeLimit || !isOnlineGame || status !== GAME_STATES.PLAYING) {
        return null;
    }

    const getTimerStatus = () => {
        if (timeLeft <= criticalTime) return 'critical';
        if (timeLeft <= warningTime) return 'warning';
        return 'normal';
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const timerStatus = getTimerStatus();

    return (
        <motion.div
            className={`${styles.compactTimer} ${styles[timerStatus]}`}
            animate={timerStatus === 'critical' ? {
                scale: [1, 1.05, 1]
            } : {}}
            transition={{ duration: 0.5, repeat: timerStatus === 'critical' ? Infinity : 0 }}
        >
            <FaClock className={styles.compactIcon} />
            <span className={styles.compactTime}>{formatTime(timeLeft)}</span>
        </motion.div>
    );
};

export default GameTimer;