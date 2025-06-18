import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaUserFriends, FaStopCircle, FaClock } from 'react-icons/fa';
import Button from '../../../components/ui/Button/Button';
import styles from './MatchmakingStatus.module.scss';

const MatchmakingStatus = ({ status, time, onCancel }) => {
    const [dots, setDots] = useState('.');
    const [elapsedTime, setElapsedTime] = useState(time || 0);

    // Animate the dots
    useEffect(() => {
        if (status === 'searching') {
            const interval = setInterval(() => {
                setDots(prev => prev.length < 3 ? prev + '.' : '.');
            }, 500);

            return () => clearInterval(interval);
        }
    }, [status]);

    // Update elapsed time
    useEffect(() => {
        if (status === 'searching') {
            const interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [status]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get status message
    const getStatusMessage = () => {
        switch (status) {
            case 'searching':
                return `Searching for opponents${dots}`;
            case 'found':
                return 'Match found! Preparing game...';
            case 'failed':
                return 'Failed to find match. Please try again.';
            case 'cancelled':
                return 'Matchmaking cancelled.';
            default:
                return 'Waiting for matchmaking...';
        }
    };

    // Get status icon
    const getStatusIcon = () => {
        switch (status) {
            case 'searching':
                return <FaSpinner className={styles.spinningIcon} />;
            case 'found':
                return <FaUserFriends className={styles.foundIcon} />;
            case 'failed':
                return <FaStopCircle className={styles.failedIcon} />;
            case 'cancelled':
                return <FaStopCircle className={styles.cancelledIcon} />;
            default:
                return <FaSpinner className={styles.spinningIcon} />;
        }
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.statusCard}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className={styles.statusHeader}>
                    {getStatusIcon()}
                    <h3>{getStatusMessage()}</h3>
                </div>

                <div className={styles.statusDetails}>
                    <div className={styles.timeInfo}>
                        <FaClock className={styles.clockIcon} />
                        <span>Time elapsed: {formatTime(elapsedTime)}</span>
                    </div>

                    {status === 'searching' && (
                        <div className={styles.progressBar}>
                            <div className={styles.progressInner} />
                        </div>
                    )}
                </div>

                {status === 'searching' && (
                    <div className={styles.actions}>
                        <Button
                            onClick={onCancel}
                            variant="danger"
                            size="medium"
                            fullWidth
                        >
                            Cancel Matchmaking
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default MatchmakingStatus;