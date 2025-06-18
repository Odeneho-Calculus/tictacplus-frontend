import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import classNames from 'classnames';

// Import direct sound utilities
import { playGameOverSound, playWinSound, playLoseSound } from '../../utils/gameOverSound';

// Components
import Board from '../../components/core/Board/Board';
import SavedGameDialog from '../../components/game/SavedGameDialog';
import SpectatorPanel, { SpectatorToggle } from '../../components/game/SpectatorPanel/SpectatorPanel';
import GameTimer, { CompactTimer } from '../../components/game/GameTimer/GameTimer';
import ConnectionStatus, { CompactConnectionStatus } from '../../components/game/ConnectionStatus/ConnectionStatus';
import GameReconnection from '../../components/game/GameReconnection/GameReconnection';
import {
    LoadingSpinner,
    Card,
    GamingButton,
    NeonButton,
    DangerButton
} from '../../components/ui';

// Store
import {
    selectGame,
    selectCanMakeMove,
    selectIsOnlineGame,
    selectGameId,
    selectSpectators,
    makeMove,
    makeAIMove,
    makeOnlineMove,
    resetGame,
    forfeitGame,
    startNewGame,
    playAgain,
    saveGameState,
    checkSavedGame,
    restoreGameState,
    leaveOnlineGame,
    joinOnlineGame,
    addSpectator,
    removeSpectator,
} from '../../store/slices/gameSlice';
import { selectPlayer } from '../../store/slices/playerSlice';
import { selectAuth, selectIsAuthenticated } from '../../store/slices/authSlice';
import { setCurrentPage } from '../../store/slices/uiSlice';

// Utils
import { GAME_MODES, GAME_STATES, PLAYER_TYPES } from '../../utils/constants';

// Hooks
import { useSound } from '../../hooks/useSound';
import { useSocket } from '../../hooks/useSocket';

// Styles
import styles from './Game.module.scss';

