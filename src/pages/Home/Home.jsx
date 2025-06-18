import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// Components
import Board from '../../components/core/Board/Board';
import { LoadingSpinner, GameCard, FeatureCard, StatsCard, GamingButton, NeonButton } from '../../components/ui';
import AuthModal from '../../components/auth/AuthModal/AuthModal';

// Store
import { startNewGame, selectGame, createOnlineGame, findMatch, cancelMatchmaking } from '../../store/slices/gameSlice';
import { selectPlayer } from '../../store/slices/playerSlice';
import { selectAuth, selectIsAuthenticated } from '../../store/slices/authSlice';
import { setCurrentPage } from '../../store/slices/uiSlice';

// Utils
import { GAME_MODES } from '../../utils/constants';

// Hooks
import { useSound } from '../../hooks/useSound';

// Styles
import styles from './Home.module.scss';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound } = useSound();

  // Redux state
  const game = useSelector(selectGame);
  const player = useSelector(selectPlayer);
  const auth = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Local state
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('guest');

  useEffect(() => {
    dispatch(setCurrentPage('home'));
  }, [dispatch]);

  // Check for pending game redirect
  useEffect(() => {
    const pendingGameId = localStorage.getItem('pendingGameRedirect');
    if (pendingGameId) {
      console.log('Found pending game redirect:', pendingGameId);
      // Clear the pending redirect
      localStorage.removeItem('pendingGameRedirect');
      // Navigate to the game
      navigate(`/game/${pendingGameId}`);
    }
  }, [navigate]);

  // Listen for match found redirect action
  useEffect(() => {
    const handleMatchFoundRedirect = (e) => {
      if (e && e.detail && e.detail.type === 'game/matchFoundRedirect') {
        const gameId = e.detail.payload;
        console.log('Received match found redirect event:', gameId);

        // Use direct navigation for more reliability
        window.location.href = `/game/${gameId}`;
      }
    };

    // Use a custom event listener to handle the action
    window.addEventListener('game/matchFoundRedirect', handleMatchFoundRedirect);

    return () => {
      window.removeEventListener('game/matchFoundRedirect', handleMatchFoundRedirect);
    };
  }, []);

  // Handle game mode selection
  const handleGameModeSelect = async (mode) => {
    try {
      playSound('buttonClick');

      // Require authentication for all game modes
      if (!isAuthenticated) {
        // Show a message about authentication requirement
        dispatch({
          type: 'ui/showWarning',
          payload: 'Authentication required. Please sign in or register to play.'
        });

        // Redirect to login page
        navigate('/login', { state: { from: location } });
        return;
      }

      // For online games
      if (mode === GAME_MODES.ONLINE) {
        // Navigate to the dedicated matchmaking page
        navigate('/matchmaking');
        return;
      }

      // For local and AI games
      const currentPlayer = auth.user;
      const gameConfig = {
        mode,
        playerX: {
          id: currentPlayer.id,
          name: currentPlayer.displayName,
          type: 'human',
        },
        playerO: {
          id: mode === GAME_MODES.AI ? 'ai' : 'player2',
          name: mode === GAME_MODES.AI ? 'AI' : 'Player 2',
          type: mode === GAME_MODES.AI ? 'ai' : 'human',
        },
      };

      await dispatch(startNewGame(gameConfig)).unwrap();
      navigate('/game');
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // Handle quick play button
  const handleQuickPlay = () => {
    if (!isAuthenticated) {
      // Redirect to login page
      navigate('/login', { state: { from: location } });
    } else {
      handleGameModeSelect(GAME_MODES.AI);
    }
  };

  // Handle online game creation
  const handleCreateOnlineGame = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      playSound('buttonClick');
      await dispatch(createOnlineGame({
        gameMode: 'pvp',
        difficulty: 'medium',
        timeLimit: 30,
        allowSpectators: true
      })).unwrap();

      navigate('/game');
    } catch (error) {
      console.error('Failed to create online game:', error);
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(0, 212, 255, 0.3)",
        "0 0 30px rgba(0, 212, 255, 0.5)",
        "0 0 20px rgba(0, 212, 255, 0.3)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  if (game.isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Starting game..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>TicTac+ | Advanced AAA-Style Tic Tac Toe Game</title>
        <meta name="description" content="Experience the ultimate Tic Tac Toe game with stunning animations, real-time multiplayer, and advanced AI opponents." />
      </Helmet>

      <motion.div
        className={styles.home}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Hero Section */}
        <motion.section className={styles.hero} variants={itemVariants}>
          <motion.h1
            className={styles.title}
            data-text="TicTac+"
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              y: { duration: 0.8, ease: "easeOut" },
              opacity: { duration: 1 }
            }}
          >
            <motion.span
              className={styles.titleMain}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              TicTac
            </motion.span>
            <motion.span
              className={styles.titleAccent}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.6,
                type: "spring",
                stiffness: 300
              }}
            >
              +
            </motion.span>
          </motion.h1>

          <motion.p
            className={styles.subtitle}
            variants={itemVariants}
            animate={{
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            The ultimate AAA-style Tic Tac Toe experience
          </motion.p>

          <motion.p className={styles.description} variants={itemVariants}>
            Challenge advanced AI, play with friends online, or enjoy local multiplayer
            with stunning animations and immersive sound effects.
          </motion.p>

          <motion.div
            className={styles.heroButtons}
            variants={itemVariants}
          >
            <GamingButton
              onClick={handleQuickPlay}
              icon="🎮"
              size="large"
              glowEffect
              className={styles.playNowButton}
            >
              PLAY NOW
            </GamingButton>

            <GamingButton
              onClick={() => navigate('/matchmaking')}
              icon="🔍"
              size="large"
              variant="secondary"
              className={styles.matchmakingButton}
            >
              MATCHMAKING
            </GamingButton>
          </motion.div>
        </motion.section>

        {/* Game Modes */}
        <motion.section className={styles.gameModes} variants={itemVariants}>
          <motion.h2
            className={styles.sectionTitle}
            variants={itemVariants}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Choose Your Game Mode
          </motion.h2>

          <div className={styles.modeGrid}>
            <GameCard
              onClick={() => handleGameModeSelect(GAME_MODES.AI)}
              onHover={() => playSound('buttonHover')}
            >
              <div className={styles.modeIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6" />
                  <path d="m21 12-6-3-6 3-6-3" />
                </svg>
              </div>
              <h3 className={styles.modeTitle}>vs AI</h3>
              <p className={styles.modeDescription}>
                Challenge our advanced AI with multiple difficulty levels
              </p>
              <div className={styles.modeAction}>
                <NeonButton size="small">Select</NeonButton>
              </div>
            </GameCard>

            <GameCard
              onClick={() => handleGameModeSelect(GAME_MODES.LOCAL)}
              onHover={() => playSound('buttonHover')}
            >
              <div className={styles.modeIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={styles.modeTitle}>Local Play</h3>
              <p className={styles.modeDescription}>
                Play with a friend on the same device
              </p>
              <div className={styles.modeAction}>
                <NeonButton size="small">Select</NeonButton>
              </div>
            </GameCard>

            <GameCard
              onClick={() => handleGameModeSelect(GAME_MODES.ONLINE)}
              onHover={() => playSound('buttonHover')}
            >
              <div className={styles.modeIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className={styles.modeTitle}>Online</h3>
              <p className={styles.modeDescription}>
                Play with friends around the world
              </p>
              <div className={styles.modeAction}>
                <NeonButton size="small">Select</NeonButton>
              </div>
            </GameCard>
          </div>
        </motion.section>

        {/* Demo Board */}
        <motion.section className={styles.demoSection} variants={itemVariants}>
          <motion.h2
            className={styles.sectionTitle}
            variants={itemVariants}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Preview
          </motion.h2>

          <motion.div
            className={styles.demoBoard}
            variants={floatingVariants}
            animate="animate"
          >
            <Board
              disabled={true}
              showCoordinates={false}
            />
          </motion.div>
        </motion.section>

        {/* Features */}
        <motion.section className={styles.features} variants={itemVariants}>
          <motion.h2
            className={styles.sectionTitle}
            variants={itemVariants}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Features
          </motion.h2>

          <div className={styles.featureGrid}>
            <FeatureCard variants={itemVariants}>
              <motion.div
                className={styles.featureIcon}
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                🎨
              </motion.div>
              <h3>Stunning Visuals</h3>
              <p>Beautiful animations and particle effects</p>
            </FeatureCard>

            <FeatureCard variants={itemVariants}>
              <motion.div
                className={styles.featureIcon}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                🔊
              </motion.div>
              <h3>Immersive Audio</h3>
              <p>High-quality sound effects and music</p>
            </FeatureCard>

            <FeatureCard variants={itemVariants}>
              <motion.div
                className={styles.featureIcon}
                animate={{
                  rotate: [0, 0, 0, 0, 0, 0, 10, -10, 0],
                  y: [0, 0, 0, 0, 0, 0, -5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                🤖
              </motion.div>
              <h3>Smart AI</h3>
              <p>Advanced AI with multiple difficulty levels</p>
            </FeatureCard>

            <FeatureCard variants={itemVariants}>
              <motion.div
                className={styles.featureIcon}
                animate={{
                  rotateY: [0, 180, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                📱
              </motion.div>
              <h3>Responsive</h3>
              <p>Perfect on desktop, tablet, and mobile</p>
            </FeatureCard>
          </div>
        </motion.section>

        {/* Player Stats */}
        {player.totalGames > 0 && (
          <motion.section className={styles.stats} variants={itemVariants}>
            <motion.h2
              className={styles.sectionTitle}
              variants={itemVariants}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              Your Stats
            </motion.h2>

            <div className={styles.statsGrid}>
              <StatsCard variants={itemVariants}>
                <motion.div
                  className={styles.statValue}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {player.totalGames}
                </motion.div>
                <div className={styles.statLabel}>Games Played</div>
              </StatsCard>

              <StatsCard variants={itemVariants}>
                <motion.div
                  className={styles.statValue}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    delay: 0.3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {player.gamesWon}
                </motion.div>
                <div className={styles.statLabel}>Wins</div>
              </StatsCard>

              <StatsCard variants={itemVariants}>
                <motion.div
                  className={styles.statValue}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    delay: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {player.totalGames > 0
                    ? Math.round((player.gamesWon / player.totalGames) * 100)
                    : 0}%
                </motion.div>
                <div className={styles.statLabel}>Win Rate</div>
              </StatsCard>

              <StatsCard variants={itemVariants}>
                <motion.div
                  className={styles.statValue}
                  animate={{
                    scale: [1, 1.1, 1],
                    textShadow: [
                      "0 0 10px rgba(0, 212, 255, 0.5)",
                      "0 0 20px rgba(0, 212, 255, 0.8)",
                      "0 0 10px rgba(0, 212, 255, 0.5)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.9,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {player.level}
                </motion.div>
                <div className={styles.statLabel}>Level</div>
              </StatsCard>
            </div>
          </motion.section>
        )}

        {/* Call to Action */}
        <motion.section
          className={styles.ctaSection}
          variants={itemVariants}
        >
          <motion.div
            className={styles.ctaCard}
            variants={glowVariants}
            animate="animate"
          >
            <h2 className={styles.ctaTitle}>Ready to Play?</h2>
            <p className={styles.ctaDescription}>
              Jump into a game now and experience the most advanced Tic Tac Toe game ever created!
            </p>
            <div className={styles.ctaButtons}>
              <GamingButton
                onClick={() => handleGameModeSelect(GAME_MODES.AI)}
                size="large"
                glowEffect
                holographic
              >
                Play vs AI
              </GamingButton>
              <GamingButton
                onClick={() => handleGameModeSelect(GAME_MODES.LOCAL)}
                size="large"
                variant="secondary"
              >
                Local Multiplayer
              </GamingButton>
            </div>
          </motion.div>
        </motion.section>
      </motion.div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </>
  );
};

export default Home;