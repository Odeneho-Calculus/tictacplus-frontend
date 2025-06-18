import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy,
    FaCrown,
    FaUsers,
    FaCalendarAlt,
    FaClock,
    FaPlay,
    FaEye,
    FaMedal,
    FaStar,
    FaFire,
    FaChartLine,
    FaGamepad,
    FaArrowRight,
    FaCheck,
    FaTimes
} from 'react-icons/fa';

// Store
import {
    selectTournament,
    selectTournamentBracket,
    joinTournament,
    leaveTournament,
    startTournamentMatch,
    selectTournamentMatches
} from '../../../store/slices/gameSlice';
import { selectAuth } from '../../../store/slices/authSlice';

// Components
import { GamingButton, NeonButton, Card } from '../../ui';

// Hooks
import { useSocket } from '../../../hooks/useSocket';
import { useSound } from '../../../hooks/useSound';

// Utils
import { formatTime, formatDate } from '../../../utils/dateUtils';

// Styles
import styles from './GameTournament.module.scss';

const GameTournament = ({ tournamentId, onMatchStart, onTournamentEnd }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { playSound } = useSound();

    const tournament = useSelector(selectTournament);
    const bracket = useSelector(selectTournamentBracket);
    const matches = useSelector(selectTournamentMatches);
    const auth = useSelector(selectAuth);
    const { socket, isConnected } = useSocket();

    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showBracket, setShowBracket] = useState(true);
    const [showStats, setShowStats] = useState(false);

    // Tournament status calculations
    const tournamentStats = useMemo(() => {
        if (!tournament || !matches) return null;

        const totalMatches = matches.length;
        const completedMatches = matches.filter(m => m.status === 'completed').length;
        const activeMatches = matches.filter(m => m.status === 'active').length;
        const upcomingMatches = matches.filter(m => m.status === 'pending').length;

        return {
            totalMatches,
            completedMatches,
            activeMatches,
            upcomingMatches,
            progress: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
        };
    }, [tournament, matches]);

    // User's tournament status
    const userStatus = useMemo(() => {
        if (!tournament || !auth.user) return null;

        const isParticipant = tournament.participants?.some(p => p.id === auth.user.id);
        const userMatches = matches?.filter(m =>
            m.player1?.id === auth.user.id || m.player2?.id === auth.user.id
        ) || [];

        const userActiveMatch = userMatches.find(m => m.status === 'active');
        const userNextMatch = userMatches.find(m => m.status === 'pending');
        const userCompletedMatches = userMatches.filter(m => m.status === 'completed');

        const wins = userCompletedMatches.filter(m => m.winner?.id === auth.user.id).length;
        const losses = userCompletedMatches.length - wins;

        return {
            isParticipant,
            activeMatch: userActiveMatch,
            nextMatch: userNextMatch,
            wins,
            losses,
            isEliminated: isParticipant && !userActiveMatch && !userNextMatch && losses > 0
        };
    }, [tournament, matches, auth.user]);

    const handleJoinTournament = async () => {
        if (!tournament || !auth.user) return;

        try {
            playSound('success');
            await dispatch(joinTournament({
                tournamentId,
                player: {
                    id: auth.user.id,
                    name: auth.user.displayName || auth.user.username,
                    avatar: auth.user.avatar,
                    elo: auth.user.stats?.elo || 1200,
                    level: auth.user.stats?.level || 1
                }
            })).unwrap();
        } catch (error) {
            console.error('Failed to join tournament:', error);
            playSound('error');
        }
    };

    const handleLeaveTournament = async () => {
        if (!tournament || !auth.user) return;

        try {
            playSound('buttonClick');
            await dispatch(leaveTournament({
                tournamentId,
                playerId: auth.user.id
            })).unwrap();
        } catch (error) {
            console.error('Failed to leave tournament:', error);
            playSound('error');
        }
    };

    const handleStartMatch = async (matchId) => {
        try {
            playSound('gameStart');
            await dispatch(startTournamentMatch(matchId)).unwrap();

            if (onMatchStart) {
                onMatchStart(matchId);
            }
        } catch (error) {
            console.error('Failed to start match:', error);
            playSound('error');
        }
    };

    const handleWatchMatch = (matchId) => {
        navigate(`/game/${matchId}?spectate=true`);
    };

    const getTournamentStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return 'var(--warning-color)';
            case 'active':
                return 'var(--success-color)';
            case 'completed':
                return 'var(--info-color)';
            default:
                return 'var(--text-secondary)';
        }
    };

    const getMatchStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <FaPlay />;
            case 'completed':
                return <FaCheck />;
            case 'pending':
                return <FaClock />;
            default:
                return <FaGamepad />;
        }
    };

    if (!tournament) {
        return (
            <div className={styles.tournamentLoading}>
                <div className={styles.loadingSpinner} />
                <p>Loading tournament...</p>
            </div>
        );
    }

    return (
        <div className={styles.gameTournament}>
            {/* Tournament Header */}
            <div className={styles.tournamentHeader}>
                <div className={styles.tournamentInfo}>
                    <div className={styles.tournamentTitle}>
                        <div className={styles.tournamentIcon}>
                            <FaTrophy />
                        </div>
                        <div className={styles.titleContent}>
                            <h1>{tournament.name}</h1>
                            <div className={styles.tournamentMeta}>
                                <span className={styles.tournamentType}>
                                    {tournament.type?.toUpperCase() || 'SINGLE ELIMINATION'}
                                </span>
                                <span
                                    className={styles.tournamentStatus}
                                    style={{ color: getTournamentStatusColor(tournament.status) }}
                                >
                                    {tournament.status?.toUpperCase()}
                                </span>
                                <span className={styles.prizePool}>
                                    Prize: {tournament.prizePool || 'Glory'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tournamentStats}>
                        <div className={styles.statItem}>
                            <FaUsers />
                            <span>{tournament.participants?.length || 0}/{tournament.maxParticipants}</span>
                        </div>
                        <div className={styles.statItem}>
                            <FaCalendarAlt />
                            <span>{formatDate(tournament.startTime)}</span>
                        </div>
                        <div className={styles.statItem}>
                            <FaClock />
                            <span>{formatTime(tournament.estimatedDuration)}</span>
                        </div>
                    </div>
                </div>

                {/* Tournament Progress */}
                {tournamentStats && (
                    <div className={styles.tournamentProgress}>
                        <div className={styles.progressInfo}>
                            <span>Tournament Progress</span>
                            <span>{Math.round(tournamentStats.progress)}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <motion.div
                                className={styles.progressFill}
                                initial={{ width: 0 }}
                                animate={{ width: `${tournamentStats.progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <div className={styles.progressStats}>
                            <span>Completed: {tournamentStats.completedMatches}</span>
                            <span>Active: {tournamentStats.activeMatches}</span>
                            <span>Upcoming: {tournamentStats.upcomingMatches}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.tournamentContent}>
                {/* Left Panel - Tournament Info & Controls */}
                <div className={styles.leftPanel}>
                    {/* User Status Card */}
                    {userStatus && (
                        <Card className={styles.userStatusCard}>
                            <div className={styles.cardHeader}>
                                <h3>Your Status</h3>
                                {userStatus.isParticipant && (
                                    <div className={styles.userRecord}>
                                        <span className={styles.wins}>{userStatus.wins}W</span>
                                        <span className={styles.losses}>{userStatus.losses}L</span>
                                    </div>
                                )}
                            </div>

                            {!userStatus.isParticipant ? (
                                <div className={styles.joinSection}>
                                    <p>Join this tournament to compete for glory!</p>
                                    <GamingButton
                                        onClick={handleJoinTournament}
                                        disabled={tournament.status !== 'upcoming' ||
                                            tournament.participants?.length >= tournament.maxParticipants}
                                        variant="primary"
                                        size="large"
                                    >
                                        <FaTrophy />
                                        Join Tournament
                                    </GamingButton>
                                </div>
                            ) : (
                                <div className={styles.participantSection}>
                                    {userStatus.isEliminated ? (
                                        <div className={styles.eliminatedStatus}>
                                            <FaTimes />
                                            <span>Eliminated</span>
                                        </div>
                                    ) : userStatus.activeMatch ? (
                                        <div className={styles.activeMatchSection}>
                                            <h4>Active Match</h4>
                                            <div className={styles.matchInfo}>
                                                <span>vs {userStatus.activeMatch.opponent?.name}</span>
                                                <GamingButton
                                                    onClick={() => handleStartMatch(userStatus.activeMatch.id)}
                                                    variant="primary"
                                                    size="medium"
                                                >
                                                    <FaPlay />
                                                    Play Now
                                                </GamingButton>
                                            </div>
                                        </div>
                                    ) : userStatus.nextMatch ? (
                                        <div className={styles.nextMatchSection}>
                                            <h4>Next Match</h4>
                                            <div className={styles.matchInfo}>
                                                <span>vs {userStatus.nextMatch.opponent?.name || 'TBD'}</span>
                                                <span className={styles.matchTime}>
                                                    {formatTime(userStatus.nextMatch.scheduledTime)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.waitingStatus}>
                                            <FaClock />
                                            <span>Waiting for next round...</span>
                                        </div>
                                    )}

                                    {tournament.status === 'upcoming' && (
                                        <NeonButton
                                            onClick={handleLeaveTournament}
                                            variant="secondary"
                                            size="small"
                                            className={styles.leaveButton}
                                        >
                                            Leave Tournament
                                        </NeonButton>
                                    )}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Tournament Rules */}
                    <Card className={styles.rulesCard}>
                        <div className={styles.cardHeader}>
                            <h3>Tournament Rules</h3>
                        </div>
                        <div className={styles.rulesList}>
                            <div className={styles.rule}>
                                <FaGamepad />
                                <span>Format: {tournament.format || 'Best of 1'}</span>
                            </div>
                            <div className={styles.rule}>
                                <FaClock />
                                <span>Time Control: {tournament.timeControl || '30s per move'}</span>
                            </div>
                            <div className={styles.rule}>
                                <FaTrophy />
                                <span>Type: {tournament.type || 'Single Elimination'}</span>
                            </div>
                            <div className={styles.rule}>
                                <FaStar />
                                <span>Entry: {tournament.entryFee || 'Free'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Leaderboard */}
                    {tournament.participants && tournament.participants.length > 0 && (
                        <Card className={styles.leaderboardCard}>
                            <div className={styles.cardHeader}>
                                <h3>Participants</h3>
                                <span className={styles.participantCount}>
                                    {tournament.participants.length}/{tournament.maxParticipants}
                                </span>
                            </div>
                            <div className={styles.participantsList}>
                                {tournament.participants
                                    .sort((a, b) => (b.elo || 1200) - (a.elo || 1200))
                                    .map((participant, index) => (
                                        <motion.div
                                            key={participant.id}
                                            className={styles.participantCard}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className={styles.participantRank}>
                                                {index < 3 ? (
                                                    <FaMedal className={styles[`rank${index + 1}`]} />
                                                ) : (
                                                    <span>#{index + 1}</span>
                                                )}
                                            </div>
                                            <div className={styles.participantAvatar}>
                                                {participant.avatar ? (
                                                    <img src={participant.avatar} alt={participant.name} />
                                                ) : (
                                                    <div className={styles.defaultAvatar}>
                                                        {participant.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.participantInfo}>
                                                <span className={styles.participantName}>
                                                    {participant.name}
                                                    {participant.id === auth.user?.id && (
                                                        <span className={styles.youIndicator}>(You)</span>
                                                    )}
                                                </span>
                                                <span className={styles.participantElo}>
                                                    ELO: {participant.elo || 1200}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Panel - Tournament Bracket */}
                <div className={styles.rightPanel}>
                    <Card className={styles.bracketCard}>
                        <div className={styles.cardHeader}>
                            <h3>Tournament Bracket</h3>
                            <div className={styles.bracketControls}>
                                <button
                                    onClick={() => setShowBracket(!showBracket)}
                                    className={`${styles.controlButton} ${showBracket ? styles.active : ''}`}
                                >
                                    Bracket
                                </button>
                                <button
                                    onClick={() => setShowStats(!showStats)}
                                    className={`${styles.controlButton} ${showStats ? styles.active : ''}`}
                                >
                                    <FaChartLine />
                                    Stats
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {showBracket ? (
                                <motion.div
                                    key="bracket"
                                    className={styles.bracketView}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {bracket && bracket.rounds ? (
                                        <div className={styles.bracketContainer}>
                                            {bracket.rounds.map((round, roundIndex) => (
                                                <div key={roundIndex} className={styles.bracketRound}>
                                                    <div className={styles.roundHeader}>
                                                        <h4>{round.name}</h4>
                                                        <span>{round.matches?.length || 0} matches</span>
                                                    </div>
                                                    <div className={styles.roundMatches}>
                                                        {round.matches?.map((match, matchIndex) => (
                                                            <motion.div
                                                                key={match.id}
                                                                className={`${styles.matchCard} ${styles[match.status]}`}
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: matchIndex * 0.1 }}
                                                                onClick={() => setSelectedMatch(match)}
                                                            >
                                                                <div className={styles.matchHeader}>
                                                                    <div className={styles.matchStatus}>
                                                                        {getMatchStatusIcon(match.status)}
                                                                    </div>
                                                                    <span className={styles.matchId}>
                                                                        Match {matchIndex + 1}
                                                                    </span>
                                                                </div>

                                                                <div className={styles.matchPlayers}>
                                                                    <div className={`${styles.player} ${match.winner?.id === match.player1?.id ? styles.winner : ''}`}>
                                                                        <div className={styles.playerAvatar}>
                                                                            {match.player1?.avatar ? (
                                                                                <img src={match.player1.avatar} alt={match.player1.name} />
                                                                            ) : (
                                                                                <div className={styles.defaultAvatar}>
                                                                                    {match.player1?.name?.[0] || '?'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className={styles.playerName}>
                                                                            {match.player1?.name || 'TBD'}
                                                                        </span>
                                                                        {match.score && (
                                                                            <span className={styles.playerScore}>
                                                                                {match.score.player1}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className={styles.vsIndicator}>VS</div>

                                                                    <div className={`${styles.player} ${match.winner?.id === match.player2?.id ? styles.winner : ''}`}>
                                                                        <div className={styles.playerAvatar}>
                                                                            {match.player2?.avatar ? (
                                                                                <img src={match.player2.avatar} alt={match.player2.name} />
                                                                            ) : (
                                                                                <div className={styles.defaultAvatar}>
                                                                                    {match.player2?.name?.[0] || '?'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className={styles.playerName}>
                                                                            {match.player2?.name || 'TBD'}
                                                                        </span>
                                                                        {match.score && (
                                                                            <span className={styles.playerScore}>
                                                                                {match.score.player2}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className={styles.matchActions}>
                                                                    {match.status === 'active' && (
                                                                        <>
                                                                            {(match.player1?.id === auth.user?.id ||
                                                                                match.player2?.id === auth.user?.id) ? (
                                                                                <GamingButton
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleStartMatch(match.id);
                                                                                    }}
                                                                                    variant="primary"
                                                                                    size="small"
                                                                                >
                                                                                    <FaPlay />
                                                                                    Play
                                                                                </GamingButton>
                                                                            ) : (
                                                                                <NeonButton
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleWatchMatch(match.id);
                                                                                    }}
                                                                                    variant="secondary"
                                                                                    size="small"
                                                                                >
                                                                                    <FaEye />
                                                                                    Watch
                                                                                </NeonButton>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    {match.status === 'completed' && (
                                                                        <div className={styles.matchResult}>
                                                                            <FaCrown />
                                                                            <span>{match.winner?.name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.noBracket}>
                                            <FaTrophy />
                                            <p>Tournament bracket will be generated when it starts</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="stats"
                                    className={styles.statsView}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {tournamentStats && (
                                        <div className={styles.tournamentStatsGrid}>
                                            <div className={styles.statCard}>
                                                <FaGamepad />
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>{tournamentStats.totalMatches}</span>
                                                    <span className={styles.statLabel}>Total Matches</span>
                                                </div>
                                            </div>

                                            <div className={styles.statCard}>
                                                <FaCheck />
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>{tournamentStats.completedMatches}</span>
                                                    <span className={styles.statLabel}>Completed</span>
                                                </div>
                                            </div>

                                            <div className={styles.statCard}>
                                                <FaPlay />
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>{tournamentStats.activeMatches}</span>
                                                    <span className={styles.statLabel}>Active</span>
                                                </div>
                                            </div>

                                            <div className={styles.statCard}>
                                                <FaClock />
                                                <div className={styles.statContent}>
                                                    <span className={styles.statValue}>{tournamentStats.upcomingMatches}</span>
                                                    <span className={styles.statLabel}>Upcoming</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </div>
            </div>

            {/* Match Detail Modal */}
            <AnimatePresence>
                {selectedMatch && (
                    <motion.div
                        className={styles.matchModal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMatch(null)}
                    >
                        <motion.div
                            className={styles.matchModalContent}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h3>Match Details</h3>
                                <button
                                    onClick={() => setSelectedMatch(null)}
                                    className={styles.closeButton}
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className={styles.modalContent}>
                                <div className={styles.matchDetailPlayers}>
                                    <div className={styles.detailPlayer}>
                                        <div className={styles.detailPlayerAvatar}>
                                            {selectedMatch.player1?.avatar ? (
                                                <img src={selectedMatch.player1.avatar} alt={selectedMatch.player1.name} />
                                            ) : (
                                                <div className={styles.defaultAvatar}>
                                                    {selectedMatch.player1?.name?.[0] || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.detailPlayerInfo}>
                                            <h4>{selectedMatch.player1?.name || 'TBD'}</h4>
                                            <p>ELO: {selectedMatch.player1?.elo || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className={styles.detailVs}>
                                        <span>VS</span>
                                        {selectedMatch.score && (
                                            <div className={styles.detailScore}>
                                                {selectedMatch.score.player1} - {selectedMatch.score.player2}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.detailPlayer}>
                                        <div className={styles.detailPlayerAvatar}>
                                            {selectedMatch.player2?.avatar ? (
                                                <img src={selectedMatch.player2.avatar} alt={selectedMatch.player2.name} />
                                            ) : (
                                                <div className={styles.defaultAvatar}>
                                                    {selectedMatch.player2?.name?.[0] || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.detailPlayerInfo}>
                                            <h4>{selectedMatch.player2?.name || 'TBD'}</h4>
                                            <p>ELO: {selectedMatch.player2?.elo || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.matchDetailInfo}>
                                    <div className={styles.detailItem}>
                                        <span>Status:</span>
                                        <span className={styles[selectedMatch.status]}>
                                            {selectedMatch.status?.toUpperCase()}
                                        </span>
                                    </div>

                                    {selectedMatch.scheduledTime && (
                                        <div className={styles.detailItem}>
                                            <span>Scheduled:</span>
                                            <span>{formatDate(selectedMatch.scheduledTime)}</span>
                                        </div>
                                    )}

                                    {selectedMatch.winner && (
                                        <div className={styles.detailItem}>
                                            <span>Winner:</span>
                                            <span className={styles.winner}>
                                                <FaCrown />
                                                {selectedMatch.winner.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.modalActions}>
                                    {selectedMatch.status === 'active' && (
                                        <>
                                            {(selectedMatch.player1?.id === auth.user?.id ||
                                                selectedMatch.player2?.id === auth.user?.id) ? (
                                                <GamingButton
                                                    onClick={() => {
                                                        handleStartMatch(selectedMatch.id);
                                                        setSelectedMatch(null);
                                                    }}
                                                    variant="primary"
                                                    size="large"
                                                >
                                                    <FaPlay />
                                                    Play Match
                                                </GamingButton>
                                            ) : (
                                                <NeonButton
                                                    onClick={() => {
                                                        handleWatchMatch(selectedMatch.id);
                                                        setSelectedMatch(null);
                                                    }}
                                                    variant="secondary"
                                                    size="large"
                                                >
                                                    <FaEye />
                                                    Watch Match
                                                </NeonButton>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GameTournament;