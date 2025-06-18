import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaCrown,
  FaCog,
  FaPlay,
  FaExit,
  FaUserPlus,
  FaShare,
  FaCopy,
  FaGamepad,
  FaClock,
  FaTrophy,
  FaFire,
  FaEye,
  FaComments,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeUp,
  FaVolumeOff
} from 'react-icons/fa';

// Store
import {
  selectLobby,
  selectIsLobbyHost,
  updateLobbySettings,
  startLobbyGame,
  leaveLobby,
  inviteToLobby,
  kickFromLobby,
  toggleLobbyReady
} from '../../../store/slices/gameSlice';
import { selectAuth } from '../../../store/slices/authSlice';

// Components
import { GamingButton, NeonButton, Card } from '../../ui';
import { SendGameInvitation } from '../GameInvitation/GameInvitation';

// Hooks
import { useSocket } from '../../../hooks/useSocket';
import { useSound } from '../../../hooks/useSound';

// Utils
import { GAME_MODES, DIFFICULTY_LEVELS } from '../../../utils/constants';

// Styles
import styles from './GameLobby.module.scss';

const GameLobby = ({ lobbyId, onGameStart, onLeaveLobby }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const lobby = useSelector(selectLobby);
  const isHost = useSelector(selectIsLobbyHost);
  const auth = useSelector(selectAuth);
  const { socket, isConnected } = useSocket();

  const [showSettings, setShowSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [lobbySettings, setLobbySettings] = useState({
    gameMode: 'classic',
    difficulty: 'medium',
    timeLimit: 30,
    isRanked: false,
    maxPlayers: 2,
    allowSpectators: true,
    isPrivate: false
  });

  // Initialize lobby settings
  useEffect(() => {
    if (lobby?.settings) {
      setLobbySettings(lobby.settings);
    }
  }, [lobby?.settings]);

  // Handle chat messages
  useEffect(() => {
    if (socket) {
      const handleChatMessage = (message) => {
        setChatMessages(prev => [...prev, message]);
        playSound('message');
      };

      socket.on('lobby:chat', handleChatMessage);
      return () => socket.off('lobby:chat', handleChatMessage);
    }
  }, [socket, playSound]);

  const handleSettingsChange = useCallback((key, value) => {
    if (!isHost) return;

    const newSettings = { ...lobbySettings, [key]: value };
    setLobbySettings(newSettings);

    dispatch(updateLobbySettings({
      lobbyId,
      settings: newSettings
    }));

    playSound('buttonClick');
  }, [dispatch, lobbyId, lobbySettings, isHost, playSound]);

  const handleStartGame = useCallback(async () => {
    if (!isHost || !canStartGame()) return;

    try {
      playSound('gameStart');
      await dispatch(startLobbyGame(lobbyId)).unwrap();

      if (onGameStart) {
        onGameStart();
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      playSound('error');
    }
  }, [dispatch, lobbyId, isHost, onGameStart, playSound]);

  const handleLeaveLobby = useCallback(async () => {
    try {
      playSound('buttonClick');
      await dispatch(leaveLobby(lobbyId)).unwrap();

      if (onLeaveLobby) {
        onLeaveLobby();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to leave lobby:', error);
    }
  }, [dispatch, lobbyId, navigate, onLeaveLobby, playSound]);

  const handleToggleReady = useCallback(() => {
    dispatch(toggleLobbyReady(lobbyId));
    playSound('buttonClick');
  }, [dispatch, lobbyId, playSound]);

  const handleKickPlayer = useCallback((playerId) => {
    if (!isHost) return;

    dispatch(kickFromLobby({ lobbyId, playerId }));
    playSound('error');
  }, [dispatch, lobbyId, isHost, playSound]);

  const handleSendChatMessage = useCallback(() => {
    if (!chatMessage.trim() || !socket) return;

    socket.emit('lobby:chat', {
      lobbyId,
      message: chatMessage.trim(),
      sender: {
        id: auth.user.id,
        name: auth.user.displayName || auth.user.username,
        avatar: auth.user.avatar
      }
    });

    setChatMessage('');
  }, [socket, lobbyId, chatMessage, auth.user]);

  const handleCopyLobbyLink = useCallback(() => {
    const lobbyLink = `${window.location.origin}/lobby/${lobbyId}`;
    navigator.clipboard.writeText(lobbyLink);
    playSound('success');
  }, [lobbyId, playSound]);

  const canStartGame = () => {
    if (!lobby || !isHost) return false;

    const readyPlayers = lobby.players?.filter(p => p.isReady || p.isHost) || [];
    const minPlayers = lobbySettings.gameMode === 'tournament' ? 4 : 2;

    return readyPlayers.length >= minPlayers && readyPlayers.length >= lobby.players.length;
  };

  const getGameModeIcon = (mode) => {
    switch (mode) {
      case 'ranked':
        return <FaTrophy />;
      case 'blitz':
        return <FaFire />;
      case 'tournament':
        return <FaCrown />;
      default:
        return <FaGamepad />;
    }
  };

  if (!lobby) {
    return (
      <div className={styles.lobbyLoading}>
        <div className={styles.loadingSpinner} />
        <p>Loading lobby...</p>
      </div>
    );
  }

  return (
    <div className={styles.gameLobby}>
      <div className={styles.lobbyHeader}>
        <div className={styles.lobbyInfo}>
          <div className={styles.lobbyTitle}>
            <div className={styles.modeIcon}>
              {getGameModeIcon(lobbySettings.gameMode)}
            </div>
            <div className={styles.titleText}>
              <h2>{lobby.name || 'Game Lobby'}</h2>
              <div className={styles.lobbyMeta}>
                <span className={styles.lobbyId}>ID: {lobbyId.slice(-8)}</span>
                <span className={styles.playerCount}>
                  {lobby.players?.length || 0}/{lobbySettings.maxPlayers}
                </span>
                {lobbySettings.isRanked && (
                  <span className={styles.rankedBadge}>RANKED</span>
                )}
                {lobbySettings.isPrivate && (
                  <span className={styles.privateBadge}>PRIVATE</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.lobbyActions}>
            <GamingButton
              onClick={handleCopyLobbyLink}
              variant="secondary"
              size="small"
              className={styles.shareButton}
            >
              <FaCopy />
              Copy Link
            </GamingButton>

            {isHost && (
              <GamingButton
                onClick={() => setShowSettings(!showSettings)}
                variant="secondary"
                size="small"
                className={styles.settingsButton}
              >
                <FaCog />
                Settings
              </GamingButton>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className={styles.connectionStatus}>
          <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
            <div className={styles.statusDot} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className={styles.lobbyContent}>
        <div className={styles.leftPanel}>
          {/* Players Section */}
          <Card className={styles.playersSection}>
            <div className={styles.sectionHeader}>
              <h3>
                <FaUsers />
                Players ({lobby.players?.length || 0}/{lobbySettings.maxPlayers})
              </h3>
              {isHost && (
                <GamingButton
                  onClick={() => setShowInviteModal(true)}
                  variant="primary"
                  size="small"
                >
                  <FaUserPlus />
                  Invite
                </GamingButton>
              )}
            </div>

            <div className={styles.playersList}>
              <AnimatePresence>
                {lobby.players?.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className={`${styles.playerCard} ${player.isHost ? styles.host : ''} ${player.isReady ? styles.ready : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={styles.playerAvatar}>
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} />
                      ) : (
                        <div className={styles.defaultAvatar}>
                          {player.name[0]}
                        </div>
                      )}
                      {player.isHost && (
                        <div className={styles.hostCrown}>
                          <FaCrown />
                        </div>
                      )}
                    </div>

                    <div className={styles.playerInfo}>
                      <div className={styles.playerName}>
                        {player.name}
                        {player.id === auth.user?.id && (
                          <span className={styles.youIndicator}>(You)</span>
                        )}
                      </div>
                      <div className={styles.playerStats}>
                        <span className={styles.elo}>ELO: {player.elo || 1200}</span>
                        <span className={styles.level}>Lv.{player.level || 1}</span>
                      </div>
                    </div>

                    <div className={styles.playerStatus}>
                      {player.isReady ? (
                        <div className={styles.readyStatus}>Ready</div>
                      ) : (
                        <div className={styles.notReadyStatus}>Not Ready</div>
                      )}

                      {/* Voice indicators */}
                      <div className={styles.voiceIndicators}>
                        {player.isMuted && <FaMicrophoneSlash className={styles.mutedIcon} />}
                        {player.isDeafened && <FaVolumeOff className={styles.deafenedIcon} />}
                      </div>
                    </div>

                    {isHost && player.id !== auth.user?.id && (
                      <div className={styles.playerActions}>
                        <button
                          onClick={() => handleKickPlayer(player.id)}
                          className={styles.kickButton}
                          title="Kick player"
                        >
                          <FaExit />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          {/* Game Settings */}
          <AnimatePresence>
            {showSettings && isHost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className={styles.settingsSection}>
                  <div className={styles.sectionHeader}>
                    <h3>
                      <FaCog />
                      Game Settings
                    </h3>
                  </div>

                  <div className={styles.settingsGrid}>
                    <div className={styles.settingGroup}>
                      <label>Game Mode</label>
                      <select
                        value={lobbySettings.gameMode}
                        onChange={(e) => handleSettingsChange('gameMode', e.target.value)}
                      >
                        <option value="classic">Classic</option>
                        <option value="blitz">Blitz</option>
                        <option value="ranked">Ranked</option>
                        <option value="tournament">Tournament</option>
                      </select>
                    </div>

                    <div className={styles.settingGroup}>
                      <label>Difficulty</label>
                      <select
                        value={lobbySettings.difficulty}
                        onChange={(e) => handleSettingsChange('difficulty', e.target.value)}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div className={styles.settingGroup}>
                      <label>Time Limit (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={lobbySettings.timeLimit}
                        onChange={(e) => handleSettingsChange('timeLimit', parseInt(e.target.value))}
                      />
                    </div>

                    <div className={styles.settingGroup}>
                      <label>Max Players</label>
                      <select
                        value={lobbySettings.maxPlayers}
                        onChange={(e) => handleSettingsChange('maxPlayers', parseInt(e.target.value))}
                      >
                        <option value="2">2 Players</option>
                        <option value="4">4 Players</option>
                        <option value="8">8 Players</option>
                      </select>
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={lobbySettings.isRanked}
                          onChange={(e) => handleSettingsChange('isRanked', e.target.checked)}
                        />
                        <span>Ranked Match</span>
                      </label>

                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={lobbySettings.allowSpectators}
                          onChange={(e) => handleSettingsChange('allowSpectators', e.target.checked)}
                        />
                        <span>Allow Spectators</span>
                      </label>

                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={lobbySettings.isPrivate}
                          onChange={(e) => handleSettingsChange('isPrivate', e.target.checked)}
                        />
                        <span>Private Lobby</span>
                      </label>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.rightPanel}>
          {/* Chat Section */}
          <Card className={styles.chatSection}>
            <div className={styles.sectionHeader}>
              <h3>
                <FaComments />
                Chat
              </h3>

              <div className={styles.voiceControls}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`${styles.voiceButton} ${isMuted ? styles.active : ''}`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>

                <button
                  onClick={() => setIsDeafened(!isDeafened)}
                  className={`${styles.voiceButton} ${isDeafened ? styles.active : ''}`}
                  title={isDeafened ? 'Undeafen' : 'Deafen'}
                >
                  {isDeafened ? <FaVolumeOff /> : <FaVolumeUp />}
                </button>
              </div>
            </div>

            <div className={styles.chatMessages}>
              <AnimatePresence>
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={styles.chatMessage}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className={styles.messageAvatar}>
                      {message.sender.avatar ? (
                        <img src={message.sender.avatar} alt={message.sender.name} />
                      ) : (
                        <div className={styles.defaultMessageAvatar}>
                          {message.sender.name[0]}
                        </div>
                      )}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageSender}>{message.sender.name}</div>
                      <div className={styles.messageText}>{message.message}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className={styles.chatInput}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Type a message..."
                maxLength={200}
              />
              <GamingButton
                onClick={handleSendChatMessage}
                disabled={!chatMessage.trim()}
                variant="primary"
                size="small"
              >
                Send
              </GamingButton>
            </div>
          </Card>

          {/* Spectators */}
          {lobbySettings.allowSpectators && lobby.spectators?.length > 0 && (
            <Card className={styles.spectatorsSection}>
              <div className={styles.sectionHeader}>
                <h3>
                  <FaEye />
                  Spectators ({lobby.spectators.length})
                </h3>
              </div>

              <div className={styles.spectatorsList}>
                {lobby.spectators.map((spectator) => (
                  <div key={spectator.id} className={styles.spectatorCard}>
                    <div className={styles.spectatorAvatar}>
                      {spectator.avatar ? (
                        <img src={spectator.avatar} alt={spectator.name} />
                      ) : (
                        <div className={styles.defaultAvatar}>
                          {spectator.name[0]}
                        </div>
                      )}
                    </div>
                    <span className={styles.spectatorName}>{spectator.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Lobby Controls */}
      <div className={styles.lobbyControls}>
        <div className={styles.leftControls}>
          <NeonButton
            onClick={handleLeaveLobby}
            variant="secondary"
            size="large"
            className={styles.leaveButton}
          >
            <FaExit />
            Leave Lobby
          </NeonButton>
        </div>

        <div className={styles.rightControls}>
          {!isHost && (
            <GamingButton
              onClick={handleToggleReady}
              variant={lobby.players?.find(p => p.id === auth.user?.id)?.isReady ? 'secondary' : 'primary'}
              size="large"
              className={styles.readyButton}
            >
              {lobby.players?.find(p => p.id === auth.user?.id)?.isReady ? 'Not Ready' : 'Ready'}
            </GamingButton>
          )}

          {isHost && (
            <GamingButton
              onClick={handleStartGame}
              disabled={!canStartGame()}
              variant="primary"
              size="large"
              className={styles.startButton}
            >
              <FaPlay />
              Start Game
            </GamingButton>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <SendGameInvitation
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        gameSettings={lobbySettings}
        onSent={() => setShowInviteModal(false)}
      />
    </div>
  );
};

export default GameLobby;