const Game = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { gameId } = useParams();
    const { playSound, duckBackgroundMusic } = useSound();
    const { isConnected, emit } = useSocket();

    // Local state for saved game dialog
    const [showSavedGameDialog, setShowSavedGameDialog] = useState(false);
    const [savedGameState, setSavedGameState] = useState(null);

    // Local state for spectator panel
    const [showSpectatorPanel, setShowSpectatorPanel] = useState(false);

    // Local state for reconnection
    const [showReconnectionModal, setShowReconnectionModal] = useState(false);

    // Redux state
    const game = useSelector(selectGame);
    const player = useSelector(selectPlayer);
    const auth = useSelector(selectAuth);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const canMakeMove = useSelector(selectCanMakeMove);
    const isOnlineGame = useSelector(selectIsOnlineGame);
    const currentGameId = useSelector(selectGameId);
    const spectators = useSelector(selectSpectators);

    const {
        board,
        currentPlayer,
        mode,
        playerX,
        playerO,
        status,
        winner,
        winningLine,
        lastMove,
        isLoading,
        error,
        moveHistory,
        startTime,
        endTime,
        isThinking,
    } = game;

    useEffect(() => {
        dispatch(setCurrentPage('game'));
    }, [dispatch]);

    // Check for saved game state on component mount
    useEffect(() => {
        const checkForSavedGame = async () => {
            // Only check if we don't have an active game
            if (status === GAME_STATES.WAITING && !isLoading && player.id) {
                try {
                    const result = await dispatch(checkSavedGame()).unwrap();
                    if (result && result.hasSavedGame) {
                        setSavedGameState(result.gameState);
                        setShowSavedGameDialog(true);
                    }
                } catch (error) {
                    console.log('No saved game found or error checking:', error);
                }
            }
        };

        checkForSavedGame();
    }, [dispatch, status, isLoading, player.id]);

    // Handle online game disconnection
    useEffect(() => {
        if (isOnlineGame && !isConnected && status === GAME_STATES.PLAYING) {
            setShowReconnectionModal(true);
            console.log('Connection lost during online game');
        } else if (isConnected) {
            setShowReconnectionModal(false);
        }
    }, [isOnlineGame, isConnected, status]);

    // Handle joining a game from URL parameter or initialize AI game if no game is active
    useEffect(() => {
        if (status === GAME_STATES.WAITING && !isLoading) {
            const initializeGame = async () => {
                try {
                    // If we have a gameId in the URL, try to join that game
                    if (gameId) {
                        console.log('Attempting to join game from URL:', gameId);

                        // Check if user is authenticated for online games
                        if (!isAuthenticated) {
                            console.log('User not authenticated for online game');
                            dispatch({
                                type: 'ui/showWarning',
                                payload: 'You must be logged in to join online games. Redirecting to home page...'
                            });

                            // Redirect to home page after a short delay
                            setTimeout(() => {
                                navigate('/');
                            }, 2000);
                            return;
                        }

                        // Join the game using the gameId from URL
                        await dispatch(joinOnlineGame(gameId)).unwrap();

                        // Also emit a socket event to join the game room
                        if (isConnected) {
                            console.log('Emitting join_game event for:', gameId);
                            // Use the correct event name from the backend
                            emit('join_game', { gameId });
                        }

                        // Play a sound to alert the player they've joined a game
                        playSound('gameStart', { volume: 0.8 });
                    } else {
                        // Otherwise, initialize an AI game as default
                        const gameConfig = {
                            mode: GAME_MODES.AI,
                            difficulty: 'medium',
                            playerX: {
                                id: player.id,
                                name: player.name || 'Player',
                                displayName: player.displayName || player.name || 'Player',
                                type: PLAYER_TYPES.HUMAN,
                            },
                            playerO: {
                                id: 'ai',
                                name: 'AI Opponent',
                                displayName: 'AI Opponent',
                                type: PLAYER_TYPES.AI,
                            },
                        };
                        await dispatch(startNewGame(gameConfig)).unwrap();
                    }
                } catch (error) {
                    console.error('Failed to initialize game:', error);
                }
            };

            initializeGame();
        }
    }, [status, isLoading, dispatch, player, gameId, playSound, isConnected, emit]);

    // Play sound effects for game state changes with advanced features
    useEffect(() => {
        if (status === GAME_STATES.FINISHED && winner) {
            // Duck background music during important sounds
            duckBackgroundMusic(0.4, 3.0);

            // Always use game-over sound for any game end
            console.log('Game finished - playing game-over sound instead of win/lose');

            // Use a slight delay to ensure the sound plays
            setTimeout(() => {
                playGameOverSound(0.8);
            }, 300);

            // Check if current player is the winner
            const isCurrentPlayerWinner =
                (winner === 'X' && playerX?.id === player?.id) ||
                (winner === 'O' && playerO?.id === player?.id);

            // For AI games
            if (mode === GAME_MODES.AI) {
                // Check if player is X (human is usually X in AI games)
                const isPlayerX = playerX?.id === player?.id;

                // If player won (X won and player is X)
                if (winner === 'X' && isPlayerX) {
                    console.log('Player won as X against AI - playing win sound');
                    console.log('DEBUG: Forcing win sound with direct Web Audio API');

                    // Try with a slight delay and direct Web Audio API implementation
                    setTimeout(() => {
                        // Direct implementation of win sound using Web Audio API
                        try {
                            const ctx = new (window.AudioContext || window.webkitAudioContext)();

                            // Create oscillator for win sound (rising pitch)
                            const osc1 = ctx.createOscillator();
                            const osc2 = ctx.createOscillator();
                            const gainNode = ctx.createGain();

                            // Configure oscillators for a happy sound
                            osc1.type = 'sine';
                            osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
                            osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // A5

                            osc2.type = 'triangle';
                            osc2.frequency.setValueAtTime(554, ctx.currentTime); // C#5
                            osc2.frequency.exponentialRampToValueAtTime(1108, ctx.currentTime + 0.5); // C#6

                            // Configure volume envelope
                            gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

                            // Connect nodes
                            osc1.connect(gainNode);
                            osc2.connect(gainNode);
                            gainNode.connect(ctx.destination);

                            // Start and stop oscillators
                            osc1.start();
                            osc2.start();
                            osc1.stop(ctx.currentTime + 1.0);
                            osc2.stop(ctx.currentTime + 1.0);

                            console.log('Playing win sound with direct Web Audio API');
                        } catch (e) {
                            console.error('Direct Web Audio API failed:', e);
                            // Fall back to regular sound system
                            playSound('win', { volume: 1.0, force: true });
                        }
                    }, 300);
                }
                // If AI won (O won and player is X)
                else if (winner === 'O' && isPlayerX) {
                    console.log('AI won as O against player - using game-over sound');
                    // Game-over sound is already playing from above
                    // No need for additional sound here
                }
                // Edge case: if player is O and won
                else if (winner === 'O' && playerO?.id === player?.id) {
                    console.log('Player won as O against AI - using game-over sound');
                    // Game-over sound is already playing from above
                    // No need for additional sound here
                }
                // Edge case: if player is O and lost
                else if (winner === 'X' && playerO?.id === player?.id) {
                    console.log('AI won as X against player - using game-over sound');
                    // Game-over sound is already playing from above
                    // No need for additional sound here
                }
            } else {
                // For human vs human games
                if (isCurrentPlayerWinner) {
                    console.log('Player won in human vs human game - using game-over sound');
                    // Game-over sound is already playing from above
                    // No need for additional sound here
                } else {
                    console.log('Player lost in human vs human game - using game-over sound');
                    // Game-over sound is already playing from above
                    // No need for additional sound here
                }
            }
        } else if (status === GAME_STATES.FINISHED && !winner) {
            // Draw/tie
            duckBackgroundMusic(0.3, 2.0);
            console.log('Game draw - playing game-over sound');

            // Use a slight delay to ensure the sound plays
            setTimeout(() => {
                playGameOverSound(0.7); // Slightly lower volume for draw
            }, 300);
        }
    }, [status, winner, playerX?.id, playerO?.id, player?.id, mode, playSound, duckBackgroundMusic]);

    // Play move sound when board changes (after a move is made)
    useEffect(() => {
        if (lastMove && status === GAME_STATES.PLAYING) {
            // Vary pitch based on position for subtle audio feedback
            const position = lastMove.row * 3 + lastMove.col;
            const playbackRate = 0.9 + (position * 0.02); // Slight pitch variation
            playSound('move', {
                volume: 0.7,
                playbackRate: playbackRate
            });
        }
    }, [lastMove, status, playSound]);

    // Auto-save game state when moves are made
    useEffect(() => {
        if (status === GAME_STATES.PLAYING && moveHistory.length > 0) {
            // Debounce the save to avoid too many requests
            const saveTimeout = setTimeout(() => {
                dispatch(saveGameState());
            }, 1000);

            return () => clearTimeout(saveTimeout);
        }
    }, [dispatch, status, moveHistory.length]);

    // Play game start sound when game begins
    useEffect(() => {
        if (status === GAME_STATES.PLAYING && !lastMove) {
            // Duck background music briefly during game start
            duckBackgroundMusic(0.5, 1.5);
            setTimeout(() => {
                playSound('gameStart', { volume: 0.9 });
            }, 100);
        }
    }, [status, lastMove, playSound, duckBackgroundMusic]);

    // Handle starting a default game if none exists
    const handleStartDefaultGame = useCallback(async () => {
        try {
            const gameConfig = {
                mode: GAME_MODES.LOCAL,
                playerX: {
                    id: player.id,
                    name: player.name,
                    type: 'human',
                },
                playerO: {
                    id: 'player2',
                    name: 'Player 2',
                    type: 'human',
                },
            };
            await dispatch(startNewGame(gameConfig)).unwrap();
        } catch (error) {
            console.error('Failed to start default game:', error);
        }
    }, [dispatch, player]);

    // Handle game end
    useEffect(() => {
        if (status === GAME_STATES.FINISHED && winner) {
            const isPlayerWin = (winner === 'X' && playerX.id === player.id) ||
                (winner === 'O' && playerO.id === player.id);

            // Use a slight delay to ensure the sound plays
            setTimeout(() => {
                playGameOverSound(0.8);
            }, 300);
        }
    }, [status, winner, playerX.id, playerO.id, player.id, playSound]);

    // Handle forfeit
    const handleForfeit = useCallback(() => {
        if (window.confirm('Are you sure you want to forfeit this game?')) {
            dispatch(forfeitGame());
            playSound('error');
        }
    }, [dispatch, playSound]);

    // Handle new game
    const handleNewGame = useCallback(() => {
        try {
            // Use the playAgain action which preserves configuration and resets game state
            dispatch(playAgain());
            playSound('gameStart', { volume: 0.8 });
        } catch (error) {
            console.error('Failed to start new game:', error);
            // Fallback to home if play again fails
            navigate('/');
        }
    }, [dispatch, navigate, playSound]);

    // Handle leaving online game
    const handleLeaveOnlineGame = useCallback(async () => {
        if (isOnlineGame) {
            const confirmMessage = status === GAME_STATES.PLAYING
                ? 'Are you sure you want to leave this online game? This will count as a forfeit.'
                : 'Are you sure you want to leave this game?';

            if (window.confirm(confirmMessage)) {
                try {
                    await dispatch(leaveOnlineGame()).unwrap();
                    navigate('/');
                } catch (error) {
                    console.error('Failed to leave online game:', error);
                    // Force navigation even if leave fails
                    navigate('/');
                }
            }
        } else {
            navigate('/');
        }
    }, [dispatch, navigate, isOnlineGame, status]);

    // Handle online game forfeit
    const handleOnlineForfeit = useCallback(async () => {
        if (window.confirm('Are you sure you want to forfeit this online game?')) {
            try {
                if (isOnlineGame) {
                    await dispatch(leaveOnlineGame()).unwrap();
                } else {
                    dispatch(forfeitGame());
                }
                playSound('error');
            } catch (error) {
                console.error('Failed to forfeit game:', error);
            }
        }
    }, [dispatch, playSound, isOnlineGame]);

    // Get current user info
    const getCurrentUser = useCallback(() => {
        return isAuthenticated ? auth.user : player;
    }, [isAuthenticated, auth.user, player]);

    // Check if current user can make a move
    const canCurrentUserMove = useCallback(() => {
        if (!canMakeMove || status !== GAME_STATES.PLAYING) return false;

        const currentUser = getCurrentUser();
        const currentPlayerId = currentPlayer === 'X' ? playerX.id : playerO.id;

        return currentUser.id === currentPlayerId;
    }, [canMakeMove, status, getCurrentUser, currentPlayer, playerX.id, playerO.id]);

    // Animation variants
    const containerVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1,
            }
        },
        exit: { opacity: 0 }
    };

    const itemVariants = {
        initial: { y: 20, opacity: 0 },
        animate: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="large" text="Loading game..." />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Card
                className={styles.errorContainer}
                variant="danger"
                glassMorphism
                elevation="high"
            >
                <h2 className={styles.errorTitle}>Game Error</h2>
                <p className={styles.errorMessage}>{error}</p>
                <NeonButton
                    onClick={handleNewGame}
                    glowEffect
                >
                    Back to Home
                </NeonButton>
            </Card>
        );
    }

    // No game state or waiting state
    if (!board || status === GAME_STATES.WAITING) {
        return (
            <Card
                className={styles.noGameContainer}
                variant="feature"
                glassMorphism
                elevation="high"
            >
                <h2 className={styles.noGameTitle}>No Active Game</h2>
                <p className={styles.noGameMessage}>Please start a new game to continue playing.</p>
                <div className={styles.buttonGroup}>
                    <GamingButton
                        onClick={handleStartDefaultGame}
                        glowEffect
                    >
                        Start Local Game
                    </GamingButton>
                    <NeonButton
                        onClick={handleNewGame}
                    >
                        Go to Home
                    </NeonButton>
                </div>
            </Card>
        );
    }

    // Get current player info
    const getCurrentPlayerInfo = () => {
        return currentPlayer === 'X' ? playerX : playerO;
    };

    const currentPlayerInfo = getCurrentPlayerInfo();
    const isPlayerTurn = currentPlayerInfo.id === player.id;

    // Get game status text with enhanced name handling
    const getStatusText = () => {
        if (status === GAME_STATES.FINISHED) {
            if (winner) {
                const winnerInfo = winner === 'X' ? playerX : playerO;
                // Use displayName if available, fallback to name
                const displayName = winnerInfo.displayName || winnerInfo.name || 'Player';
                return `${displayName} wins!`;
            }
            return "It's a draw!";
        }

        if (isThinking) {
            return 'AI is thinking...';
        }

        if (mode === GAME_MODES.ONLINE && !isConnected) {
            return 'Disconnected from server';
        }

        // Use displayName if available, fallback to name with proper null/undefined handling
        const displayName = currentPlayerInfo.displayName || currentPlayerInfo.name || 'Player';
        return `${displayName}'s turn`;
    };

    return (
        <>
            <Helmet>
                <title>TicTac+ | Game in Progress</title>
                <meta name="description" content="TicTac+ game in progress" />
            </Helmet>

            <motion.div
                className={styles.game}
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                {/* Game Header */}
                <motion.header className={styles.header} variants={itemVariants}>
                    <div className={styles.playerInfo}>
                        <div className={classNames(styles.player, {
                            [styles.active]: currentPlayer === 'X',
                            [styles.winner]: winner === 'X',
                            [styles.online]: isOnlineGame,
                            [styles.currentUser]: isOnlineGame && getCurrentUser().id === playerX.id
                        })}>
                            <div className={styles.playerSymbol}>X</div>
                            <div className={styles.playerDetails}>
                                <div className={styles.playerName}>
                                    {playerX.name}
                                    {isOnlineGame && getCurrentUser().id === playerX.id && (
                                        <span className={styles.youIndicator}>(You)</span>
                                    )}
                                </div>
                                <div className={styles.playerType}>
                                    {isOnlineGame ? (
                                        <div className={styles.onlinePlayerInfo}>
                                            <span className={styles.playerElo}>
                                                ELO: {playerX.elo || 1200}
                                            </span>
                                            <span className={classNames(styles.connectionStatus, {
                                                [styles.connected]: playerX.isConnected !== false,
                                                [styles.disconnected]: playerX.isConnected === false
                                            })}>
                                                {playerX.isConnected !== false ? '🟢' : '🔴'}
                                            </span>
                                        </div>
                                    ) : (
                                        playerX.type
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.vs}>
                            {isOnlineGame ? (
                                <div className={styles.onlineVs}>
                                    <span className={styles.vsText}>VS</span>
                                    {isConnected ? (
                                        <span className={styles.connectionIndicator}>🌐</span>
                                    ) : (
                                        <span className={styles.connectionIndicator}>⚠️</span>
                                    )}
                                </div>
                            ) : (
                                'VS'
                            )}
                        </div>

                        <div className={classNames(styles.player, {
                            [styles.active]: currentPlayer === 'O',
                            [styles.winner]: winner === 'O',
                            [styles.online]: isOnlineGame,
                            [styles.currentUser]: isOnlineGame && getCurrentUser().id === playerO.id
                        })}>
                            <div className={styles.playerSymbol}>O</div>
                            <div className={styles.playerDetails}>
                                <div className={styles.playerName}>
                                    {playerO.name}
                                    {isOnlineGame && getCurrentUser().id === playerO.id && (
                                        <span className={styles.youIndicator}>(You)</span>
                                    )}
                                </div>
                                <div className={styles.playerType}>
                                    {isOnlineGame ? (
                                        <div className={styles.onlinePlayerInfo}>
                                            <span className={styles.playerElo}>
                                                ELO: {playerO.elo || 1200}
                                            </span>
                                            <span className={classNames(styles.connectionStatus, {
                                                [styles.connected]: playerO.isConnected !== false,
                                                [styles.disconnected]: playerO.isConnected === false
                                            })}>
                                                {playerO.isConnected !== false ? '🟢' : '🔴'}
                                            </span>
                                        </div>
                                    ) : (
                                        playerO.type
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.gameInfo}>
                        <div className={styles.gameMode}>
                            {mode.toUpperCase()}
                            {isOnlineGame && (
                                <span className={styles.onlineBadge}>LIVE</span>
                            )}
                        </div>
                        <div className={styles.gameDetails}>
                            <span className={styles.moveCount}>Move {moveHistory.length}</span>
                            {isOnlineGame && currentGameId && (
                                <span className={styles.gameId}>ID: {currentGameId.slice(-6)}</span>
                            )}
                            {isOnlineGame && spectators && spectators.length > 0 && (
                                <span className={styles.spectatorCount}>
                                    👁️ {spectators.length} watching
                                </span>
                            )}
                            {isOnlineGame && game.timeLimit && (
                                <CompactTimer
                                    timeLimit={game.timeLimit}
                                    warningTime={Math.floor(game.timeLimit * 0.3)}
                                    criticalTime={Math.floor(game.timeLimit * 0.15)}
                                />
                            )}
                        </div>
                    </div>
                </motion.header>

                {/* Game Status */}
                <motion.div className={styles.status} variants={itemVariants}>
                    <div className={classNames(styles.statusText, {
                        [styles.thinking]: isThinking,
                        [styles.finished]: status === GAME_STATES.FINISHED,
                    })}>
                        {getStatusText()}
                    </div>

                    {status === GAME_STATES.PLAYING && isPlayerTurn && (
                        <div className={styles.turnIndicator}>
                            Your turn!
                        </div>
                    )}
                </motion.div>

                {/* Game Board */}
                <div className={styles.boardContainer}>
                    <Board
                        disabled={!canMakeMove || status !== GAME_STATES.PLAYING}
                        showCoordinates={true}
                    />
                </div>

                {/* Game Timer for Online Games */}
                {isOnlineGame && game.timeLimit && status === GAME_STATES.PLAYING && (
                    <motion.div
                        className={styles.timerContainer}
                        variants={itemVariants}
                    >
                        <GameTimer
                            timeLimit={game.timeLimit}
                            warningTime={Math.floor(game.timeLimit * 0.3)}
                            criticalTime={Math.floor(game.timeLimit * 0.15)}
                            onTimeUp={() => {
                                // Handle time up - forfeit the game
                                handleOnlineForfeit();
                            }}
                        />
                    </motion.div>
                )}

                {/* Game Results */}
                {status === GAME_STATES.FINISHED && (
                    <motion.div
                        className={styles.gameResults}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={styles.resultHeader}>
                            <h2 className={styles.resultTitle}>
                                {winner ? `${winner === 'X' ? playerX.name : playerO.name} Wins!` : "It's a Draw!"}
                            </h2>
                            <div className={styles.resultSubtitle}>
                                {winner ? 'Victory Achieved!' : 'Honorable Draw!'}
                            </div>
                        </div>

                        <div className={styles.gameStats}>
                            <div className={styles.statsGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Total Moves</span>
                                    <span className={styles.statValue}>{moveHistory.length}</span>
                                </div>

                                {startTime && endTime && (
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Duration</span>
                                        <span className={styles.statValue}>
                                            {Math.round((endTime - startTime) / 1000)}s
                                        </span>
                                    </div>
                                )}

                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Game Mode</span>
                                    <span className={styles.statValue}>{mode.toUpperCase()}</span>
                                </div>

                                {winner && (
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Winner</span>
                                        <span className={styles.statValue}>{winner}</span>
                                    </div>
                                )}
                            </div>

                            {/* Achievements Section */}
                            {(moveHistory.length <= 5 || (startTime && endTime && (endTime - startTime) < 30000)) && (
                                <div className={styles.achievements}>
                                    <div className={styles.achievementTitle}>Achievements Unlocked</div>
                                    <div className={styles.achievementsList}>
                                        {moveHistory.length <= 5 && (
                                            <div className={styles.achievement}>
                                                <span>⚡</span>
                                                <span>Quick Victory</span>
                                            </div>
                                        )}
                                        {startTime && endTime && (endTime - startTime) < 30000 && (
                                            <div className={styles.achievement}>
                                                <span>🏃</span>
                                                <span>Speed Demon</span>
                                            </div>
                                        )}
                                        {winner && winningLine && (
                                            <div className={styles.achievement}>
                                                <span>🎯</span>
                                                <span>Perfect Line</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.resultActions}>
                            <GamingButton
                                onClick={() => {
                                    playSound('buttonClick');
                                    handleNewGame();
                                }}
                                onMouseEnter={() => playSound('buttonHover')}
                                glowEffect
                            >
                                Play Again
                            </GamingButton>

                            <NeonButton
                                onClick={() => {
                                    playSound('buttonClick');
                                    navigate('/');
                                }}
                                onMouseEnter={() => playSound('buttonHover')}
                            >
                                Home
                            </NeonButton>


                        </div>
                    </motion.div>
                )}

                {/* Game Controls */}
                <motion.div className={styles.controls} variants={itemVariants}>
                    {status === GAME_STATES.PLAYING && (
                        <DangerButton
                            onClick={() => {
                                playSound('buttonClick');
                                isOnlineGame ? handleOnlineForfeit() : handleForfeit();
                            }}
                            onMouseEnter={() => playSound('buttonHover')}
                            glowEffect
                        >
                            {isOnlineGame ? 'Leave Game' : 'Forfeit'}
                        </DangerButton>
                    )}

                    {status === GAME_STATES.FINISHED && !isOnlineGame && (
                        <GamingButton
                            onClick={() => {
                                playSound('buttonClick');
                                handleNewGame();
                            }}
                            onMouseEnter={() => playSound('buttonHover')}
                            glowEffect
                        >
                            New Game
                        </GamingButton>
                    )}

                    {status === GAME_STATES.FINISHED && isOnlineGame && (
                        <GamingButton
                            onClick={() => {
                                playSound('buttonClick');
                                navigate('/');
                            }}
                            onMouseEnter={() => playSound('buttonHover')}
                            glowEffect
                        >
                            Find New Match
                        </GamingButton>
                    )}

                    <button
                        className={styles.controlButton}
                        onClick={() => {
                            playSound('buttonClick');
                            isOnlineGame ? handleLeaveOnlineGame() : navigate('/');
                        }}
                        onMouseEnter={() => playSound('buttonHover')}
                    >
                        {isOnlineGame ? 'Leave' : 'Home'}
                    </button>
                </motion.div>

                {/* Move History */}
                {moveHistory.length > 0 && (
                    <motion.div className={styles.moveHistory} variants={itemVariants}>
                        <h3>Move History</h3>
                        <div className={styles.moves}>
                            {moveHistory.map((move, index) => (
                                <div key={index} className={styles.move}>
                                    <span className={styles.moveNumber}>{index + 1}.</span>
                                    <span className={styles.movePlayer}>{move.player}</span>
                                    <span className={styles.movePosition}>
                                        {Math.floor(move.position / 3) + 1}
                                        {String.fromCharCode(65 + (move.position % 3))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Saved Game Dialog */}
            <SavedGameDialog
                isOpen={showSavedGameDialog}
                onClose={() => setShowSavedGameDialog(false)}
                savedGameState={savedGameState}
            />

            {/* Spectator Panel for Online Games */}
            <SpectatorPanel
                isVisible={showSpectatorPanel}
                onToggle={() => setShowSpectatorPanel(!showSpectatorPanel)}
            />

            {/* Spectator Toggle Button */}
            <SpectatorToggle
                isVisible={showSpectatorPanel}
                onToggle={() => setShowSpectatorPanel(!showSpectatorPanel)}
                spectatorCount={spectators?.length || 0}
            />

            {/* Connection Status for Online Games */}
            <ConnectionStatus
                position="top-left"
                showDetails={false}
                autoHide={true}
            />

            {/* Game Reconnection Modal */}
            <GameReconnection
                isVisible={showReconnectionModal}
                onReconnect={() => {
                    setShowReconnectionModal(false);
                    playSound('success');
                }}
                onLeave={() => {
                    setShowReconnectionModal(false);
                    navigate('/');
                }}
                maxReconnectAttempts={5}
                reconnectTimeout={30000}
            />
        </>
    );
};

export default Game;