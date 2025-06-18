import React, { useState, useEffect, useRef } from 'react';
import { useSound } from '../../hooks/useSound';
import soundManager from '../../services/SoundManager';
import { SOUNDS } from '../../utils/constants';

/**
 * Advanced Sound Debug Panel
 * Provides comprehensive testing and debugging for the sound system
 */
const SoundDebugPanel = ({ isVisible = false }) => {
  const {
    playSound,
    startBackgroundMusic,
    stopBackgroundMusic,
    isEnabled,
    isMusicEnabled,
    isBackgroundMusicPlaying,
    isReady,
    loadedSounds,
    activeSoundCount,
    crossfadeToTrack,
    duckBackgroundMusic
  } = useSound();

  const [debugInfo, setDebugInfo] = useState({});
  const [testVolume, setTestVolume] = useState(0.7);
  const [testPlaybackRate, setTestPlaybackRate] = useState(1.0);
  const [sequenceInterval, setSequenceInterval] = useState(100);
  const [fadeTime, setFadeTime] = useState(2.0);
  const [isTestingSequence, setIsTestingSequence] = useState(false);
  const [logs, setLogs] = useState([]);
  const intervalRef = useRef(null);

  // Update debug info periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateDebugInfo = () => {
      const info = {
        soundManagerReady: soundManager.isReady,
        userInteracted: soundManager.isUserInteracted,
        audioContextState: soundManager.audioContext?.state || 'not initialized',
        loadedSounds: soundManager.loadedSounds,
        activeSoundCount: soundManager.activeSoundCount,
        backgroundMusicPlaying: soundManager.isBackgroundMusicPlaying,
        backgroundMusicLoaded: soundManager.soundBuffers.has('backgroundMusic'),
        activeBackgroundMusic: !!soundManager.activeBackgroundMusic,
        masterVolume: soundManager.settings.masterVolume,
        soundVolume: soundManager.settings.soundVolume,
        musicVolume: soundManager.settings.musicVolume,
        performanceMode: soundManager.performanceMode,
        fallbackEnabled: soundManager.fallbackEnabled,
        soundQueueLength: soundManager.soundQueue.length,
        isProcessingQueue: soundManager.isProcessingQueue,
        timestamp: new Date().toLocaleTimeString()
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { message, type, timestamp }]);
  };

  const testSound = async (soundName) => {
    addLog(`Testing sound: ${soundName}`, 'test');
    try {
      await playSound(soundName, {
        volume: testVolume,
        playbackRate: testPlaybackRate
      });
      addLog(`✓ ${soundName} played successfully`, 'success');
    } catch (error) {
      addLog(`✗ Failed to play ${soundName}: ${error.message}`, 'error');
    }
  };

  const testSoundSequence = async () => {
    if (isTestingSequence) return;

    setIsTestingSequence(true);
    addLog('Starting sound sequence test', 'test');

    const sequence = [
      { name: 'click', options: { volume: 0.5 } },
      { name: 'move', options: { volume: 0.6 } },
      { name: 'notification', options: { volume: 0.7 } }
    ];

    try {
      soundManager.playSequence(sequence, sequenceInterval);
      addLog('✓ Sound sequence started', 'success');

      // Reset testing state after sequence completes
      setTimeout(() => {
        setIsTestingSequence(false);
        addLog('Sound sequence completed', 'info');
      }, sequence.length * sequenceInterval + 1000);
    } catch (error) {
      addLog(`✗ Failed to play sequence: ${error.message}`, 'error');
      setIsTestingSequence(false);
    }
  };

  const testBackgroundMusic = async () => {
    try {
      // Get current state directly from sound manager
      const currentlyPlaying = soundManager.isBackgroundMusicPlaying;
      const hasActiveBgMusic = !!soundManager.activeBackgroundMusic;

      addLog(`Current state - Playing: ${currentlyPlaying}, Active: ${hasActiveBgMusic}`, 'info');

      if (currentlyPlaying || hasActiveBgMusic) {
        addLog('Stopping background music', 'test');
        await stopBackgroundMusic();
        // Give it a moment to fully stop
        await new Promise(resolve => setTimeout(resolve, 100));
        addLog('✓ Background music stopped', 'success');
      } else {
        addLog('Starting background music', 'test');
        await startBackgroundMusic();
        addLog('✓ Background music started', 'success');
      }
    } catch (error) {
      addLog(`✗ Background music operation failed: ${error.message}`, 'error');
    }
  };

  const testCrossfade = async () => {
    addLog('Testing crossfade (using same track)', 'test');
    try {
      await crossfadeToTrack('backgroundMusic', fadeTime);
      addLog('✓ Crossfade completed', 'success');
    } catch (error) {
      addLog(`✗ Crossfade failed: ${error.message}`, 'error');
    }
  };

  const testDucking = () => {
    addLog('Testing background music ducking', 'test');
    try {
      duckBackgroundMusic(0.5, 2.0);
      addLog('✓ Ducking applied', 'success');
    } catch (error) {
      addLog(`✗ Ducking failed: ${error.message}`, 'error');
    }
  };

  const initializeSoundSystem = async () => {
    addLog('Manually initializing sound system', 'test');
    try {
      await soundManager.initialize();
      addLog('✓ Sound system initialized', 'success');
    } catch (error) {
      addLog(`✗ Initialization failed: ${error.message}`, 'error');
    }
  };

  const preloadAllSounds = async () => {
    addLog('Preloading all sounds', 'test');
    try {
      await soundManager.preloadSounds();
      addLog('✓ All sounds preloaded', 'success');
    } catch (error) {
      addLog(`✗ Preloading failed: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  const exportDebugData = () => {
    const data = {
      debugInfo,
      logs,
      soundManagerSettings: soundManager.currentSettings,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sound-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('Debug data exported', 'info');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      overflow: 'auto',
      zIndex: 10000,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>🔊 Sound Debug Panel</h3>

      {/* System Status */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>System Status</h4>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px' }}>
          <div>Ready: {isReady ? '✅' : '❌'}</div>
          <div>Enabled: {isEnabled ? '✅' : '❌'}</div>
          <div>Music Enabled: {isMusicEnabled ? '✅' : '❌'}</div>
          <div>Background Music: {isBackgroundMusicPlaying ? '🎵' : '🔇'}</div>
          <div>Active Sounds: {activeSoundCount}</div>
          <div>Loaded Sounds: {loadedSounds.length}</div>
        </div>
      </div>

      {/* Advanced Debug Info */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>Advanced Info</h4>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px' }}>
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key}>
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </div>
          ))}
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>Test Controls</h4>

        {/* Volume Control */}
        <div style={{ marginBottom: '10px' }}>
          <label>Test Volume: {testVolume}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={testVolume}
            onChange={(e) => setTestVolume(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Playback Rate Control */}
        <div style={{ marginBottom: '10px' }}>
          <label>Playback Rate: {testPlaybackRate}</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={testPlaybackRate}
            onChange={(e) => setTestPlaybackRate(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* System Actions */}
        <div style={{ marginBottom: '10px' }}>
          <button onClick={initializeSoundSystem} style={buttonStyle}>
            Initialize System
          </button>
          <button onClick={preloadAllSounds} style={buttonStyle}>
            Preload Sounds
          </button>
        </div>

        {/* Individual Sound Tests */}
        <div style={{ marginBottom: '10px' }}>
          <h5 style={{ margin: '5px 0', color: '#FFC107' }}>Individual Sounds</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
            {Object.values(SOUNDS).map(sound => (
              <button
                key={sound}
                onClick={() => testSound(sound)}
                style={{ ...buttonStyle, fontSize: '10px', padding: '5px' }}
              >
                {sound}
              </button>
            ))}
          </div>
        </div>

        {/* Sequence Tests */}
        <div style={{ marginBottom: '10px' }}>
          <h5 style={{ margin: '5px 0', color: '#FFC107' }}>Sequence Tests</h5>
          <div style={{ marginBottom: '5px' }}>
            <label>Interval: {sequenceInterval}ms</label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={sequenceInterval}
              onChange={(e) => setSequenceInterval(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <button
            onClick={testSoundSequence}
            disabled={isTestingSequence}
            style={buttonStyle}
          >
            {isTestingSequence ? 'Playing...' : 'Test Sequence'}
          </button>
        </div>

        {/* Background Music Tests */}
        <div style={{ marginBottom: '10px' }}>
          <h5 style={{ margin: '5px 0', color: '#FFC107' }}>Background Music</h5>
          <button onClick={testBackgroundMusic} style={buttonStyle}>
            {isBackgroundMusicPlaying ? 'Stop' : 'Start'} Music
          </button>
          <button onClick={testDucking} style={buttonStyle}>
            Test Ducking
          </button>
          <div style={{ marginTop: '5px' }}>
            <label>Fade Time: {fadeTime}s</label>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={fadeTime}
              onChange={(e) => setFadeTime(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <button onClick={testCrossfade} style={buttonStyle}>
            Test Crossfade
          </button>
        </div>
      </div>

      {/* Logs */}
      <div>
        <h4 style={{ margin: '0 0 10px 0', color: '#9C27B0' }}>
          Logs
          <button onClick={clearLogs} style={{ ...buttonStyle, marginLeft: '10px', fontSize: '10px' }}>
            Clear
          </button>
          <button onClick={exportDebugData} style={{ ...buttonStyle, marginLeft: '5px', fontSize: '10px' }}>
            Export
          </button>
        </h4>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '10px',
          borderRadius: '5px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                color: log.type === 'error' ? '#f44336' :
                  log.type === 'success' ? '#4caf50' :
                    log.type === 'test' ? '#2196f3' : '#fff',
                fontSize: '11px',
                marginBottom: '2px'
              }}
            >
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const buttonStyle = {
  background: '#4CAF50',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  margin: '2px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px'
};

export default SoundDebugPanel;