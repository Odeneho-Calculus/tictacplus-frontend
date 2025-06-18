import React from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaGamepad, FaEye, FaChartBar } from 'react-icons/fa';
import styles from './PlayerCard.module.scss';

const PlayerCard = ({
    player,
    onRequestMatch,
    onViewProfile,
    onViewStats,
    onSendFriendRequest
}) => {
    const {
        id,
        username,
        displayName,
        avatar,
        stats = {},
        isOnline,
        lastActive,
        winRate = 0
    } = player;

    // Format last active time
    const formatLastActive = (timestamp) => {
        if (!timestamp) return 'Unknown';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <motion.div
            className={styles.playerCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.playerInfo}>
                <div className={styles.avatarContainer}>
                    <div className={styles.avatar}>
                        {avatar ? (
                            <img src={avatar} alt={`${displayName || username}'s avatar`} />
                        ) : (
                            <div className={styles.defaultAvatar}>
                                {(displayName || username)?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`} />
                    </div>
                </div>

                <div className={styles.details}>
                    <h3 className={styles.playerName}>{displayName || username}</h3>
                    <div className={styles.playerStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>ELO:</span>
                            <span className={styles.statValue}>{stats.elo || 1200}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Level:</span>
                            <span className={styles.statValue}>{stats.level || 1}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Win Rate:</span>
                            <span className={styles.statValue}>{winRate}%</span>
                        </div>
                    </div>
                    <div className={styles.lastActive}>
                        {isOnline ? 'Online now' : `Last seen: ${formatLastActive(lastActive)}`}
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    className={`${styles.actionButton} ${styles.matchButton}`}
                    onClick={onRequestMatch}
                    title="Request Match"
                >
                    <FaGamepad />
                    <span>Match</span>
                </button>

                <button
                    className={`${styles.actionButton} ${styles.profileButton}`}
                    onClick={onViewProfile}
                    title="View Profile"
                >
                    <FaEye />
                    <span>Profile</span>
                </button>

                <button
                    className={`${styles.actionButton} ${styles.statsButton}`}
                    onClick={onViewStats}
                    title="View Stats"
                >
                    <FaChartBar />
                    <span>Stats</span>
                </button>

                <button
                    className={`${styles.actionButton} ${styles.friendButton}`}
                    onClick={onSendFriendRequest}
                    title="Add Friend"
                >
                    <FaUserPlus />
                    <span>Friend</span>
                </button>
            </div>
        </motion.div>
    );
};

export default PlayerCard;
