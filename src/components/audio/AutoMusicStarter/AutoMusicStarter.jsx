import { useEffect, useRef } from 'react';
import { useSound } from '../../../hooks/useSound';
import soundManager from '../../../services/SoundManager';

/**
 * AutoMusicStarter Component
 * Automatically simulates user interaction to start background music when audio settings are enabled
 * This component handles browser autoplay policies in a user-friendly way
 */
const AutoMusicStarter = () => {
    const { isEnabled, isMusicEnabled, isBackgroundMusicPlaying, startBackgroundMusic } = useSound();
    const hasTriggeredRef = useRef(false);
    const attemptCountRef = useRef(0);
    const maxAttempts = 10;
    const soundsLoadedRef = useRef(false);

    // Listen for sounds loaded event
    useEffect(() => {
        const handleSoundsLoaded = (event) => {
            console.log('Sounds loaded event received:', event.detail);
            soundsLoadedRef.current = true;

            // Try to start background music if conditions are met
            if (isEnabled && isMusicEnabled && !isBackgroundMusicPlaying && !hasTriggeredRef.current) {
                console.log('Sounds loaded, attempting to start background music');
                setTimeout(async () => {
                    if (soundManager.isUserInteracted) {
                        try {
                            await startBackgroundMusic();
                            hasTriggeredRef.current = true;
                        } catch (error) {
                            console.warn('Failed to start background music after sounds loaded:', error);
                        }
                    }
                }, 500);
            }
        };

        window.addEventListener('soundsLoaded', handleSoundsLoaded);
        return () => window.removeEventListener('soundsLoaded', handleSoundsLoaded);
    }, [isEnabled, isMusicEnabled, isBackgroundMusicPlaying, startBackgroundMusic]);

    // Listen for auto-click event
    useEffect(() => {
        const handleAutoClick = async () => {
            console.log('Auto-click event received for music starter');
            if (isEnabled && isMusicEnabled && !isBackgroundMusicPlaying && !hasTriggeredRef.current) {
                // Small delay to ensure audio context is ready
                setTimeout(async () => {
                    try {
                        console.log('Starting background music after auto-click');
                        await startBackgroundMusic();
                        hasTriggeredRef.current = true;
                    } catch (error) {
                        console.warn('Failed to start background music after auto-click:', error);
                    }
                }, 1000);
            }
        };

        window.addEventListener('autoAudioClick', handleAutoClick);
        return () => window.removeEventListener('autoAudioClick', handleAutoClick);
    }, [isEnabled, isMusicEnabled, isBackgroundMusicPlaying, startBackgroundMusic]);

    // Auto-trigger music start when conditions are met
    useEffect(() => {
        if (hasTriggeredRef.current) return;
        if (!isEnabled || !isMusicEnabled) return;
        if (isBackgroundMusicPlaying) return;

        const triggerMusicStart = async () => {
            if (attemptCountRef.current >= maxAttempts) {
                console.log('Max attempts reached for auto-starting background music');
                return;
            }

            attemptCountRef.current++;
            console.log(`Auto-start attempt ${attemptCountRef.current}/${maxAttempts} for background music`);

            try {
                // Wait for sounds to be loaded
                if (!soundsLoadedRef.current && !soundManager.soundBuffers.has('backgroundMusic')) {
                    console.log('Background music not loaded yet, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // Try again if background music still not loaded
                    if (!soundManager.soundBuffers.has('backgroundMusic')) {
                        console.log('Background music still not loaded, will retry later');
                        if (attemptCountRef.current < maxAttempts) {
                            setTimeout(triggerMusicStart, 2000);
                        }
                        return;
                    }
                }

                // Wait a bit for sound system to be ready
                await new Promise(resolve => setTimeout(resolve, 300));

                // Check if user has already interacted
                if (soundManager.isUserInteracted) {
                    console.log('User already interacted, starting background music directly');
                    await startBackgroundMusic();
                    hasTriggeredRef.current = true;
                    return;
                }

                // Create a minimal, invisible user interaction simulation
                const simulateUserInteraction = () => {
                    console.log('Simulating user interaction for background music');

                    // Create a programmatic click event that will satisfy browser requirements
                    const event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        isTrusted: false // This will be false for programmatic events
                    });

                    // Dispatch on document body
                    document.body.dispatchEvent(event);

                    // Also try with a touch event for mobile
                    const touchEvent = new TouchEvent('touchstart', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });

                    document.body.dispatchEvent(touchEvent);

                    // Mark as user interacted for our sound system
                    soundManager.isUserInteracted = true;
                };

                // Try the simulation
                simulateUserInteraction();

                // Small delay then attempt to start music
                setTimeout(async () => {
                    try {
                        await startBackgroundMusic();
                        hasTriggeredRef.current = true;
                        console.log('Background music auto-started successfully');
                    } catch (error) {
                        console.warn('Auto-start simulation failed:', error);
                        // Don't mark as triggered so it can try again
                    }
                }, 300);

            } catch (error) {
                console.warn('Auto-start attempt failed:', error);
                // Try again after a delay if we haven't hit max attempts
                if (attemptCountRef.current < maxAttempts) {
                    setTimeout(triggerMusicStart, 2000);
                }
            }
        };

        // Start the process after a short delay to ensure everything is loaded
        const timer = setTimeout(triggerMusicStart, 1000);

        return () => clearTimeout(timer);
    }, [isEnabled, isMusicEnabled, isBackgroundMusicPlaying, startBackgroundMusic]);

    // Reset when settings change
    useEffect(() => {
        if (!isEnabled || !isMusicEnabled) {
            hasTriggeredRef.current = false;
            attemptCountRef.current = 0;
        }
    }, [isEnabled, isMusicEnabled]);

    // Fallback: Listen for actual user interactions and start music then
    useEffect(() => {
        if (hasTriggeredRef.current) return;
        if (!isEnabled || !isMusicEnabled) return;
        if (isBackgroundMusicPlaying) return;

        const handleRealUserInteraction = async (event) => {
            console.log('Real user interaction detected:', event.type);

            // Small delay to ensure audio context is ready
            setTimeout(async () => {
                if (!hasTriggeredRef.current && !isBackgroundMusicPlaying) {
                    try {
                        await startBackgroundMusic();
                        hasTriggeredRef.current = true;
                        console.log('Background music started from real user interaction');
                    } catch (error) {
                        console.warn('Failed to start music from real interaction:', error);
                    }
                }
            }, 200);
        };

        // Listen for various user interaction events
        const interactionEvents = [
            'click', 'mousedown', 'touchstart', 'keydown',
            'pointerdown', 'touchmove', 'wheel', 'scroll'
        ];

        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, handleRealUserInteraction, {
                once: true,
                passive: true,
                capture: true
            });
        });

        return () => {
            interactionEvents.forEach(eventType => {
                document.removeEventListener(eventType, handleRealUserInteraction, { capture: true });
            });
        };
    }, [isEnabled, isMusicEnabled, isBackgroundMusicPlaying, startBackgroundMusic]);

    // This component doesn't render anything
    return null;
};

export default AutoMusicStarter;