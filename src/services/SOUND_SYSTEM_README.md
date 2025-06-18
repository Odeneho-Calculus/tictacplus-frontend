# Advanced Sound System Documentation

## Overview

The TicTac+ game features a comprehensive, AAA-quality sound system built with modern web audio technologies. This system provides rich audio experiences with advanced features like dynamic range compression, audio ducking, crossfading, and sophisticated fallback mechanisms.

## Architecture

### Core Components

1. **SoundManager** (`src/services/SoundManager.js`)
   - Singleton service handling all audio operations
   - Web Audio API with HTML5 audio fallback
   - Advanced audio processing pipeline

2. **useSound Hook** (`src/hooks/useSound.js`)
   - React hook providing sound system integration
   - Connects Redux settings to audio engine
   - Provides simplified API for components

3. **BackgroundMusic Component** (`src/components/audio/BackgroundMusic/BackgroundMusic.jsx`)
   - Manages continuous background music
   - Multiple initialization strategies
   - Smart user interaction detection

## Key Features

### 🎵 Advanced Audio Processing
- **Dynamic Range Compression**: Automatic audio level balancing
- **Separate Audio Channels**: Independent volume control for music/effects
- **Master Gain Control**: Global volume management
- **Web Audio API**: Low-latency, high-quality audio processing

### 🎛️ Smart Playback Management
- **Concurrent Sound Limiting**: Prevents audio overload
- **Audio Ducking**: Automatic background music volume reduction during important sounds
- **Crossfading**: Smooth transitions between audio tracks
- **Pitch Variation**: Dynamic playback rate adjustment for variety

### 🔄 Robust Fallback System
- **Synthetic Sound Generation**: Procedural audio when files fail to load
- **HTML5 Audio Fallback**: Compatibility with older browsers
- **Graceful Degradation**: System continues working even with failures
- **Error Recovery**: Automatic retry and alternative strategies

### 📱 Browser Compatibility
- **User Interaction Compliance**: Respects browser autoplay policies
- **Mobile Optimization**: Touch event handling and memory management
- **Performance Mode**: Automatic resource management under stress
- **Cross-browser Support**: Works on all modern browsers

## Usage Examples

### Basic Sound Playback
```javascript
const { playSound } = useSound();

// Simple sound
await playSound('click');

// With options
await playSound('move', {
  volume: 0.8,
  playbackRate: 1.2
});
```

### Background Music Management
```javascript
const { startBackgroundMusic, stopBackgroundMusic, crossfadeToTrack } = useSound();

// Start background music
await startBackgroundMusic();

// Crossfade to different track
await crossfadeToTrack('intense-music', 2.0);

// Stop with fade out
stopBackgroundMusic();
```

### Audio Ducking
```javascript
const { duckBackgroundMusic } = useSound();

// Duck music by 50% for 2 seconds during important announcement
duckBackgroundMusic(0.5, 2.0);
```

### Sound Sequences
```javascript
const { playSoundSequence } = useSound();

// Play multiple sounds in sequence
playSoundSequence([
  { name: 'countdown', options: { volume: 0.8 } },
  { name: 'gameStart', options: { volume: 1.0 } }
], 500); // 500ms interval
```

## Sound Manifest

The system automatically loads these audio files:

### Game Effects
- `click.mp3` - UI interaction sounds
- `move.mp3` - Game move sounds
- `win.mp3` - Victory celebration
- `lose.mp3` - Defeat sound
- `draw.mp3` - Tie game sound
- `error.mp3` - Error notifications

### UI Sounds
- `button-click.mp3` - Button interactions
- `button-hover.mp3` - Hover feedback
- `notification.mp3` - System notifications
- `game-start.mp3` - Game initialization
- `countdown.mp3` - Timer sounds

### Music
- `game-music-loop-7.mp3` - Main background music

## Configuration

### Sound Settings (Redux Store)
```javascript
{
  soundEnabled: true,      // Master sound toggle
  musicEnabled: true,      // Background music toggle
  soundVolume: 0.7,       // Effects volume (0-1)
  musicVolume: 0.3,       // Music volume (0-1)
  soundEffects: {         // Individual sound toggles
    click: true,
    move: true,
    // ... etc
  }
}
```

### SoundManager Settings
```javascript
{
  masterVolume: 1.0,              // Master audio level
  compressionEnabled: true,       // Dynamic range compression
  maxConcurrentSounds: 12,        // Concurrent playback limit
  fadeTime: 0.5,                 // Default fade duration
  duckingEnabled: true,          // Auto-ducking feature
  duckingAmount: 0.3             // Default ducking amount
}
```

## Development & Debugging

### Debug Panel
In development mode, press `Ctrl+Shift+S` to open the advanced sound debug panel:

