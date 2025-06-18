import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaUsers, FaComments, FaPaperPlane, FaTimes } from 'react-icons/fa';

// Store
import {
    selectSpectators,
    selectGameId,
    selectIsOnlineGame,
    addSpectator,
    removeSpectator
} from '../../../store/slices/gameSlice';
import { selectAuth } from '../../../store/slices/authSlice';

// Components
import { NeonButton } from '../../ui';

// Hooks
import { useSocket } from '../../../hooks/useSocket';

// Styles
import styles from './SpectatorPanel.module.scss';

const SpectatorPanel = ({ isVisible, onToggle }) => {
    const dispatch = useDispatch();
    const spectators = useSelector(selectSpectators);
    const gameId = useSelector(selectGameId);
    const isOnlineGame = useSelector(selectIsOnlineGame);
    const auth = useSelector(selectAuth);
    const { socket, isConnected } = useSocket();

    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showChat, setShowChat] = useState(false);

    // Socket event handlers for spectator chat
    useEffect(() => {
        if (!socket || !isOnlineGame) return;

        const handleSpectatorMessage = (data) => {
            setChatMessages(prev => [...prev, {
                id: Date.now(),
                user: data.user,
                message: data.message,
                timestamp: new Date(),
                type: 'message'
            }]);
        };

        const handleSpectatorJoin = (data) => {
            setChatMessages(prev => [...prev, {
                id: Date.now(),
                user: data.user,
                message: `${data.user.name} joined as spectator`,
                timestamp: new Date(),
                type: 'join'
            }]);
            dispatch(addSpectator(data.user));
        };

        const handleSpectatorLeave = (data) => {
            setChatMessages(prev => [...prev, {
                id: Date.now(),
                user: data.user,
                message: `${data.user.name} left`,
                timestamp: new Date(),
                type: 'leave'
            }]);
            dispatch(removeSpectator(data.user.id));
        };

        socket.on('spectator:message', handleSpectatorMessage);
        socket.on('spectator:join', handleSpectatorJoin);
        socket.on('spectator:leave', handleSpectatorLeave);

        return () => {
            socket.off('spectator:message', handleSpectatorMessage);
            socket.off('spectator:join', handleSpectatorJoin);
            socket.off('spectator:leave', handleSpectatorLeave);
        };
    }, [socket, isOnlineGame, dispatch]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isConnected) return;

        const messageData = {
            gameId,
            user: {
                id: auth.user.id,
                name: auth.user.displayName || auth.user.username,
                avatar: auth.user.avatar
            },
            message: newMessage.trim()
        };

        socket.emit('spectator:message', messageData);
        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOnlineGame) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.spectatorPanel}
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    <div className={styles.header}>
                        <div className={styles.title}>
                            <FaEye className={styles.icon} />
                            <span>Spectators ({spectators?.length || 0})</span>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.chatToggle}
                                onClick={() => setShowChat(!showChat)}
                                title={showChat ? 'Hide Chat' : 'Show Chat'}
                            >
                                <FaComments />
                            </button>
                            <button
                                className={styles.closeButton}
                                onClick={onToggle}
                                title="Close Panel"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div className={styles.content}>
                        {/* Spectators List */}
                        <div className={styles.spectatorsList}>
                            <h4 className={styles.sectionTitle}>
                                <FaUsers className={styles.sectionIcon} />
                                Watching
                            </h4>

                            {spectators && spectators.length > 0 ? (
                                <div className={styles.spectators}>
                                    {spectators.map((spectator) => (
                                        <motion.div
                                            key={spectator.id}
                                            className={styles.spectator}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <div className={styles.spectatorAvatar}>
                                                {spectator.avatar ? (
                                                    <img src={spectator.avatar} alt={spectator.name} />
                                                ) : (
                                                    <div className={styles.defaultAvatar}>
                                                        {spectator.name?.[0] || 'S'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.spectatorInfo}>
                                                <div className={styles.spectatorName}>
                                                    {spectator.name}
                                                </div>
                                                <div className={styles.spectatorElo}>
                                                    ELO: {spectator.elo || 1200}
                                                </div>
                                            </div>
                                            <div className={styles.spectatorStatus}>
                                                <span className={styles.liveIndicator}>🔴 LIVE</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.noSpectators}>
                                    <FaEyeSlash className={styles.emptyIcon} />
                                    <p>No spectators yet</p>
                                </div>
                            )}
                        </div>

                        {/* Chat Section */}
                        <AnimatePresence>
                            {showChat && (
                                <motion.div
                                    className={styles.chatSection}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h4 className={styles.sectionTitle}>
                                        <FaComments className={styles.sectionIcon} />
                                        Spectator Chat
                                    </h4>

                                    <div className={styles.chatMessages}>
                                        {chatMessages.length > 0 ? (
                                            chatMessages.map((msg) => (
                                                <motion.div
                                                    key={msg.id}
                                                    className={`${styles.chatMessage} ${styles[msg.type]}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    {msg.type === 'message' ? (
                                                        <>
                                                            <div className={styles.messageHeader}>
                                                                <span className={styles.messageUser}>
                                                                    {msg.user.name}
                                                                </span>
                                                                <span className={styles.messageTime}>
                                                                    {formatTime(msg.timestamp)}
                                                                </span>
                                                            </div>
                                                            <div className={styles.messageContent}>
                                                                {msg.message}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={styles.systemMessage}>
                                                            <span className={styles.systemText}>
                                                                {msg.message}
                                                            </span>
                                                            <span className={styles.messageTime}>
                                                                {formatTime(msg.timestamp)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className={styles.noChatMessages}>
                                                <p>No messages yet. Start the conversation!</p>
                                            </div>
                                        )}
                                    </div>

                                    <form className={styles.chatInput} onSubmit={handleSendMessage}>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className={styles.messageInput}
                                            maxLength={200}
                                            disabled={!isConnected}
                                        />
                                        <button
                                            type="submit"
                                            className={styles.sendButton}
                                            disabled={!newMessage.trim() || !isConnected}
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Connection Status */}
                    <div className={styles.footer}>
                        <div className={styles.connectionStatus}>
                            <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
                                {isConnected ? '🟢' : '🔴'}
                            </span>
                            <span className={styles.statusText}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Toggle button for spectator panel
export const SpectatorToggle = ({ isVisible, onToggle, spectatorCount = 0 }) => {
    const isOnlineGame = useSelector(selectIsOnlineGame);

    if (!isOnlineGame) return null;

    return (
        <motion.button
            className={styles.spectatorToggle}
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isVisible ? 'Hide Spectators' : 'Show Spectators'}
        >
            <FaEye className={styles.toggleIcon} />
            <span className={styles.toggleCount}>{spectatorCount}</span>
            {spectatorCount > 0 && (
                <motion.div
                    className={styles.liveIndicator}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    LIVE
                </motion.div>
            )}
        </motion.button>
    );
};

export default SpectatorPanel;