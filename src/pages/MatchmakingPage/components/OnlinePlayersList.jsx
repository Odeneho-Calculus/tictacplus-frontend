import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserFriends, FaGamepad, FaChartBar, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import styles from './OnlinePlayersList.module.scss';

const OnlinePlayersList = ({ players, currentUserId, onPlayerClick, onViewStats }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('elo');
    const [sortDirection, setSortDirection] = useState('desc');

    // Filter players based on search term
    const filteredPlayers = players.filter(player => {
        const searchString = `${player.username} ${player.displayName || ''}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    // Sort players
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        let valueA, valueB;

        switch (sortBy) {
            case 'elo':
                valueA = a.stats?.elo || 0;
                valueB = b.stats?.elo || 0;
                break;
            case 'winRate':
                valueA = a.winRate || 0;
                valueB = b.winRate || 0;
                break;
            case 'level':
                valueA = a.stats?.level || 0;
                valueB = b.stats?.level || 0;
                break;
            default:
                valueA = a.stats?.elo || 0;
                valueB = b.stats?.elo || 0;
        }

        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });

    const handleSortChange = (field) => {
        if (sortBy === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to descending
            setSortBy(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return null;
        return sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />;
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchBar}>
                <FaSearch className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.sortOptions}>
                <button
                    className={`${styles.sortButton} ${sortBy === 'elo' ? styles.active : ''}`}
                    onClick={() => handleSortChange('elo')}
                >
                    ELO {getSortIcon('elo')}
                </button>
                <button
                    className={`${styles.sortButton} ${sortBy === 'winRate' ? styles.active : ''}`}
                    onClick={() => handleSortChange('winRate')}
                >
                    Win Rate {getSortIcon('winRate')}
                </button>
                <button
                    className={`${styles.sortButton} ${sortBy === 'level' ? styles.active : ''}`}
                    onClick={() => handleSortChange('level')}
                >
                    Level {getSortIcon('level')}
                </button>
            </div>

            {sortedPlayers.length === 0 ? (
                <div className={styles.emptyState}>
                    <FaUserFriends className={styles.emptyIcon} />
                    <p>No players found</p>
                    {searchTerm && <p className={styles.emptySubtext}>Try a different search term</p>}
                </div>
            ) : (
                <div className={styles.playersList}>
                    <AnimatePresence>
                        {sortedPlayers.map(player => (
                            <motion.div
                                key={player.id}
                                className={styles.playerCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => onPlayerClick(player)}
                            >
                                <div className={styles.playerInfo}>
                                    <div className={styles.avatar}>
                                        {player.avatar ? (
                                            <img src={player.avatar} alt={`${player.displayName || player.username}'s avatar`} />
                                        ) : (
                                            <div className={styles.defaultAvatar}>
                                                {(player.displayName || player.username)?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        {player.isOnline && <div className={styles.onlineIndicator} />}
                                    </div>

                                    <div className={styles.playerDetails}>
                                        <h3>{player.displayName || player.username}</h3>
                                        <div className={styles.playerStats}>
                                            <span className={styles.statItem}>
                                                ELO: {player.stats?.elo || 1200}
                                            </span>
                                            <span className={styles.statItem}>
                                                Win Rate: {player.winRate || 0}%
                                            </span>
                                            <span className={styles.statItem}>
                                                Level: {player.stats?.level || 1}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.playerActions}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewStats(player);
                                        }}
                                        title="View Stats"
                                    >
                                        <FaChartBar />
                                    </button>

                                    {player.id !== currentUserId && (
                                        <button
                                            className={`${styles.actionButton} ${styles.primary}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlayerClick(player);
                                            }}
                                            title="Challenge to a Game"
                                        >
                                            <FaGamepad />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default OnlinePlayersList;