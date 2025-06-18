import { useEffect, useRef } from 'react';
import { useSound } from '../../../hooks/useSound';
import soundManager from '../../../services/SoundManager';

/**
 * Enhanced Background Music Component
 * Manages global background music with advanced features
 */
const BackgroundMusic = () => {
    const {
        startBackgroundMusic,
        stopBackgroundMusic,
        isMusicEnabled,
        isEnabled,
        isBackgroundMusicPlaying,
        isReady
    } = useSound();

    const initializationAttemptedRef = useRef(false);
    const startupTimerRef = useRef(null);

    // Initialize background music with better timing
    useEffect(() => {
        if (!initializationAttemptedRef.current && isEnabled && isMusicEnabled) {
            initializationAttemptedRef.current = true;

            // Use multiple strategies to ensure music starts
            const startMusicWithDelay = async () => {
                // Strategy 1: Try immediate start (for already interacted users)
                if (soundManager.isUserInteracted) {
                    await startBackgroundMusic();
                    return;
                }

                // Strategy 2: Set up user interaction listeners with improved detection
                const interactionEvents = [
                    'click', 'touchstart', 'keydown', 'pointerdown',
                    'mousedown', 'touchmove', 'wheel', 'scroll'
                ];

                const handleFirstInteraction = async (event) => {
                    // Only log first interaction, not subsequent ones
                    if (!soundManager.isUserInteracted) {
                        console.log('User interaction detected, starting background music:', event.type);
                    }

                    // Small delay to ensure audio context is fully ready
                    if (startupTimerRef.current) {
                        clearTimeout(startupTimerRef.current);
                    }

                    startupTimerRef.current = setTimeout(async () => {
                        if (!isBackgroundMusicPlaying && isMusicEnabled && isEnabled) {
                            await startBackgroundMusic();
                        }
                    }, 250);

                    // Remove all listeners after first interaction
                    interactionEvents.forEach(eventType => {
                        document.removeEventListener(eventType, handleFirstInteraction);
                    });
                };

                // Add interaction listeners
                interactionEvents.forEach(eventType => {
                    document.addEventListener(eventType, handleFirstInteraction, {
                        once: true,
                        passive: true,
                        capture: true
                    });
                });

                // Strategy 3: Fallback timeout (in case user takes a while to interact)
                setTimeout(() => {
                    if (!isBackgroundMusicPlaying && isMusicEnabled && isEnabled) {
                        console.log('Fallback: Attempting to start background music after delay');
                        startBackgroundMusic().catch(console.warn);
                    }
                }, 5000);

                // Strategy 4: Page visibility change handler (for page focus/return)
                const handleVisibilityChange = async () => {
                    if (!document.hidden && !isBackgroundMusicPlaying && isMusicEnabled && isEnabled) {
                        console.log('Page became visible, attempting to start background music');
                        await startBackgroundMusic();
                    }
                };

                document.addEventListener('visibilitychange', handleVisibilityChange);

                // Cleanup visibility listener
                return () => {
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                };
            };

            const cleanup = startMusicWithDelay();

            return () => {
                if (cleanup && typeof cleanup.then === 'function') {
                    cleanup.then(cleanupFn => cleanupFn && cleanupFn());
                } else if (typeof cleanup === 'function') {
                    cleanup();
                }
            };
        }
    }, [isEnabled, isMusicEnabled, startBackgroundMusic, isBackgroundMusicPlaying]);

    // Handle settings changes more intelligently
    useEffect(() => {
        if (!isEnabled || !isMusicEnabled) {
            if (isBackgroundMusicPlaying) {
                console.log('Settings changed, stopping background music');
                stopBackgroundMusic();
            }
            initializationAttemptedRef.current = false; // Allow re-initialization when re-enabled
        } else if (isEnabled && isMusicEnabled && !isBackgroundMusicPlaying && soundManager.isUserInteracted) {
            // If settings are enabled but music isn't playing and user has interacted, start it
            console.log('Settings enabled and user has interacted, starting background music');
            startBackgroundMusic().catch(console.warn);
        }
    }, [isEnabled, isMusicEnabled, isBackgroundMusicPlaying, stopBackgroundMusic, startBackgroundMusic]);

    // Enhanced cleanup on unmount
    useEffect(() => {
        return () => {
            if (startupTimerRef.current) {
                clearTimeout(startupTimerRef.current);
            }

            // Only stop if we're the ones who started it
            if (isBackgroundMusicPlaying) {
                console.log('BackgroundMusic component unmounting, stopping music');
                stopBackgroundMusic();
            }
        };
    }, [stopBackgroundMusic, isBackgroundMusicPlaying]);

    // Debug logging in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('BackgroundMusic component state:', {
                isEnabled,
                isMusicEnabled,
                isBackgroundMusicPlaying,
                isReady,
                isUserInteracted: soundManager.isUserInteracted,
                soundManagerReady: soundManager.isReady
            });
        }
    }, [isEnabled, isMusicEnabled, isBackgroundMusicPlaying, isReady]);

    // This component doesn't render anything
    return null;
};

export default BackgroundMusic;