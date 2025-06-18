import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FaSearch,
    FaUsers,
    FaClock,
    FaGamepad,
    FaSpinner,
    FaUserPlus,
    FaEye,
    FaEnvelope,
    FaChartBar,
    FaFilter,
    FaSortAmountDown,
    FaSortAmountUp,
    FaArrowLeft
} from 'react-icons/fa';
import { socketManager } from '../../services/socketManager';

// Store
import {
    selectIsMatchmaking,
    selectMatchmakingStatus,
    selectMatchmakingTime,
    selectMatchmakingQueue,
    cancelMatchmaking,
    findMatch,
    sendGameInvitation
} from '../../store/slices/gameSlice';
import { selectAuth } from '../../store/slices/authSlice';
import { showWarning, showSuccess } from '../../store/slices/uiSlice';

// Components
import { GamingButton, NeonButton, LoadingSpinner } from '../../components/ui';
import PlayerCard from './components/PlayerCard';
import PlayerStats from './components/PlayerStats';
import FilterPanel from './components/FilterPanel';
import MatchRequestModal from './components/MatchRequestModal';

// Hooks
import { useSound } from '../../hooks/useSound';
import { useOnlinePlayers } from '../../hooks/useOnlinePlayers';

// Styles
import styles from './MatchmakingPage.module.scss';

const MatchmakingPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const auth = useSelector(selectAuth);
    const isMatchmaking = useSelector(selectIsMatchmaking);
    const matchmakingStatus = useSelector(selectMatchmakingStatus);
    const matchmakingTime = useSelector(selectMatchmakingTime);
    const queueInfo = useSelector(selectMatchmakingQueue);
    const { playSound } = useSound();

    // Online players hook
    const {
        players,
        loading: loadingPlayers,
        error: playersError,
        refreshPlayers
    } = useOnlinePlayers();

    // Local state
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [searchAnimation, setSearchAnimation] = useState(0);
    const [opponent, setOpponent] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [countdownToStart, setCountdownToStart] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showMatchRequestModal, setShowMatchRequestModal] = useState(false);
    const [showPlayerStats, setShowPlayerStats] = useState(false);
    const [playerStatsData, setPlayerStatsData] = useState(null);
    const [filterOptions, setFilterOptions] = useState({
        minElo: 0,
        maxElo: 3000,
        onlineOnly: true,
        showFriendsOnly: false
    });
    const [sortOption, setSortOption] = useState('elo');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

    // Check if user is authenticated
    useEffect(() => {
        if (!auth.isAuthenticated || !auth.user) {
            // If not authenticated, redirect to login
            navigate('/login', { state: { from: '/matchmaking' } });
            dispatch(showWarning('You must be logged in to use matchmaking. Please sign in or register.'));
        }
    }, [auth.isAuthenticated, auth.user, navigate, dispatch]);

    // Search animation effect
    useEffect(() => {
        if (isMatchmaking) {
            const interval = setInterval(() => {
                setSearchAnimation(prev => (prev + 1) % 4);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isMatchmaking]);

    // Calculate estimated wait time based on queue info
    useEffect(() => {
        if (queueInfo && queueInfo.averageWaitTime) {
            const baseWait = queueInfo.averageWaitTime;
            const queuePosition = queueInfo.position || 1;
            const estimated = Math.max(baseWait * queuePosition * 0.8, 10);
            setEstimatedWaitTime(Math.round(estimated));
        }
    }, [queueInfo]);

    // Handle match found event
    useEffect(() => {
        if (matchmakingStatus === 'found') {
            // Play a sound to alert the player
            playSound('notification');
        }
    }, [matchmakingStatus, playSound]);

    // Countdown timer effect
    useEffect(() => {
        if (countdownToStart !== null && countdownToStart > 0) {
            const timer = setTimeout(() => {
                setCountdownToStart(countdownToStart - 1);
                // Play a tick sound for each second
                playSound('buttonClick', { volume: 0.3 });
            }, 1000);

            return () => clearTimeout(timer);
        } else if (countdownToStart === 0) {
            // Play a final sound when countdown reaches zero
            playSound('gameStart', { volume: 0.8 });
        }
    }, [countdownToStart, playSound]);

    // Set up socket listener for matchFound event
    useEffect(() => {
        const socket = socketManager.getSocket();

        if (socket) {
            // Listen for the matchFound event
            const handleMatchFound = (data) => {
                console.log('Match found event received:', data);
                // Play a notification sound
                playSound('notification');

                // Extract game data and opponent info
                if (data && data.data && data.data.game) {
                    const game = data.data.game;
                    setGameData(game);

                    // Find opponent (the player that's not the current user)
                    if (game.players && game.players.length > 1) {
                        const currentPlayerId = auth.user?.id;
                        const opponentPlayer = game.players.find(p =>
                            p.playerId !== currentPlayerId && p.playerId.toString() !== currentPlayerId
                        );

                        if (opponentPlayer) {
                            console.log('Opponent found:', opponentPlayer);
                            setOpponent(opponentPlayer);
                        }
                    }

                    // Join the game room
                    const gameId = game.gameId;
                    if (gameId) {
                        console.log('Joining game room:', gameId);
                        socket.emit('join_game', { gameId });

                        // Start countdown to game start
                        setCountdownToStart(5); // 5 seconds countdown

                        // Schedule navigation after countdown
                        setTimeout(() => {
                            navigate(`/game/${gameId}`);
                        }, 5000); // 5 seconds delay
                    }
                }
            };

            // Add event listener
            socket.on('matchFound', handleMatchFound);

            // Also listen for game_state_update which might contain opponent info
            const handleGameStateUpdate = (data) => {
                console.log('Game state update received:', data);

                const gameState = data.game || data;
                setGameData(gameState);

                // Check if this update includes a new player (opponent)
                if (gameState.players && gameState.players.length > 1) {
                    const currentPlayerId = auth.user?.id;
                    const opponentPlayer = gameState.players.find(p =>
                        p.playerId !== currentPlayerId && p.playerId.toString() !== currentPlayerId
                    );

                    if (opponentPlayer) {
                        console.log('Opponent joined:', opponentPlayer);
                        setOpponent(opponentPlayer);
                        playSound('notification');

                        // Start countdown to game start if not already started
                        if (countdownToStart === null) {
                            setCountdownToStart(5);

                            // Schedule navigation after countdown
                            setTimeout(() => {
                                navigate(`/game/${gameState.gameId}`);
                            }, 5000);
                        }
                    }
                }
            };

            socket.on('game_state_update', handleGameStateUpdate);

            // Listen for match request events
            const handleMatchRequest = (data) => {
                console.log('Match request received:', data);
                playSound('notification');

                // Show notification to the user
                dispatch(showSuccess(`${data.senderName} has invited you to a game!`));

                // You could show a modal here to accept/decline the match
                // For now, we'll just refresh the players list
                refreshPlayers();
            };

            socket.on('match_request', handleMatchRequest);

            // Clean up
            return () => {
                socket.off('matchFound', handleMatchFound);
                socket.off('game_state_update', handleGameStateUpdate);
                socket.off('match_request', handleMatchRequest);
            };
        }
    }, [auth.user, countdownToStart, navigate, playSound, dispatch, refreshPlayers]);

    // Refresh online players list periodically
    useEffect(() => {
        const interval = setInterval(() => {
            refreshPlayers();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [refreshPlayers]);

    const handleStartMatchmaking = () => {
        if (!auth.isAuthenticated) {
            dispatch(showWarning('You must be logged in to use matchmaking'));
            return;
        }

        dispatch(findMatch({
            gameMode: 'pvp',
            isRanked: true,
            timeLimit: 30
        }));

        playSound('buttonClick');
    };

    const handleCancelMatchmaking = () => {
        dispatch(cancelMatchmaking());
        playSound('buttonClick');
    };

    const handleSendMatchRequest = (playerId, message = '') => {
        if (!auth.isAuthenticated) {
            dispatch(showWarning('You must be logged in to send match requests'));
            return;
        }

        dispatch(sendGameInvitation({ playerId, message }))
            .unwrap()
            .then(() => {
                playSound('notification');
                dispatch(showSuccess('Match request sent successfully!'));
                setShowMatchRequestModal(false);
            })
            .catch(error => {
                dispatch(showWarning(`Failed to send match request: ${error.message}`));
            });
    };

    const handleViewProfile = (player) => {
        // Navigate to player profile page
        navigate(`/profile/${player.id}`);
    };

    const handleViewStats = (player) => {
        setPlayerStatsData(player);
        setShowPlayerStats(true);
    };

    const handleSendFriendRequest = (playerId) => {
        // Implement friend request functionality
        console.log('Send friend request to:', playerId);
        dispatch(showSuccess('Friend request sent!'));
    };

    const handleRequestMatch = (player) => {
        setSelectedPlayer(player);
        setShowMatchRequestModal(true);
    };

    const handleFilterChange = (newFilters) => {
        setFilterOptions(newFilters);
    };

    const handleSortChange = (option) => {
        if (sortOption === option) {
            // Toggle direction if clicking the same option
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortOption(option);
            setSortDirection('desc'); // Default to descending for new sort option
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusMessage = () => {
        switch (matchmakingStatus) {
            case 'searching':
                return 'Searching for opponents...';
            case 'found':
                return 'Match found! Preparing game...';
            case 'failed':
                return 'Failed to find match. Please try again.';
            case 'cancelled':
                return 'Matchmaking cancelled.';
            default:
                return 'Ready to find a match?';
        }
    };

    // Filter and sort players
    const filteredPlayers = players.filter(player => {
        // Don't show current user
        if (player.id === auth.user?.id) return false;

        // Apply ELO filter
        if (player.stats?.elo < filterOptions.minElo || player.stats?.elo > filterOptions.maxElo) return false;

        // Apply online filter
        if (filterOptions.onlineOnly && !player.isOnline) return false;

        // Apply friends filter (would need friend list implementation)
        if (filterOptions.showFriendsOnly) {
            // This would check if player is in user's friend list
            // For now, we'll just return true
            return true;
        }

        return true;
    });

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        let valueA, valueB;

        switch (sortOption) {
            case 'elo':
                valueA = a.stats?.elo || 0;
                valueB = b.stats?.elo || 0;
                break;
            case 'level':
                valueA = a.stats?.level || 0;
                valueB = b.stats?.level || 0;
                break;
            case 'winRate':
                valueA = a.winRate || 0;
                valueB = b.winRate || 0;
                break;
            case 'name':
                valueA = a.displayName || a.username || '';
                valueB = b.displayName || b.username || '';
                return sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            default:
                valueA = a.stats?.elo || 0;
                valueB = b.stats?.elo || 0;
        }

        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });

    const searchDots = '.'.repeat(searchAnimation + 1);

    return (
        <div className={styles.matchmakingPage}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.backButton}
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className={styles.title}>
                        <FaGamepad className={styles.titleIcon} />
                        <span>Matchmaking</span>
                    </h1>
                </div>

                <div className={styles.headerRight}>
                    {isMatchmaking ? (
                        <div className={styles.matchmakingStatus}>
                            <div className={styles.statusIcon}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <FaSearch />
                                </motion.div>
                            </div>
                            <div className={styles.statusText}>
                                <span>{getStatusMessage()}</span>
                                <span className={styles.timeElapsed}>
                                    Time: {formatTime(matchmakingTime || 0)}
                                </span>
                            </div>
                            <NeonButton
                                color="danger"
                                onClick={handleCancelMatchmaking}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </NeonButton>
                        </div>
                    ) : (
                        <GamingButton
                            onClick={handleStartMatchmaking}
                            className={styles.findMatchButton}
                        >
                            Find Match
                        </GamingButton>
                    )}
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.playerListSection}>
                    <div className={styles.playerListHeader}>
                        <h2>Available Players</h2>
                        <div className={styles.playerListControls}>
                            <button
                                className={styles.filterButton}
                                onClick={() => setShowFilters(!showFilters)}
                                aria-label="Toggle filters"
                            >
                                <FaFilter />
                                <span>Filters</span>
                            </button>

                            <div className={styles.sortButtons}>
                                <button
                                    className={`${styles.sortButton} ${sortOption === 'elo' ? styles.active : ''}`}
                                    onClick={() => handleSortChange('elo')}
                                    aria-label="Sort by ELO"
                                >
                                    ELO {sortOption === 'elo' && (sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />)}
                                </button>
                                <button
                                    className={`${styles.sortButton} ${sortOption === 'level' ? styles.active : ''}`}
                                    onClick={() => handleSortChange('level')}
                                    aria-label="Sort by level"
                                >
                                    Level {sortOption === 'level' && (sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />)}
                                </button>
                                <button
                                    className={`${styles.sortButton} ${sortOption === 'winRate' ? styles.active : ''}`}
                                    onClick={() => handleSortChange('winRate')}
                                    aria-label="Sort by win rate"
                                >
                                    Win Rate {sortOption === 'winRate' && (sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />)}
                                </button>
                                <button
                                    className={`${styles.sortButton} ${sortOption === 'name' ? styles.active : ''}`}
                                    onClick={() => handleSortChange('name')}
                                    aria-label="Sort by name"
                                >
                                    Name {sortOption === 'name' && (sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />)}
                                </button>
                            </div>

                            <button
                                className={styles.refreshButton}
                                onClick={refreshPlayers}
                                aria-label="Refresh player list"
                            >
                                <FaSearch />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <FilterPanel
                            filters={filterOptions}
                            onFilterChange={handleFilterChange}
                            onClose={() => setShowFilters(false)}
                        />
                    )}

                    <div className={styles.playerList}>
                        {loadingPlayers ? (
                            <div className={styles.loadingContainer}>
                                <LoadingSpinner size="large" />
                                <p>Loading players...</p>
                            </div>
                        ) : playersError ? (
                            <div className={styles.errorContainer}>
                                <p>Error loading players: {playersError}</p>
                                <button onClick={refreshPlayers} className={styles.retryButton}>
                                    Retry
                                </button>
                            </div>
                        ) : sortedPlayers.length === 0 ? (
                            <div className={styles.emptyContainer}>
                                <p>No players match your filters</p>
                                <button onClick={() => setFilterOptions({
                                    minElo: 0,
                                    maxElo: 3000,
                                    onlineOnly: true,
                                    showFriendsOnly: false
                                })} className={styles.resetButton}>
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            sortedPlayers.map(player => (
                                <PlayerCard
                                    key={player.id}
                                    player={player}
                                    onRequestMatch={() => handleRequestMatch(player)}
                                    onViewProfile={() => handleViewProfile(player)}
                                    onViewStats={() => handleViewStats(player)}
                                    onSendFriendRequest={() => handleSendFriendRequest(player.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.queueInfo}>
                        <h3>Queue Information</h3>
                        {queueInfo ? (
                            <div className={styles.queueStats}>
                                <div className={styles.queueStat}>
                                    <FaUsers className={styles.queueIcon} />
                                    <span className={styles.queueLabel}>Players Online:</span>
                                    <span className={styles.queueValue}>{queueInfo.playersOnline || players.filter(p => p.isOnline).length}</span>
                                </div>
                                <div className={styles.queueStat}>
                                    <FaSearch className={styles.queueIcon} />
                                    <span className={styles.queueLabel}>In Queue:</span>
                                    <span className={styles.queueValue}>{queueInfo.playersInQueue || 0}</span>
                                </div>
                                <div className={styles.queueStat}>
                                    <FaClock className={styles.queueIcon} />
                                    <span className={styles.queueLabel}>Avg. Wait Time:</span>
                                    <span className={styles.queueValue}>
                                        {queueInfo.averageWaitTime ? formatTime(queueInfo.averageWaitTime) : '0:30'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p>Queue information not available</p>
                        )}
                    </div>

                    <div className={styles.yourStats}>
                        <h3>Your Stats</h3>
                        {auth.user ? (
                            <div className={styles.statsContainer}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>ELO Rating:</span>
                                    <span className={styles.statValue}>{auth.user.stats?.elo || 1200}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Level:</span>
                                    <span className={styles.statValue}>{auth.user.stats?.level || 1}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Win Rate:</span>
                                    <span className={styles.statValue}>
                                        {auth.user.stats?.gamesPlayed
                                            ? Math.round((auth.user.stats.gamesWon / auth.user.stats.gamesPlayed) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Games Played:</span>
                                    <span className={styles.statValue}>{auth.user.stats?.gamesPlayed || 0}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Rank:</span>
                                    <span className={styles.statValue}>{auth.user.stats?.rank || 'Novice'}</span>
                                </div>
                            </div>
                        ) : (
                            <p>Sign in to view your stats</p>
                        )}
                    </div>

                    <div className={styles.howToPlay}>
                        <h3>How to Play</h3>
                        <ul className={styles.instructions}>
                            <li>Click <strong>Find Match</strong> to join the matchmaking queue</li>
                            <li>Or send a direct match request to a specific player</li>
                            <li>Once matched, you'll be redirected to the game</li>
                            <li>Win games to increase your ELO rating and level up</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Match Request Modal */}
            {showMatchRequestModal && selectedPlayer && (
                <MatchRequestModal
                    player={selectedPlayer}
                    onSend={(message) => handleSendMatchRequest(selectedPlayer.id, message)}
                    onCancel={() => setShowMatchRequestModal(false)}
                />
            )}

            {/* Player Stats Modal */}
            {showPlayerStats && playerStatsData && (
                <PlayerStats
                    player={playerStatsData}
                    onClose={() => setShowPlayerStats(false)}
                />
            )}
        </div>
    );
};

export default MatchmakingPage;
