import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaSearch, FaClock, FaTimes, FaPlay, FaEye } from 'react-icons/fa';

// Store
import {
  findMatch,
  cancelMatchmaking,
  createOnlineGame,
  joinOnlineGame,
  getActiveGames,
  selectIsMatchmaking,
  selectActiveGames,
  selectGameLoading,
  selectGameError
} from '../../../store/slices/gameSlice';
import { selectAuth } from '../../../store/slices/authSlice';

// Components
import { GamingButton, NeonButton, LoadingSpinner } from '../../ui';

// Styles
import styles from './OnlineGameLobby.module.scss';

const OnlineGameLobby = ({ onClose, onGameStart }) => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const isMatchmaking = useSelector(selectIsMatchmaking);
  const activeGames = useSelector(selectActiveGames);
  const isLoading = useSelector(selectGameLoading);
  const error = useSelector(selectGameError);

  const [activeTab, setActiveTab] = useState('quickMatch'); // 'quickMatch', 'createGame', 'joinGame'
  const [gameSettings, setGameSettings] = useState({
    difficulty: 'medium',
    timeLimit: 30,
    allowSpectators: true,
    isRanked: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [matchmakingTime, setMatchmakingTime] = useState(0);

  // Matchmaking timer
  useEffect(() => {
    let interval;
    if (isMatchmaking) {
      interval = setInterval(() => {
        setMatchmakingTime(prev => prev + 1);
      }, 1000);
    } else {
      setMatchmakingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMatchmaking]);

  // Load active games when component mounts
  useEffect(() => {
    dispatch(getActiveGames());
  }, [dispatch]);

  // Auto-refresh active games
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'joinGame') {
        dispatch(getActiveGames());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch, activeTab]);

  const handleQuickMatch = async () => {
    try {
      await dispatch(findMatch({
        gameMode: 'pvp',
        difficulty: gameSettings.difficulty,
        timeLimit: gameSettings.timeLimit,
        isRanked: gameSettings.isRanked
      })).unwrap();

      if (onGameStart) onGameStart();
    } catch (error) {
      console.error('Failed to find match:', error);
    }
  };

  const handleCancelMatchmaking = () => {
    dispatch(cancelMatchmaking());
  };

  const handleCreateGame = async () => {
    try {
      await dispatch(createOnlineGame({
        gameMode: 'pvp',
        difficulty: gameSettings.difficulty,
        timeLimit: gameSettings.timeLimit,
        allowSpectators: gameSettings.allowSpectators,
        isRanked: gameSettings.isRanked
      })).unwrap();

      if (onGameStart) onGameStart();
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      await dispatch(joinOnlineGame(gameId)).unwrap();
      if (onGameStart) onGameStart();
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredGames = activeGames.filter(game =>
    game.playerX?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.playerO?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className={styles.lobby}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FaUsers className={styles.icon} />
          Online Multiplayer
        </h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>

      {error && (
        <motion.div
          className={styles.error}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'quickMatch' ? styles.active : ''}`}
          onClick={() => setActiveTab('quickMatch')}
        >
          Quick Match
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'createGame' ? styles.active : ''}`}
          onClick={() => setActiveTab('createGame')}
        >
          Create Game
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'joinGame' ? styles.active : ''}`}
          onClick={() => setActiveTab('joinGame')}
        >
          Join Game
        </button>
      </div>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === 'quickMatch' && (
            <motion.div
              key="quickMatch"
              className={styles.tabContent}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.quickMatchContent}>
                <div className={styles.playerInfo}>
                  <div className={styles.playerCard}>
                    <div className={styles.playerAvatar}>
                      {auth.user?.avatar ? (
                        <img src={auth.user.avatar} alt="Your avatar" />
                      ) : (
                        <div className={styles.defaultAvatar}>
                          {auth.user?.displayName?.[0] || auth.user?.username?.[0] || 'P'}
                        </div>
                      )}
                    </div>
                    <div className={styles.playerDetails}>
                      <h3>{auth.user?.displayName || auth.user?.username}</h3>
                      <p>ELO: {auth.user?.stats?.elo || 1200}</p>
                      <p>Level: {auth.user?.stats?.level || 1}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.gameSettings}>
                  <h4>Match Settings</h4>

                  <div className={styles.setting}>
                    <label>Difficulty</label>
                    <select
                      value={gameSettings.difficulty}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                      className={styles.select}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className={styles.setting}>
                    <label>Time Limit (seconds)</label>
                    <select
                      value={gameSettings.timeLimit}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                      className={styles.select}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={0}>No limit</option>
                    </select>
                  </div>

                  <div className={styles.setting}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={gameSettings.isRanked}
                        onChange={(e) => setGameSettings(prev => ({ ...prev, isRanked: e.target.checked }))}
                        className={styles.checkbox}
                      />
                      Ranked Match
                    </label>
                  </div>
                </div>

                {isMatchmaking ? (
                  <div className={styles.matchmaking}>
                    <div className={styles.matchmakingSpinner}>
                      <LoadingSpinner size="large" />
                    </div>
                    <h3>Finding opponent...</h3>
                    <p>Time elapsed: {formatTime(matchmakingTime)}</p>
                    <GamingButton
                      onClick={handleCancelMatchmaking}
                      variant="secondary"
                      size="medium"
                    >
                      Cancel
                    </GamingButton>
                  </div>
                ) : (
                  <div className={styles.actions}>
                    <GamingButton
                      onClick={handleQuickMatch}
                      size="large"
                      glowEffect
                      disabled={isLoading}
                    >
                      <FaSearch className={styles.buttonIcon} />
                      Find Match
                    </GamingButton>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'createGame' && (
            <motion.div
              key="createGame"
              className={styles.tabContent}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.createGameContent}>
                <h4>Game Settings</h4>

                <div className={styles.settingsGrid}>
                  <div className={styles.setting}>
                    <label>Difficulty</label>
                    <select
                      value={gameSettings.difficulty}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                      className={styles.select}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className={styles.setting}>
                    <label>Time Limit</label>
                    <select
                      value={gameSettings.timeLimit}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                      className={styles.select}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={0}>No limit</option>
                    </select>
                  </div>

                  <div className={styles.setting}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={gameSettings.allowSpectators}
                        onChange={(e) => setGameSettings(prev => ({ ...prev, allowSpectators: e.target.checked }))}
                        className={styles.checkbox}
                      />
                      Allow Spectators
                    </label>
                  </div>

                  <div className={styles.setting}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={gameSettings.isRanked}
                        onChange={(e) => setGameSettings(prev => ({ ...prev, isRanked: e.target.checked }))}
                        className={styles.checkbox}
                      />
                      Ranked Game
                    </label>
                  </div>
                </div>

                <div className={styles.actions}>
                  <GamingButton
                    onClick={handleCreateGame}
                    size="large"
                    glowEffect
                    disabled={isLoading}
                  >
                    <FaPlay className={styles.buttonIcon} />
                    Create Game
                  </GamingButton>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'joinGame' && (
            <motion.div
              key="joinGame"
              className={styles.tabContent}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.joinGameContent}>
                <div className={styles.searchBar}>
                  <FaSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.gamesList}>
                  {isLoading ? (
                    <div className={styles.loading}>
                      <LoadingSpinner size="medium" />
                      <p>Loading games...</p>
                    </div>
                  ) : filteredGames.length === 0 ? (
                    <div className={styles.noGames}>
                      <p>No active games found</p>
                      <NeonButton onClick={() => setActiveTab('createGame')}>
                        Create a Game
                      </NeonButton>
                    </div>
                  ) : (
                    filteredGames.map((game) => (
                      <motion.div
                        key={game.id}
                        className={styles.gameCard}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className={styles.gameInfo}>
                          <div className={styles.gameHeader}>
                            <h4>Game #{game.id.slice(-6)}</h4>
                            <div className={styles.gameStatus}>
                              {game.status === 'waiting' && (
                                <span className={styles.statusWaiting}>Waiting for player</span>
                              )}
                              {game.status === 'playing' && (
                                <span className={styles.statusPlaying}>In progress</span>
                              )}
                            </div>
                          </div>

                          <div className={styles.players}>
                            <div className={styles.player}>
                              <span className={styles.playerName}>
                                {game.playerX?.name || 'Waiting...'}
                              </span>
                              <span className={styles.playerElo}>
                                ELO: {game.playerX?.elo || '?'}
                              </span>
                            </div>
                            <span className={styles.vs}>VS</span>
                            <div className={styles.player}>
                              <span className={styles.playerName}>
                                {game.playerO?.name || 'Waiting...'}
                              </span>
                              <span className={styles.playerElo}>
                                ELO: {game.playerO?.elo || '?'}
                              </span>
                            </div>
                          </div>

                          <div className={styles.gameDetails}>
                            <span>Difficulty: {game.difficulty}</span>
                            <span>Time: {game.timeLimit ? `${game.timeLimit}s` : 'No limit'}</span>
                            {game.isRanked && <span className={styles.ranked}>Ranked</span>}
                          </div>
                        </div>

                        <div className={styles.gameActions}>
                          {game.status === 'waiting' && !game.playerO && (
                            <NeonButton
                              onClick={() => handleJoinGame(game.id)}
                              size="small"
                            >
                              Join
                            </NeonButton>
                          )}
                          {game.allowSpectators && game.status === 'playing' && (
                            <NeonButton
                              onClick={() => handleJoinGame(game.id)}
                              size="small"
                              variant="secondary"
                            >
                              <FaEye /> Spectate
                            </NeonButton>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OnlineGameLobby;