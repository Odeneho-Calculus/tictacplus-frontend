import { useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAudioSettings } from '../store/slices/settingsSlice';
import { SOUNDS } from '../utils/constants';
import soundManager from '../services/SoundManager';

/**
 * Custom hook for managing sound effects and audio using advanced SoundManager
 */
export const useSound = () => {
  const audioSettings = useSelector(selectAudioSettings);
  const isInitializedRef = useRef(false);

  // Initialize sound manager with settings
  useEffect(() => {
    if (!isInitializedRef.current) {
      soundManager.updateSettings({
        soundEnabled: audioSettings.soundEnabled,
        musicEnabled: audioSettings.musicEnabled,
        soundVolume: audioSettings.soundVolume,
        musicVolume: audioSettings.musicVolume
      });
      isInitializedRef.current = true;
    }
  }, []);

  // Update sound manager settings when Redux settings change
  useEffect(() => {
    soundManager.updateSettings({
      soundEnabled: audioSettings.soundEnabled,
      musicEnabled: audioSettings.musicEnabled,
      soundVolume: audioSettings.soundVolume,
      musicVolume: audioSettings.musicVolume
    });
  }, [audioSettings]);

  // Play a sound using the advanced sound manager
  const playSound = useCallback(async (soundType, options = {}) => {
    if (!audioSettings.soundEnabled && !options.force) {
      //console.log(`Sound ${soundType} skipped due to settings`);
      return;
    }

    // Check if this specific sound effect is enabled (unless forced)
    if (!options.force && audioSettings.soundEffects && !audioSettings.soundEffects[soundType]) {
      //console.log(`Sound ${soundType} skipped due to effect settings`);
      return;
    }

    //console.log(`Attempting to play sound: ${soundType}`, options);

    try {
      // For win/lose sounds, try to play directly with HTML5 Audio as a fallback
      if ((soundType === 'win' || soundType === 'lose') && options.force) {
        //console.log(`Using direct HTML5 Audio fallback for ${soundType}`);

        // Use absolute path to ensure the sound file is found
        const soundPath = soundType === 'win'
          ? '/assets/sounds/win.mp3'
          : '/assets/sounds/lose.mp3';

        // Create and configure audio element
        const audio = new Audio(soundPath);
        audio.volume = options.volume || 1.0;

        // Try to play the sound with error handling
        try {
          const playPromise = audio.play();

          // Modern browsers return a promise from play()
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              //console.error(`HTML5 Audio fallback failed for ${soundType}:`, e);

              // If HTML5 Audio fails, try a different approach - create an in-memory oscillator
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                // Configure the sound based on win/lose
                if (soundType === 'win') {
                  // Happy sound for win
                  oscillator.type = 'sine';
                  oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
                  oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // A5
                  gainNode.gain.setValueAtTime(options.volume || 0.7, ctx.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
                  oscillator.connect(gainNode);
                  gainNode.connect(ctx.destination);
                  oscillator.start();
                  oscillator.stop(ctx.currentTime + 1.0);
                  //console.log('Playing win sound with oscillator fallback');
                } else {
                  // Sad sound for lose
                  oscillator.type = 'triangle';
                  oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
                  oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.5); // A3
                  gainNode.gain.setValueAtTime(options.volume || 0.7, ctx.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
                  oscillator.connect(gainNode);
                  gainNode.connect(ctx.destination);
                  oscillator.start();
                  oscillator.stop(ctx.currentTime + 1.0);
                  //console.log('Playing lose sound with oscillator fallback');
                }
              } catch (oscError) {
                //console.error('Oscillator fallback also failed:', oscError);
                // Last resort - try the sound manager
                soundManager.playSound(soundType, options);
              }
            });
          }
        } catch (e) {
          //console.error(`HTML5 Audio play() failed for ${soundType}:`, e);
          // Still try the sound manager as last resort
          soundManager.playSound(soundType, options);
        }
      } else {
        await soundManager.playSound(soundType, options);
      }
    } catch (error) {
      //console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }, [audioSettings]);

  // Play multiple sounds in sequence
  const playSoundSequence = useCallback((sounds, interval = 100) => {
    try {
      soundManager.playSequence(sounds, interval);
    } catch (error) {
      //console.warn('Failed to play sound sequence:', error);
    }
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    try {
      soundManager.stopAll();
    } catch (error) {
      //console.warn('Failed to stop all sounds:', error);
    }
  }, []);

  // Preload a sound
  const preloadSound = useCallback(async (soundType, soundPath) => {
    try {
      await soundManager.loadSound(soundType, { path: soundPath });
    } catch (error) {
      //console.warn(`Failed to preload sound ${soundType}:`, error);
    }
  }, []);

  // Check if audio is supported
  const isAudioSupported = useCallback(() => {
    return !!(window.AudioContext || window.webkitAudioContext);
  }, []);

  // Resume audio context (needed for some browsers)
  const resumeAudio = useCallback(async () => {
    try {
      await soundManager.resumeAll();
    } catch (error) {
      //console.warn('Failed to resume audio:', error);
    }
  }, []);

  // Start background music
  const startBackgroundMusic = useCallback(async () => {
    if (!audioSettings.musicEnabled || !audioSettings.soundEnabled) return;

    try {
      await soundManager.startBackgroundMusic();
    } catch (error) {
      //console.warn('Failed to start background music:', error);
    }
  }, [audioSettings.musicEnabled, audioSettings.soundEnabled]);

  // Stop background music
  const stopBackgroundMusic = useCallback(async (fadeOut = false) => {
    try {
      await soundManager.stopBackgroundMusic(fadeOut);
    } catch (error) {
      //console.warn('Failed to stop background music:', error);
    }
  }, []);

  // Toggle background music
  const toggleBackgroundMusic = useCallback(() => {
    try {
      if (soundManager.isBackgroundMusicPlaying) {
        soundManager.stopBackgroundMusic();
      } else {
        soundManager.startBackgroundMusic();
      }
    } catch (error) {
      //console.warn('Failed to toggle background music:', error);
    }
  }, []);

  // Crossfade to different background track
  const crossfadeToTrack = useCallback(async (trackName, fadeTime = 2.0) => {
    try {
      await soundManager.crossfadeToTrack(trackName, fadeTime);
    } catch (error) {
      //console.warn('Failed to crossfade to track:', error);
    }
  }, []);

  // Duck background music (lower volume temporarily)
  const duckBackgroundMusic = useCallback((amount = 0.3, duration = 0.5) => {
    try {
      soundManager.duckBackgroundMusic(amount, duration);
    } catch (error) {
      //console.warn('Failed to duck background music:', error);
    }
  }, []);

  return {
    // Core functions
    playSound,
    playSoundSequence,
    stopAllSounds,
    preloadSound,

    // Background music functions
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleBackgroundMusic,
    crossfadeToTrack,
    duckBackgroundMusic,

    // Utility functions
    isAudioSupported,
    resumeAudio,

    // State
    isEnabled: audioSettings.soundEnabled,
    isMusicEnabled: audioSettings.musicEnabled,
    volume: audioSettings.soundVolume,
    musicVolume: audioSettings.musicVolume,
    soundEffects: audioSettings.soundEffects,
    isBackgroundMusicPlaying: soundManager.isBackgroundMusicPlaying,
    isReady: soundManager.isReady,
    loadedSounds: soundManager.loadedSounds,
    activeSoundCount: soundManager.activeSoundCount,
  };
};

export default useSound;