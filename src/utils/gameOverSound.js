/**
 * Utility to play game-over sound directly using HTML5 Audio
 * This bypasses the regular sound system to ensure the sound plays
 */

/**
 * Play the game-over sound directly using HTML5 Audio
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<boolean>} - Whether the sound was successfully played
 */
export const playGameOverSound = async (volume = 0.8) => {
    try {
        console.log('Attempting to play game-over sound directly');

        // Create a new Audio element directly with absolute path
        const audio = new Audio('/assets/sounds/game-over.mp3');

        // Set properties for better playback
        audio.volume = volume;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';

        // Play the sound
        try {
            await audio.play();
            console.log('Game-over sound played successfully');
            return true;
        } catch (playError) {
            console.error('Game-over sound failed to play:', playError);

            // Try fallback with Web Audio API - create a more complex game over sound
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();

                // Create multiple oscillators for a richer sound
                const osc1 = ctx.createOscillator(); // Main tone
                const osc2 = ctx.createOscillator(); // Secondary tone
                const lfo = ctx.createOscillator();  // For modulation

                // Create gain nodes
                const mainGain = ctx.createGain();
                const lfoGain = ctx.createGain();

                // Configure for a game-over type sound
                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
                osc1.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.5); // A3

                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(330, ctx.currentTime); // E4
                osc2.frequency.exponentialRampToValueAtTime(165, ctx.currentTime + 0.5); // E3

                // LFO for vibrato effect
                lfo.type = 'sine';
                lfo.frequency.value = 8;
                lfoGain.gain.value = 10;

                // Connect LFO to oscillator frequency for vibrato
                lfo.connect(lfoGain);
                lfoGain.connect(osc1.frequency);

                // Configure volume envelope
                mainGain.gain.setValueAtTime(volume, ctx.currentTime);
                mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

                // Connect nodes
                osc1.connect(mainGain);
                osc2.connect(mainGain);
                mainGain.connect(ctx.destination);

                // Start and stop oscillators
                lfo.start();
                osc1.start();
                osc2.start();

                lfo.stop(ctx.currentTime + 1.2);
                osc1.stop(ctx.currentTime + 1.2);
                osc2.stop(ctx.currentTime + 1.2);

                console.log('Played fallback game-over sound with Web Audio API');
                return true;
            } catch (oscError) {
                console.error('Web Audio API fallback also failed:', oscError);
                return false;
            }
        }
    } catch (error) {
        console.error('Failed to create game-over sound:', error);
        return false;
    }
};

/**
 * Play a win sound directly using Web Audio API
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<boolean>} - Whether the sound was successfully played
 */
export const playWinSound = async (volume = 0.8) => {
    try {
        console.log('Playing win sound with Web Audio API');

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Configure oscillators for a happy sound
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(554, ctx.currentTime); // C#5
        osc2.frequency.exponentialRampToValueAtTime(1108, ctx.currentTime + 0.5); // C#6

        // Configure volume envelope
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

        // Connect nodes
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Start and stop oscillators
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.0);
        osc2.stop(ctx.currentTime + 1.0);

        return true;
    } catch (error) {
        console.error('Failed to play win sound with Web Audio API:', error);
        return false;
    }
};

/**
 * Play a lose sound directly using Web Audio API
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<boolean>} - Whether the sound was successfully played
 */
export const playLoseSound = async (volume = 0.7) => {
    try {
        console.log('Playing lose sound with Web Audio API');

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Configure oscillator for a sad sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.5); // A3

        // Configure volume envelope
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        // Connect nodes
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Start and stop oscillator
        osc.start();
        osc.stop(ctx.currentTime + 0.8);

        return true;
    } catch (error) {
        console.error('Failed to play lose sound with Web Audio API:', error);
        return false;
    }
};