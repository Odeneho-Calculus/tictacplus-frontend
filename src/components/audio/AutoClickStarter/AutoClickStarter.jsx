import { useEffect, useRef } from 'react';
import { useSound } from '../../../hooks/useSound';
import soundManager from '../../../services/SoundManager';

/**
 * AutoClickStarter Component
 * Creates an invisible button that auto-clicks to enable audio after app loads
 * This is a more reliable way to handle browser autoplay restrictions
 */
const AutoClickStarter = () => {
    const { isEnabled, isMusicEnabled } = useSound();
    const buttonRef = useRef(null);
    const hasClickedRef = useRef(false);

    useEffect(() => {
        if (!isEnabled || !isMusicEnabled || hasClickedRef.current) return;
        if (soundManager.isUserInteracted) return;

        // Wait for app to fully load, then trigger auto-click
        const timer = setTimeout(() => {
            if (buttonRef.current && !hasClickedRef.current) {
                console.log('Auto-clicking to enable audio system');
                buttonRef.current.click();
                hasClickedRef.current = true;
            }
        }, 2000); // 2 seconds after component mounts

        return () => clearTimeout(timer);
    }, [isEnabled, isMusicEnabled]);

    const handleAutoClick = () => {
        console.log('Auto-click triggered for audio system');
        soundManager.isUserInteracted = true;

        // Try to initialize audio context
        if (soundManager.audioContext?.state === 'suspended') {
            soundManager.audioContext.resume().then(() => {
                console.log('Audio context resumed via auto-click');
            }).catch(err => {
                console.warn('Failed to resume audio context:', err);
            });
        }

        // Dispatch a custom event to notify that user interaction occurred
        window.dispatchEvent(new CustomEvent('autoAudioClick'));
    };

    // Don't render if conditions aren't met
    if (!isEnabled || !isMusicEnabled || hasClickedRef.current) {
        return null;
    }

    return (
        <button
            ref={buttonRef}
            onClick={handleAutoClick}
            style={{
                position: 'fixed',
                top: '-1000px',
                left: '-1000px',
                width: '1px',
                height: '1px',
                opacity: 0,
                pointerEvents: 'none',
                visibility: 'hidden'
            }}
            aria-hidden="true"
            tabIndex={-1}
        >
            Auto Audio Enable
        </button>
    );
};

export default AutoClickStarter;