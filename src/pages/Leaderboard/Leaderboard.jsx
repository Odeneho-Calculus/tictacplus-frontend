import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// Components
import { LoadingSpinner } from '../../components/ui';

// Styles
import styles from './Leaderboard.module.scss';

const Leaderboard = () => {
    const { player } = useSelector((state) => state.player);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('winRate');

    // Mock leaderboard data
    const mockLeaderboardData = [
        {
            id: 1,
            name: 'Player 1',
            avatar: null,
            totalGames: 150,
            wins: 120,
            losses: 25,
            draws: 5,
            winRate: 80.0,
            score: 2400,
            rank: 1,
            badge: 'gold'
        },
        {
            id: 2,
            name: 'Player 2',
            avatar: null,
            totalGames: 130,
            wins: 95,
            losses: 30,
            draws: 5,
            winRate: 73.1,
            score: 2100,
            rank: 2,
            badge: 'silver'
        },
        {
            id: 3,
            name: 'Player 3',
            avatar: null,
            totalGames: 120,
            wins: 85,
            losses: 30,
            draws: 5,
            winRate: 70.8,
            score: 1950,
            rank: 3,
            badge: 'bronze'
        }
    ];

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                setLeaderboardData(mockLeaderboardData);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [filter, sortBy]);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="large" text="Loading leaderboard..." />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Leaderboard - TicTac+</title>
                <meta name="description" content="View the top players and your ranking in TicTac+" />
            </Helmet>

            <div className={styles.leaderboard}>
                <motion.div
                    className={styles.container}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className={styles.header}>
                        <h1 className={styles.title}>Leaderboard</h1>
                        <p className={styles.subtitle}>See how you rank against other players</p>
                    </div>

                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label>Time Period:</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.select}
                            >
                                <option value="all">All Time</option>
                                <option value="monthly">This Month</option>
                                <option value="weekly">This Week</option>
                                <option value="daily">Today</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={styles.select}
                            >
                                <option value="winRate">Win Rate</option>
                                <option value="totalGames">Total Games</option>
                                <option value="score">Score</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.leaderboardList}>
                        <AnimatePresence>
                            {leaderboardData.map((player, index) => (
                                <motion.div
                                    key={player.id}
                                    className={styles.playerCard}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className={styles.rank}>
                                        <span className={styles.rankIcon}>
                                            {getRankIcon(player.rank)}
                                        </span>
                                    </div>

                                    <div className={styles.playerInfo}>
                                        <div className={styles.avatar}>
                                            {player.avatar ? (
                                                <img src={player.avatar} alt={player.name} />
                                            ) : (
                                                <div className={styles.defaultAvatar}>
                                                    {player.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.details}>
                                            <h3 className={styles.name}>{player.name}</h3>
                                            <div className={styles.stats}>
                                                <span>Games: {player.totalGames}</span>
                                                <span>Win Rate: {player.winRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.score}>
                                        <span className={styles.scoreValue}>{player.score}</span>
                                        <span className={styles.scoreLabel}>Score</span>
                                    </div>

                                    <div className={styles.record}>
                                        <div className={styles.recordItem}>
                                            <span className={styles.wins}>{player.wins}W</span>
                                        </div>
                                        <div className={styles.recordItem}>
                                            <span className={styles.losses}>{player.losses}L</span>
                                        </div>
                                        <div className={styles.recordItem}>
                                            <span className={styles.draws}>{player.draws}D</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default Leaderboard;