import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaGamepad } from 'react-icons/fa';
import styles from './MatchRequestModal.module.scss';

const MatchRequestModal = ({ player, onSend, onCancel }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSend(message);
    };

    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>
                        <FaGamepad className={styles.icon} />
                        Send Match Request
                    </h2>
                    <button
                        className={styles.closeButton}
                        onClick={onCancel}
                        aria-label="Close modal"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.playerInfo}>
                        <div className={styles.avatar}>
                            {player.avatar ? (
                                <img src={player.avatar} alt={`${player.displayName || player.username}'s avatar`} />
                            ) : (
                                <div className={styles.defaultAvatar}>
                                    {(player.displayName || player.username)?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className={styles.playerDetails}>
                            <h3>{player.displayName || player.username}</h3>
                            <div className={styles.playerStats}>
                                <span>ELO: {player.stats?.elo || 1200}</span>
                                <span>Level: {player.stats?.level || 1}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="message">Add a message (optional):</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hey! Want to play a game?"
                                maxLength={100}
                                rows={3}
                            />
                            <div className={styles.charCount}>
                                {message.length}/100
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={styles.sendButton}
                            >
                                Send Request
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default MatchRequestModal;
