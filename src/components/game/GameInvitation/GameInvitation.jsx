import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUserFriends,
    FaGamepad,
    FaCheck,
    FaTimes,
    FaClock,
    FaUser,
    FaTrophy,
    FaFire,
    FaShare
} from 'react-icons/fa';

// Store
import {
    selectPendingInvitations,
    acceptGameInvitation,
    declineGameInvitation,
    sendGameInvitation
} from '../../../store/slices/gameSlice';
import { selectAuth } from '../../../store/slices/authSlice';

// Components
import { GamingButton, NeonButton } from '../../ui';

// Hooks
import { useSocket } from '../../../hooks/useSocket';
import { useSound } from '../../../hooks/useSound';

// Styles
import styles from './GameInvitation.module.scss';

const GameInvitation = ({ invitation, onAccept, onDecline, className }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { playSound } = useSound();

    const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
    const [isProcessing, setIsProcessing] = useState(false);

    // Countdown timer
    useEffect(() => {
        if (!invitation) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleDecline(); // Auto-decline when time runs out
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [invitation]);

    const handleAccept = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            playSound('success');
            await dispatch(acceptGameInvitation(invitation.id)).unwrap();

            if (onAccept) {
                onAccept(invitation);
            }

            // Navigate to game
            navigate(`/game/${invitation.gameId}`);
        } catch (error) {
            console.error('Failed to accept invitation:', error);
            playSound('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecline = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            playSound('buttonClick');
            await dispatch(declineGameInvitation(invitation.id)).unwrap();

            if (onDecline) {
                onDecline(invitation);
            }
        } catch (error) {
            console.error('Failed to decline invitation:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds) => {
        return `${seconds}s`;
    };

    const getGameModeIcon = (mode) => {
        switch (mode) {
            case 'ranked':
                return <FaTrophy />;
            case 'blitz':
                return <FaFire />;
            default:
                return <FaGamepad />;
        }
    };

    if (!invitation) return null;

    return (
        <motion.div
            className={`${styles.gameInvitation} ${className || ''}`}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className={styles.header}>
                <div className={styles.inviterInfo}>
                    <div className={styles.avatar}>
                        {invitation.inviter.avatar ? (
                            <img src={invitation.inviter.avatar} alt={invitation.inviter.name} />
                        ) : (
                            <div className={styles.defaultAvatar}>
                                {invitation.inviter.name[0]}
                            </div>
                        )}
                    </div>
                    <div className={styles.inviterDetails}>
                        <h4 className={styles.inviterName}>{invitation.inviter.name}</h4>
                        <div className={styles.inviterStats}>
                            <span className={styles.elo}>ELO: {invitation.inviter.elo || 1200}</span>
                            <span className={styles.level}>Lv.{invitation.inviter.level || 1}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.gameMode}>
                    <div className={styles.modeIcon}>
                        {getGameModeIcon(invitation.gameSettings.mode)}
                    </div>
                    <span className={styles.modeText}>
                        {invitation.gameSettings.mode?.toUpperCase() || 'CASUAL'}
                    </span>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.invitationText}>
                    <FaUserFriends className={styles.inviteIcon} />
                    <span>wants to play Tic-Tac-Plus!</span>
                </div>

                <div className={styles.gameSettings}>
                    <div className={styles.setting}>
                        <span className={styles.settingLabel}>Time Limit:</span>
                        <span className={styles.settingValue}>
                            {invitation.gameSettings.timeLimit ?
                                `${invitation.gameSettings.timeLimit}s` :
                                'No limit'
                            }
                        </span>
                    </div>

                    {invitation.gameSettings.isRanked && (
                        <div className={styles.setting}>
                            <span className={styles.settingLabel}>Type:</span>
                            <span className={styles.settingValue}>Ranked</span>
                        </div>
                    )}

                    <div className={styles.setting}>
                        <span className={styles.settingLabel}>Difficulty:</span>
                        <span className={styles.settingValue}>
                            {invitation.gameSettings.difficulty || 'Medium'}
                        </span>
                    </div>
                </div>

                <div className={styles.timer}>
                    <FaClock className={styles.timerIcon} />
                    <span className={styles.timerText}>Expires in:</span>
                    <motion.span
                        className={styles.timerValue}
                        animate={timeLeft <= 10 ? {
                            color: ['#ff4757', '#ff6b7a', '#ff4757']
                        } : {}}
                        transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
                    >
                        {formatTime(timeLeft)}
                    </motion.span>
                </div>
            </div>

            <div className={styles.actions}>
                <GamingButton
                    onClick={handleAccept}
                    disabled={isProcessing || timeLeft <= 0}
                    variant="primary"
                    size="medium"
                    className={styles.acceptButton}
                >
                    <FaCheck />
                    Accept
                </GamingButton>

                <NeonButton
                    onClick={handleDecline}
                    disabled={isProcessing}
                    variant="secondary"
                    size="medium"
                    className={styles.declineButton}
                >
                    <FaTimes />
                    Decline
                </NeonButton>
            </div>

            {/* Progress bar showing time left */}
            <div className={styles.progressBar}>
                <motion.div
                    className={styles.progressFill}
                    animate={{ width: `${(timeLeft / 30) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Pulse effect for urgency */}
            {timeLeft <= 10 && (
                <motion.div
                    className={styles.urgentPulse}
                    animate={{
                        scale: [1, 1.02, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </motion.div>
    );
};

// Container for multiple invitations
export const GameInvitationList = ({ position = 'top-right' }) => {
    const invitations = useSelector(selectPendingInvitations);
    const [visibleInvitations, setVisibleInvitations] = useState([]);

    useEffect(() => {
        setVisibleInvitations(invitations || []);
    }, [invitations]);

    const handleAccept = (invitation) => {
        setVisibleInvitations(prev =>
            prev.filter(inv => inv.id !== invitation.id)
        );
    };

    const handleDecline = (invitation) => {
        setVisibleInvitations(prev =>
            prev.filter(inv => inv.id !== invitation.id)
        );
    };

    if (!visibleInvitations.length) return null;

    return (
        <div className={`${styles.invitationList} ${styles[position]}`}>
            <AnimatePresence>
                {visibleInvitations.map((invitation, index) => (
                    <GameInvitation
                        key={invitation.id}
                        invitation={invitation}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        className={styles.listItem}
                        style={{ zIndex: 1000 - index }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Send invitation component
export const SendGameInvitation = ({
    friend,
    gameSettings,
    onSent,
    onCancel,
    isOpen
}) => {
    const dispatch = useDispatch();
    const auth = useSelector(selectAuth);
    const { playSound } = useSound();

    const [isSending, setIsSending] = useState(false);
    const [customMessage, setCustomMessage] = useState('');

    const handleSend = async () => {
        if (isSending) return;

        setIsSending(true);
        try {
            playSound('buttonClick');

            await dispatch(sendGameInvitation({
                recipientId: friend.id,
                gameSettings,
                message: customMessage,
                inviter: {
                    id: auth.user.id,
                    name: auth.user.displayName || auth.user.username,
                    avatar: auth.user.avatar,
                    elo: auth.user.stats?.elo || 1200,
                    level: auth.user.stats?.level || 1
                }
            })).unwrap();

            playSound('success');
            if (onSent) onSent();
        } catch (error) {
            console.error('Failed to send invitation:', error);
            playSound('error');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.sendInvitationModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
            >
                <motion.div
                    className={styles.sendInvitationContent}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.sendHeader}>
                        <h3>Invite {friend.name} to Play</h3>
                        <button className={styles.closeButton} onClick={onCancel}>
                            <FaTimes />
                        </button>
                    </div>

                    <div className={styles.sendContent}>
                        <div className={styles.friendInfo}>
                            <div className={styles.friendAvatar}>
                                {friend.avatar ? (
                                    <img src={friend.avatar} alt={friend.name} />
                                ) : (
                                    <div className={styles.defaultAvatar}>
                                        {friend.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className={styles.friendDetails}>
                                <h4>{friend.name}</h4>
                                <p>ELO: {friend.elo || 1200}</p>
                            </div>
                        </div>

                        <div className={styles.messageInput}>
                            <label>Custom Message (Optional)</label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Add a personal message..."
                                maxLength={200}
                            />
                        </div>

                        <div className={styles.gameSettingsPreview}>
                            <h5>Game Settings</h5>
                            <div className={styles.settingsGrid}>
                                <div className={styles.setting}>
                                    <span>Mode:</span>
                                    <span>{gameSettings.mode || 'Casual'}</span>
                                </div>
                                <div className={styles.setting}>
                                    <span>Time Limit:</span>
                                    <span>{gameSettings.timeLimit ? `${gameSettings.timeLimit}s` : 'No limit'}</span>
                                </div>
                                <div className={styles.setting}>
                                    <span>Type:</span>
                                    <span>{gameSettings.isRanked ? 'Ranked' : 'Casual'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sendActions}>
                        <GamingButton
                            onClick={handleSend}
                            disabled={isSending}
                            variant="primary"
                            size="large"
                        >
                            {isSending ? 'Sending...' : 'Send Invitation'}
                        </GamingButton>

                        <NeonButton
                            onClick={onCancel}
                            variant="secondary"
                            size="large"
                        >
                            Cancel
                        </NeonButton>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GameInvitation;