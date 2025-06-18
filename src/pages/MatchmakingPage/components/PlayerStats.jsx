import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaChartBar, FaTrophy, FaGamepad, FaCalendarAlt } from 'react-icons/fa';
import styles from './PlayerStats.module.scss';

const PlayerStats = ({ player, onClose }) => {
    const {
        username,
        displayName,
        avatar,
        stats = {},
        winRate = 0,
        createdAt
    } = player;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Calculate win/loss ratio
    const calculateRatio = () => {
        if (!stats.gamesLost || stats.gamesLost === 0) return stats.gamesWon || 0;
        return ((stats.gamesWon || 0) / stats.gamesLost).toFixed(2);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>
                        <FaChartBar className={styles.icon} />
                        Player Statistics
                    </h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.playerInfo}>
                        <div className={styles.avatar}>
                            {avatar ? (
                                <img src={avatar} alt={`${displayName || username}'s avatar`} />
                            ) : (
                                <div className={styles.defaultAvatar}>
                                    {(displayName || username)?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className={styles.playerDetails}>
                            <h3>{displayName || username}</h3>
                            <div className={styles.playerRank}>
                                <span className={styles.rankBadge}>{stats.rank || 'Novice'}</span>
                                <span className={styles.joinDate}>
                                    <FaCalendarAlt /> Joined: {formatDate(createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <FaTrophy />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.elo || 1200}</span>
                                <span className={styles.statLabel}>ELO Rating</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <FaGamepad />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats.level || 1}</span>
                                <span className={styles.statLabel}>Level</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <FaChartBar />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{winRate}%</span>
                                <span className={styles.statLabel}>Win Rate</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <FaTrophy />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{calculateRatio()}</span>
                                <span className={styles.statLabel}>W/L Ratio</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.detailedStats}>
                        <h4>Detailed Statistics</h4>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Games Played</span>
                            <span className={styles.statValue}>{stats.gamesPlayed || 0}</span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Games Won</span>
                            <span className={styles.statValue}>{stats.gamesWon || 0}</span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Games Lost</span>
                            <span className={styles.statValue}>{stats.gamesLost || 0}</span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Games Draw</span>
                            <span className={styles.statValue}>{stats.gamesDraw || 0}</span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Best Win Streak</span>
                            <span className={styles.statValue}>{stats.bestWinStreak || 0}</span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Current Win Streak</span>
                            <span className={styles.statValue}>{stats.winStreak || 0}</span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Average Game Time</span>
                            <span className={styles.statValue}>
                                {stats.averageGameTime
                                    ? `${Math.floor(stats.averageGameTime / 60)}:${(stats.averageGameTime % 60).toString().padStart(2, '0')}`
                                    : '0:00'}
                            </span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statName}>Total Score</span>
                            <span className={styles.statValue}>{stats.totalScore || 0}</span>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PlayerStats;
