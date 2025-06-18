import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaWifi,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaSpinner,
    FaPlug,
    FaSignal
} from 'react-icons/fa';

// Store
import { selectIsOnlineGame } from '../../../store/slices/gameSlice';

// Hooks
import { useSocket } from '../../../hooks/useSocket';

// Styles
import styles from './ConnectionStatus.module.scss';

const ConnectionStatus = ({
    position = 'top-right',
    showDetails = false,
    autoHide = true,
    className
}) => {
    const isOnlineGame = useSelector(selectIsOnlineGame);
    const { socket, isConnected, connectionState, latency, reconnectAttempts } = useSocket();

    const [isVisible, setIsVisible] = useState(false);
    const [lastConnectionState, setLastConnectionState] = useState(null);
    const [showDetailedInfo, setShowDetailedInfo] = useState(showDetails);

    // Show/hide logic
    useEffect(() => {
        if (!isOnlineGame) {
            setIsVisible(false);
            return;
        }

        // Always show when disconnected or connecting
        if (!isConnected || connectionState === 'connecting' || connectionState === 'reconnecting') {
            setIsVisible(true);
            return;
        }

        // Auto-hide when connected (if autoHide is enabled)
        if (autoHide && isConnected && connectionState === 'connected') {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(true);
        }
    }, [isOnlineGame, isConnected, connectionState, autoHide]);

    // Track connection state changes for notifications
    useEffect(() => {
        if (lastConnectionState !== null && lastConnectionState !== connectionState) {
            setIsVisible(true);

            // Auto-hide success messages
            if (connectionState === 'connected' && autoHide) {
                const timer = setTimeout(() => {
                    setIsVisible(false);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
        setLastConnectionState(connectionState);
    }, [connectionState, lastConnectionState, autoHide]);

    const getConnectionIcon = () => {
        switch (connectionState) {
            case 'connected':
                return <FaCheckCircle className={styles.connectedIcon} />;
            case 'connecting':
            case 'reconnecting':
                return (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <FaSpinner className={styles.connectingIcon} />
                    </motion.div>
                );
            case 'disconnected':
                return <FaTimesCircle className={styles.disconnectedIcon} />;
            case 'error':
                return <FaExclamationTriangle className={styles.errorIcon} />;
            default:
                return <FaWifi className={styles.defaultIcon} />;
        }
    };

    const getConnectionText = () => {
        switch (connectionState) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'reconnecting':
                return `Reconnecting... (${reconnectAttempts}/5)`;
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Connection Error';
            default:
                return 'Unknown';
        }
    };

    const getConnectionQuality = () => {
        if (!isConnected || latency === null) return null;

        if (latency < 50) return 'excellent';
        if (latency < 100) return 'good';
        if (latency < 200) return 'fair';
        return 'poor';
    };

    const getLatencyColor = () => {
        const quality = getConnectionQuality();
        switch (quality) {
            case 'excellent': return '#00ff88';
            case 'good': return '#88ff00';
            case 'fair': return '#ffaa00';
            case 'poor': return '#ff4757';
            default: return '#666';
        }
    };

    if (!isOnlineGame) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={`${styles.connectionStatus} ${styles[position]} ${styles[connectionState]} ${className || ''}`}
                    initial={{ opacity: 0, scale: 0.8, y: position.includes('top') ? -20 : 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: position.includes('top') ? -20 : 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                >
                    <div className={styles.statusMain}>
                        <div className={styles.statusIcon}>
                            {getConnectionIcon()}
                        </div>
                        <div className={styles.statusText}>
                            <span className={styles.statusLabel}>{getConnectionText()}</span>
                            {isConnected && latency !== null && (
                                <span
                                    className={styles.latency}
                                    style={{ color: getLatencyColor() }}
                                >
                                    {latency}ms
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Signal Strength Indicator */}
                    {isConnected && (
                        <div className={styles.signalStrength}>
                            <div className={styles.signalBars}>
                                {[1, 2, 3, 4].map((bar) => (
                                    <motion.div
                                        key={bar}
                                        className={`${styles.signalBar} ${getConnectionQuality() === 'excellent' && bar <= 4 ? styles.active :
                                                getConnectionQuality() === 'good' && bar <= 3 ? styles.active :
                                                    getConnectionQuality() === 'fair' && bar <= 2 ? styles.active :
                                                        getConnectionQuality() === 'poor' && bar <= 1 ? styles.active : ''
                                            }`}
                                        initial={{ height: 0 }}
                                        animate={{ height: '100%' }}
                                        transition={{ delay: bar * 0.1 }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Information */}
                    <AnimatePresence>
                        {showDetailedInfo && (
                            <motion.div
                                className={styles.detailedInfo}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <FaPlug className={styles.infoIcon} />
                                        <span className={styles.infoLabel}>Status:</span>
                                        <span className={styles.infoValue}>{connectionState}</span>
                                    </div>

                                    {isConnected && latency !== null && (
                                        <div className={styles.infoItem}>
                                            <FaSignal className={styles.infoIcon} />
                                            <span className={styles.infoLabel}>Latency:</span>
                                            <span
                                                className={styles.infoValue}
                                                style={{ color: getLatencyColor() }}
                                            >
                                                {latency}ms ({getConnectionQuality()})
                                            </span>
                                        </div>
                                    )}

                                    {socket && (
                                        <div className={styles.infoItem}>
                                            <FaWifi className={styles.infoIcon} />
                                            <span className={styles.infoLabel}>Transport:</span>
                                            <span className={styles.infoValue}>
                                                {socket.io.engine.transport.name}
                                            </span>
                                        </div>
                                    )}

                                    {reconnectAttempts > 0 && (
                                        <div className={styles.infoItem}>
                                            <FaSpinner className={styles.infoIcon} />
                                            <span className={styles.infoLabel}>Reconnects:</span>
                                            <span className={styles.infoValue}>{reconnectAttempts}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Connection State Indicator */}
                    <div className={styles.stateIndicator}>
                        <motion.div
                            className={styles.pulse}
                            animate={connectionState === 'connected' ? {
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7]
                            } : {}}
                            transition={{
                                duration: 2,
                                repeat: connectionState === 'connected' ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Compact version for minimal display
export const CompactConnectionStatus = ({ className }) => {
    const isOnlineGame = useSelector(selectIsOnlineGame);
    const { isConnected, connectionState, latency } = useSocket();

    if (!isOnlineGame) return null;

    const getStatusColor = () => {
        switch (connectionState) {
            case 'connected': return '#00ff88';
            case 'connecting':
            case 'reconnecting': return '#ffaa00';
            case 'disconnected':
            case 'error': return '#ff4757';
            default: return '#666';
        }
    };

    return (
        <motion.div
            className={`${styles.compactStatus} ${className || ''}`}
            animate={connectionState === 'connecting' || connectionState === 'reconnecting' ? {
                scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
        >
            <div
                className={styles.compactIndicator}
                style={{ backgroundColor: getStatusColor() }}
            />
            {isConnected && latency !== null && (
                <span className={styles.compactLatency}>{latency}ms</span>
            )}
        </motion.div>
    );
};

export default ConnectionStatus;