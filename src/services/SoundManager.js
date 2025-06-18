/**
 * Advanced Sound Manager
 * Handles all audio operations with sophisticated features
 */
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.compressor = null;
    this.soundPool = new Map();
    this.activeBackgroundMusic = null;
    this.fadingTracks = new Set();
    this.settings = {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.7,
      musicVolume: 0.3,
      masterVolume: 1.0,
      compressionEnabled: true,
      maxConcurrentSounds: 20,
      fadeTime: 0.5,
      duckingEnabled: true,
      duckingAmount: 0.3
    };
    this.isInitialized = false;
    this.isUserInteracted = false;
    this.soundBuffers = new Map();
    this.loadingPromises = new Map();
    this.fallbackEnabled = true;
    this.performanceMode = false;
    this.activeSources = new Set();
    this.soundQueue = [];
    this.isProcessingQueue = false;
    this.isStartingBackgroundMusic = false;

    // Bind methods
    this.handleUserInteraction = this.handleUserInteraction.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleMemoryWarning = this.handleMemoryWarning.bind(this);

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // User interaction detection
    const interactionEvents = ['click', 'touchstart', 'keydown', 'pointerdown'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, this.handleUserInteraction, {
        once: true,
        passive: true
      });
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Memory pressure handling
    if ('onmemorywarning' in window) {
      window.addEventListener('memorywarning', this.handleMemoryWarning);
    }

    // Audio context state changes
    if (this.audioContext) {
      this.audioContext.addEventListener('statechange', () => {
        console.log('AudioContext state changed:', this.audioContext.state);
      });
    }
  }

  async handleUserInteraction() {
    if (!this.isUserInteracted) {
      this.isUserInteracted = true;
      await this.initialize();
      console.log('Sound system initialized after user interaction');
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseAll();
    } else {
      this.resumeAll();
    }
  }

  handleMemoryWarning() {
    console.warn('Memory warning detected, enabling performance mode');
    this.performanceMode = true;
    this.cleanup();
  }

  async initialize() {
    if (this.isInitialized || !this.settings.soundEnabled) {
      return;
    }

    try {
      // Create audio context with optimal settings
      const audioContextOptions = {
        latencyHint: 'interactive',
        sampleRate: 44100
      };

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)(audioContextOptions);

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.settings.masterVolume;

      // Create compressor for dynamic range control
      if (this.settings.compressionEnabled) {
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.audioContext.destination);
      } else {
        this.masterGain.connect(this.audioContext.destination);
      }

      // Create separate gain nodes for music and effects
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.settings.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.effectsGain = this.audioContext.createGain();
      this.effectsGain.gain.value = this.settings.soundVolume;
      this.effectsGain.connect(this.masterGain);

      // Resume audio context if needed
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('Advanced sound system initialized successfully');

      // Start loading sounds
      await this.preloadSounds();

    } catch (error) {
      console.error('Failed to initialize sound system:', error);
      this.fallbackToSimpleAudio();
    }
  }

  fallbackToSimpleAudio() {
    console.warn('Falling back to simple HTML5 audio');
    this.fallbackEnabled = true;
    this.isInitialized = true;
  }

  async preloadSounds() {
    // Load background music FIRST to ensure it's available for auto-start
    const prioritySounds = {
      backgroundMusic: {
        path: '/assets/sounds/game-music-loop-7.mp3',
        volume: 1.0,
        category: 'music',
        loop: true,
        priority: 1
      }
    };

    const regularSounds = {
      // Game sounds
      click: { path: '/assets/sounds/click.mp3', volume: 0.8, category: 'effect' },
      move: { path: '/assets/sounds/move.mp3', volume: 0.7, category: 'effect' },
      win: { path: '/assets/sounds/win.mp3', volume: 0.9, category: 'effect' },
      lose: { path: '/assets/sounds/lose.mp3', volume: 0.8, category: 'effect' },
      draw: { path: '/assets/sounds/draw.mp3', volume: 0.8, category: 'effect' },
      error: { path: '/assets/sounds/error.mp3', volume: 0.6, category: 'effect' },

      // UI sounds
      buttonClick: { path: '/assets/sounds/button-click.mp3', volume: 0.5, category: 'ui' },
      buttonHover: { path: '/assets/sounds/button-hover.mp3', volume: 0.3, category: 'ui' },
      notification: { path: '/assets/sounds/notification.mp3', volume: 0.7, category: 'ui' },
      gameStart: { path: '/assets/sounds/game-start.mp3', volume: 0.8, category: 'effect' },
      countdown: { path: '/assets/sounds/countdown.mp3', volume: 0.7, category: 'effect' }
    };

    // Combine with priority sounds first
    const soundManifest = { ...prioritySounds, ...regularSounds };

    // Load priority sounds first, then regular sounds
    console.log('Loading priority sounds first...');
    for (const [name, config] of Object.entries(prioritySounds)) {
      try {
        await this.loadSound(name, config);
        console.log(`Priority sound loaded: ${name}`);
      } catch (error) {
        console.warn(`Failed to load priority sound ${name}:`, error);
      }
    }

    // Now load regular sounds in parallel
    console.log('Loading regular sounds...');
    const loadPromises = Object.entries(regularSounds).map(([name, config]) =>
      this.loadSound(name, config)
    );

    const results = await Promise.allSettled(loadPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Sound loading complete: ${successful + Object.keys(prioritySounds).length} successful, ${failed} failed`);

    // Emit event that sound loading is complete
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('soundsLoaded', {
        detail: {
          total: Object.keys(soundManifest).length,
          successful: successful + Object.keys(prioritySounds).length,
          failed
        }
      }));
    }
  }

  async loadSound(name, config) {
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const loadPromise = this.performSoundLoad(name, config);
    this.loadingPromises.set(name, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(name);
    }
  }

  async performSoundLoad(name, config) {
    try {
      const response = await fetch(config.path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (this.audioContext && !this.fallbackEnabled) {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.soundBuffers.set(name, {
          buffer: audioBuffer,
          config,
          type: 'webaudio'
        });
      } else {
        // Fallback to HTML5 audio
        const audio = new Audio();
        audio.src = URL.createObjectURL(new Blob([arrayBuffer]));
        audio.preload = 'auto';
        audio.volume = config.volume * this.settings.soundVolume;

        this.soundBuffers.set(name, {
          audio,
          config,
          type: 'html5'
        });
      }

      console.log(`Loaded sound: ${name}`);
    } catch (error) {
      console.warn(`Failed to load sound ${name}:`, error);

      // Create synthetic fallback
      if (this.audioContext && config.category === 'effect') {
        const syntheticBuffer = this.createSyntheticSound(name);
        if (syntheticBuffer) {
          this.soundBuffers.set(name, {
            buffer: syntheticBuffer,
            config,
            type: 'synthetic'
          });
        }
      }
    }
  }

  createSyntheticSound(soundType) {
    if (!this.audioContext) return null;

    const duration = 0.15;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Define sound characteristics
    const soundConfigs = {
      click: { frequency: 800, type: 'sine', decay: 8 },
      move: { frequency: 600, type: 'triangle', decay: 6 },
      win: { frequency: [523, 659, 784], type: 'sine', decay: 4 },
      lose: { frequency: 200, type: 'sawtooth', decay: 3 },
      error: { frequency: 150, type: 'square', decay: 10 },
      buttonClick: { frequency: 1000, type: 'sine', decay: 12 },
      buttonHover: { frequency: 400, type: 'sine', decay: 15 }
    };

    const config = soundConfigs[soundType] || soundConfigs.click;
    const frequencies = Array.isArray(config.frequency) ? config.frequency : [config.frequency];

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      frequencies.forEach((freq, index) => {
        const phaseOffset = index * Math.PI / 4;
        switch (config.type) {
          case 'sine':
            sample += Math.sin(2 * Math.PI * freq * t + phaseOffset);
            break;
          case 'triangle':
            sample += (4 / Math.PI) * Math.sin(2 * Math.PI * freq * t + phaseOffset);
            break;
          case 'sawtooth':
            sample += 2 * (t * freq - Math.floor(t * freq + 0.5));
            break;
          case 'square':
            sample += Math.sign(Math.sin(2 * Math.PI * freq * t + phaseOffset));
            break;
        }
      });

      // Apply envelope
      const envelope = Math.exp(-t * config.decay);
      data[i] = (sample / frequencies.length) * envelope * 0.3;
    }

    return buffer;
  }

  async playSound(soundName, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.settings.soundEnabled || (!this.isUserInteracted && !options.force)) {
      console.log(`Sound ${soundName} queued/skipped:`, {
        soundEnabled: this.settings.soundEnabled,
        userInteracted: this.isUserInteracted,
        force: options.force
      });
      this.soundQueue.push({ soundName, options });
      return;
    }

    const soundData = this.soundBuffers.get(soundName);
    if (!soundData) {
      // Only warn once per missing sound to avoid spam
      if (!this.warnedSounds) {
        this.warnedSounds = new Set();
      }

      if (!this.warnedSounds.has(soundName)) {
        console.warn(`Sound not found: ${soundName}`);
        this.warnedSounds.add(soundName);
      }
      return;
    }

    // Check concurrent sound limit and clean up finished sounds
    this.cleanupFinishedSounds();

    if (this.activeSources.size >= this.settings.maxConcurrentSounds) {
      // Try to stop oldest non-music sounds to make room
      this.stopOldestSounds(soundName);

      if (this.activeSources.size >= this.settings.maxConcurrentSounds) {
        console.warn('Max concurrent sounds reached, skipping:', soundName, this.activeSources.size);
        return;
      }
    }

    try {
      let result = null;
      if (soundData.type === 'webaudio') {
        result = await this.playWebAudioSound(soundName, soundData, options);
      } else if (soundData.type === 'html5') {
        result = await this.playHTML5Sound(soundName, soundData, options);
      }
      return result;
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error);
      return null;
    }
  }

  async playWebAudioSound(soundName, soundData, options) {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = soundData.buffer;

    // Calculate final volume
    const baseVolume = soundData.config.volume || 1;
    const optionVolume = options.volume !== undefined ? options.volume : 1;
    const categoryMultiplier = soundData.config.category === 'music' ?
      this.settings.musicVolume : this.settings.soundVolume;

    gainNode.gain.value = baseVolume * optionVolume * categoryMultiplier;

    // Apply options
    if (options.playbackRate) {
      source.playbackRate.value = options.playbackRate;
    }

    if (options.loop !== undefined) {
      source.loop = options.loop;
    }

    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        gainNode.gain.value,
        this.audioContext.currentTime + options.fadeIn
      );
    }

    // Connect audio graph
    source.connect(gainNode);
    const targetGain = soundData.config.category === 'music' ? this.musicGain : this.effectsGain;
    gainNode.connect(targetGain);

    // Track active source with timestamp
    this.activeSources.add({ source, gainNode, soundName, startTime: Date.now() });

    // Setup cleanup
    source.onended = () => {
      this.activeSources.forEach(active => {
        if (active.source === source) {
          this.activeSources.delete(active);
        }
      });

      // Clear background music reference if this was the active background music
      if (this.activeBackgroundMusic && this.activeBackgroundMusic.source === source) {
        console.log('Background music ended, clearing reference');
        this.activeBackgroundMusic = null;
      }

      try {
        source.disconnect();
        gainNode.disconnect();
      } catch (error) {
        // Already disconnected
      }
    };

    // Start playback
    const when = options.when || this.audioContext.currentTime;
    source.start(when);

    // Handle fade out
    if (options.fadeOut && options.duration) {
      const fadeOutStart = when + options.duration - options.fadeOut;
      gainNode.gain.setValueAtTime(gainNode.gain.value, fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + options.fadeOut);
      source.stop(when + options.duration);
    }

    return { source, gainNode };
  }

  async playHTML5Sound(soundName, soundData, options) {
    const audio = soundData.audio.cloneNode();

    // Apply options
    if (options.volume !== undefined) {
      audio.volume = Math.min(1, options.volume * soundData.config.volume * this.settings.soundVolume);
    }

    if (options.playbackRate) {
      audio.playbackRate = options.playbackRate;
    }

    if (options.loop !== undefined) {
      audio.loop = options.loop;
    }

    try {
      await audio.play();
      this.activeSources.add({ audio, soundName, type: 'html5', startTime: Date.now() });

      audio.onended = () => {
        this.activeSources.forEach(active => {
          if (active.audio === audio) {
            this.activeSources.delete(active);
          }
        });

        // Clear background music reference if this was the active background music
        if (this.activeBackgroundMusic && this.activeBackgroundMusic.audio === audio) {
          console.log('Background music ended, clearing reference');
          this.activeBackgroundMusic = null;
        }
      };
    } catch (error) {
      console.error('HTML5 audio playback failed:', error);
    }

    return audio;
  }

  async startBackgroundMusic(trackName = 'backgroundMusic', options = {}) {
    // Check if background music is already playing
    if (!this.settings.musicEnabled) {
      console.log('Background music start skipped: music disabled');
      return;
    }

    // Prevent multiple simultaneous starts
    if (this.isStartingBackgroundMusic) {
      console.log('Background music start skipped: already starting');
      return;
    }

    this.isStartingBackgroundMusic = true;

    if (this.activeBackgroundMusic && this.activeBackgroundMusic.name === trackName) {
      // Check if the audio is actually still playing
      const isStillPlaying = this.activeBackgroundMusic.audio ?
        !this.activeBackgroundMusic.audio.paused && !this.activeBackgroundMusic.audio.ended :
        this.activeBackgroundMusic.source && this.activeBackgroundMusic.source.playbackState !== 'finished';

      if (isStillPlaying) {
        console.log('Background music start skipped: already playing', {
          currentTrack: this.activeBackgroundMusic.name,
          requestedTrack: trackName,
          isPlaying: this.isBackgroundMusicPlaying
        });
        return;
      } else {
        // Clear the stale reference
        this.activeBackgroundMusic = null;
      }
    }

    // Double-check by looking at active sources
    const bgMusicSources = Array.from(this.activeSources.values()).filter(source =>
      source.loop && source.buffer === this.soundBuffers.get(trackName)
    );

    if (bgMusicSources.length > 0) {
      console.log('Background music start skipped: found active looping source');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    // Wait for the sound to be loaded if it's still loading
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    while (!this.soundBuffers.has(trackName) && attempts < maxAttempts) {
      console.log(`Waiting for background music '${trackName}' to load... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.soundBuffers.has(trackName)) {
      console.warn(`Background music track '${trackName}' not loaded after waiting`);
      return;
    }

    try {
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUDIO) {
        console.log('Attempting to start background music:', trackName);
      }
      const musicData = await this.playSound(trackName, {
        loop: true,
        fadeIn: options.fadeIn || 2.0,
        volume: options.volume || 1.0,
        force: true
      });

      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUDIO) {
        console.log('Music data returned from playSound:', musicData);
      }

      if (musicData) {
        // Handle different return types from playSound
        if (musicData instanceof HTMLAudioElement) {
          // HTML5 audio element
          this.activeBackgroundMusic = {
            name: trackName,
            audio: musicData
          };
        } else if (musicData.source && musicData.gainNode) {
          // Web Audio API
          this.activeBackgroundMusic = {
            name: trackName,
            source: musicData.source,
            gainNode: musicData.gainNode
          };
        } else {
          // Fallback
          this.activeBackgroundMusic = {
            name: trackName,
            ...musicData
          };
        }
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_AUDIO) {
          console.log('Active background music stored:', this.activeBackgroundMusic);
        }
        console.log('Background music started successfully:', trackName);
      } else {
        console.warn('Failed to get music data for:', trackName);
      }
    } catch (error) {
      console.error('Failed to start background music:', error);
    } finally {
      this.isStartingBackgroundMusic = false;
    }
  }

  async stopBackgroundMusic(fadeOut = false) {
    if (!this.activeBackgroundMusic) {
      console.log('No background music to stop');
      return;
    }

    console.log('Stopping background music:', this.activeBackgroundMusic.name);

    try {
      const bgMusic = this.activeBackgroundMusic;

      // Clear the reference immediately to prevent duplicates
      this.activeBackgroundMusic = null;

      if (fadeOut && bgMusic.gainNode) {
        const fadeTime = this.settings.fadeTime || 1.0;
        const currentTime = this.audioContext.currentTime;

        bgMusic.gainNode.gain.setValueAtTime(
          bgMusic.gainNode.gain.value,
          currentTime
        );
        bgMusic.gainNode.gain.linearRampToValueAtTime(
          0,
          currentTime + fadeTime
        );

        setTimeout(() => {
          this.cleanupBackgroundMusicSource(bgMusic);
        }, fadeTime * 1000);
      } else {
        // Immediate stop
        this.cleanupBackgroundMusicSource(bgMusic);
      }

      console.log('Background music stopped successfully');
    } catch (error) {
      console.error('Failed to stop background music:', error);
      this.activeBackgroundMusic = null;
    }
  }

  cleanupBackgroundMusicSource(bgMusic) {
    console.log('Starting cleanup for background music:', bgMusic);

    try {
      // Log what we have
      console.log('Background music properties:', {
        hasSource: !!bgMusic.source,
        hasAudio: !!bgMusic.audio,
        hasGainNode: !!bgMusic.gainNode,
        name: bgMusic.name
      });

      // Stop Web Audio source
      if (bgMusic.source) {
        try {
          console.log('Attempting to stop Web Audio source...');
          bgMusic.source.stop();
          console.log('✅ Web Audio source stopped');
        } catch (sourceError) {
          console.warn('Failed to stop Web Audio source:', sourceError);
        }
      }

      // Stop HTML5 audio
      if (bgMusic.audio) {
        try {
          console.log('Attempting to stop HTML5 audio...');
          bgMusic.audio.pause();
          bgMusic.audio.currentTime = 0;
          console.log('✅ HTML5 audio stopped');
        } catch (audioError) {
          console.warn('Failed to stop HTML5 audio:', audioError);
        }
      }

      // Remove from active sources
      let removedCount = 0;
      this.activeSources.forEach(active => {
        if (active.source === bgMusic.source || active.audio === bgMusic.audio) {
          this.activeSources.delete(active);
          removedCount++;
        }
      });
      console.log(`Removed ${removedCount} active sources`);

      // Disconnect nodes
      if (bgMusic.gainNode) {
        try {
          bgMusic.gainNode.disconnect();
          console.log('✅ Gain node disconnected');
        } catch (gainError) {
          console.warn('Failed to disconnect gain node:', gainError);
        }
      }

      if (bgMusic.source) {
        try {
          bgMusic.source.disconnect();
          console.log('✅ Source disconnected');
        } catch (disconnectError) {
          console.warn('Failed to disconnect source:', disconnectError);
        }
      }

      console.log('✅ Background music cleanup completed');
    } catch (error) {
      console.error('❌ Critical error during background music cleanup:', error);
    }
  }

  async crossfadeToTrack(newTrack, fadeTime = 2.0) {
    const promises = [];

    if (this.activeBackgroundMusic) {
      promises.push(this.stopBackgroundMusic(true));
    }

    promises.push(
      new Promise(resolve => {
        setTimeout(() => {
          this.startBackgroundMusic(newTrack, { fadeIn: fadeTime });
          resolve();
        }, fadeTime * 500);
      })
    );

    await Promise.all(promises);
  }

  duckBackgroundMusic(amount = 0.3, duration = 0.5) {
    if (!this.activeBackgroundMusic?.gainNode || !this.settings.duckingEnabled) {
      return;
    }

    const currentTime = this.audioContext.currentTime;
    const currentGain = this.activeBackgroundMusic.gainNode.gain.value;
    const targetGain = currentGain * (1 - amount);

    this.activeBackgroundMusic.gainNode.gain.setValueAtTime(currentGain, currentTime);
    this.activeBackgroundMusic.gainNode.gain.linearRampToValueAtTime(targetGain, currentTime + 0.1);

    // Restore after duration
    setTimeout(() => {
      if (this.activeBackgroundMusic?.gainNode) {
        const restoreTime = this.audioContext.currentTime;
        this.activeBackgroundMusic.gainNode.gain.linearRampToValueAtTime(
          currentGain,
          restoreTime + 0.3
        );
      }
    }, duration * 1000);
  }

  playSequence(sounds, interval = 100) {
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        if (typeof sound === 'string') {
          this.playSound(sound);
        } else {
          this.playSound(sound.name, sound.options);
        }
      }, index * interval);
    });
  }

  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);

    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.masterVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.settings.musicVolume;
    }
    if (this.effectsGain) {
      this.effectsGain.gain.value = this.settings.soundVolume;
    }

    // Handle music enable/disable
    if (!this.settings.musicEnabled && this.activeBackgroundMusic) {
      this.stopBackgroundMusic();
    } else if (this.settings.musicEnabled && !this.activeBackgroundMusic && this.isUserInteracted) {
      this.startBackgroundMusic();
    }
  }

  pauseAll() {
    this.activeSources.forEach(active => {
      try {
        if (active.audio && !active.audio.paused) {
          active.audio.pause();
        }
      } catch (error) {
        console.warn('Failed to pause audio:', error);
      }
    });

    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resumeAll() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Process queued sounds
    if (!this.isProcessingQueue && this.soundQueue.length > 0) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessingQueue || this.soundQueue.length === 0) return;

    this.isProcessingQueue = true;
    const queue = [...this.soundQueue];
    this.soundQueue = [];

    for (const { soundName, options } of queue) {
      await this.playSound(soundName, options);
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between sounds
    }

    this.isProcessingQueue = false;
  }

  cleanupFinishedSounds() {
    const toRemove = [];

    this.activeSources.forEach((active, key) => {
      let isFinished = false;

      try {
        if (active.source && active.source.playbackState === 'finished') {
          isFinished = true;
        } else if (active.audio && (active.audio.ended || active.audio.paused)) {
          isFinished = true;
        } else if (active.startTime && (Date.now() - active.startTime) > 10000) {
          // Remove sounds older than 10 seconds as safety measure
          isFinished = true;
        }
      } catch (error) {
        // If we can't check the state, assume it's finished
        isFinished = true;
      }

      if (isFinished) {
        toRemove.push(key);
      }
    });

    toRemove.forEach(key => {
      this.activeSources.delete(key);
    });
  }

  stopOldestSounds(currentSoundName) {
    // Don't stop background music or the current sound being played
    const nonMusicSounds = Array.from(this.activeSources.entries())
      .filter(([key, active]) =>
        !key.includes('backgroundMusic') &&
        !key.includes(currentSoundName)
      )
      .sort((a, b) => (a[1].startTime || 0) - (b[1].startTime || 0));

    // Stop the oldest 3 sounds to make room
    const toStop = nonMusicSounds.slice(0, 3);

    toStop.forEach(([key, active]) => {
      try {
        if (active.source) {
          active.source.stop();
          active.source.disconnect();
        }
        if (active.gainNode) {
          active.gainNode.disconnect();
        }
        if (active.audio) {
          active.audio.pause();
        }
        this.activeSources.delete(key);
      } catch (error) {
        // Already stopped
      }
    });
  }

  stopAll() {
    this.activeSources.forEach(active => {
      try {
        if (active.source) {
          active.source.stop();
          active.source.disconnect();
        }
        if (active.gainNode) {
          active.gainNode.disconnect();
        }
        if (active.audio) {
          active.audio.pause();
          active.audio.currentTime = 0;
        }
      } catch (error) {
        // Already stopped/disconnected
      }
    });

    this.activeSources.clear();
    this.stopBackgroundMusic(false);
  }

  cleanup() {
    this.stopAll();

    // Clear buffers in performance mode
    if (this.performanceMode) {
      this.soundBuffers.clear();
      this.loadingPromises.clear();
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  destroy() {
    this.cleanup();

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.isInitialized = false;
    this.isUserInteracted = false;
  }

  // Public API getters
  get isReady() {
    return this.isInitialized && this.isUserInteracted;
  }

  get isBackgroundMusicPlaying() {
    if (!this.activeBackgroundMusic) return false;

    // Check if Web Audio source is still playing
    if (this.activeBackgroundMusic.source) {
      return true; // Web Audio sources don't have a direct "playing" state check
    }

    // Check if HTML5 audio is playing
    if (this.activeBackgroundMusic.audio) {
      return !this.activeBackgroundMusic.audio.paused &&
        !this.activeBackgroundMusic.audio.ended;
    }

    return false;
  }

  get currentSettings() {
    return { ...this.settings };
  }

  get isBackgroundMusicPlaying() {
    return !!this.activeBackgroundMusic;
  }

  get loadedSounds() {
    return Array.from(this.soundBuffers.keys());
  }

  get activeSoundCount() {
    return this.activeSources.size;
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;