- **System Status**: Real-time audio system monitoring
- **Individual Sound Testing**: Test each sound effect
- **Volume Controls**: Adjust all audio levels
- **Sequence Testing**: Test sound combinations
- **Background Music Controls**: Music playback management
- **Advanced Features**: Crossfading and ducking tests
- **Log Export**: Export debug information

### Sound Test Page
Visit `/sound-test.html` for standalone audio system testing:
- Isolated testing environment
- No React dependencies
- Direct SoundManager API access
- Browser compatibility testing

## Performance Optimization

### Memory Management
- **Automatic Cleanup**: Unused audio sources are garbage collected
- **Performance Mode**: Activates under memory pressure
- **Sound Pool Management**: Efficient buffer reuse
- **Concurrent Limiting**: Prevents resource exhaustion

### Loading Strategy
- **Preloading**: Critical sounds loaded immediately
- **Lazy Loading**: Non-essential sounds loaded on demand
- **Synthetic Fallbacks**: Generated sounds when files unavailable
- **Progressive Enhancement**: Core functionality always available

## Browser Support

### Fully Supported
- Chrome 66+
- Firefox 60+
- Safari 12+
- Edge 79+

### Limited Support (HTML5 fallback)
- Internet Explorer 11
- Older mobile browsers
- Browsers without Web Audio API

## Advanced Features

### Audio Context Management
- **State Monitoring**: Automatic context state handling
- **Resume/Suspend**: Page visibility optimization
- **Memory Warnings**: Responsive to system constraints
- **Context Recovery**: Automatic reinitialization

### Sound Synthesis
When audio files fail to load, the system generates synthetic sounds:
- **Waveform Types**: Sine, triangle, sawtooth, square waves
- **Frequency Mapping**: Different tones for different actions
- **Envelope Shaping**: Natural attack/decay curves
- **Harmonic Content**: Rich, musical synthetic sounds

### Real-time Processing
- **Gain Automation**: Smooth volume transitions
- **Pitch Modulation**: Dynamic playback rate changes
- **Spatial Audio**: Stereo positioning (future feature)
- **Effects Chain**: Extensible audio processing pipeline

## API Reference

### SoundManager Methods

#### Core Playback
- `playSound(name, options)` - Play individual sound
- `playSequence(sounds, interval)` - Play sound sequence
- `stopAll()` - Stop all active sounds

#### Background Music
- `startBackgroundMusic(track, options)` - Start background music
- `stopBackgroundMusic(fadeOut)` - Stop background music
- `crossfadeToTrack(track, fadeTime)` - Crossfade to new track
- `duckBackgroundMusic(amount, duration)` - Temporarily lower music volume

#### System Control
- `initialize()` - Initialize audio system
- `updateSettings(settings)` - Update configuration
- `pauseAll()` - Pause all audio
- `resumeAll()` - Resume all audio
- `cleanup()` - Clean up resources

#### State Queries
- `isReady` - System initialization status
- `isBackgroundMusicPlaying` - Music playback status
- `loadedSounds` - Array of loaded sound names
- `activeSoundCount` - Number of currently playing sounds

## Troubleshooting

### Common Issues

**Background music doesn't start automatically**
- Browser autoplay policies require user interaction
- System automatically starts music after first user click/touch
- Check browser console for autoplay policy messages

**Sounds don't play**
- Verify sound files exist in `/assets/sounds/`
- Check browser Network tab for loading errors
- System will use synthetic fallbacks if files unavailable

**Audio stuttering or glitches**
- Reduce `maxConcurrentSounds` setting
- Enable performance mode
- Check for memory warnings in console

**Volume too low/high**
- Adjust individual volume settings in Redux store
- Check browser tab audio indicators
- Verify master gain settings

### Debug Information
Enable debug logging by opening browser developer tools:
```javascript
// In browser console
soundManager.settings.debug = true;
```

## Future Enhancements

### Planned Features
- **3D Spatial Audio**: Positional sound effects
- **Adaptive Music**: Dynamic music based on game state
- **Voice Processing**: Player voice chat integration
- **Audio Analytics**: Usage statistics and optimization
- **Custom Audio Filters**: User-configurable audio effects

### Extensibility
The sound system is designed for easy extension:
- **Plugin Architecture**: Add custom audio processors
- **Custom Sound Sources**: Integrate external audio APIs
- **Modular Components**: Swap out individual system parts
- **Configuration Presets**: Save/load audio configurations

## Contributing

When adding new sounds or features:

1. **Follow Naming Conventions**: Use descriptive, lowercase names
2. **Optimize File Sizes**: Use compressed audio formats
3. **Test Fallbacks**: Ensure synthetic sounds work as alternatives
4. **Update Documentation**: Add new features to this README
5. **Browser Testing**: Verify compatibility across browsers

## License & Credits

Sound system built for TicTac+ game. Uses modern Web Audio API with comprehensive fallback support.

For more information, see the main project documentation.