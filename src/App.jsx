import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// Lazy load pages for code splitting
const Home = React.lazy(() => import('./pages/Home/Home'));
const Game = React.lazy(() => import('./pages/Game/Game'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard/Leaderboard'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const Login = React.lazy(() => import('./pages/Login/Login'));
const MatchmakingPage = React.lazy(() => import('./pages/MatchmakingPage/MatchmakingPage'));

// Components
import LoadingSpinner from './components/ui/LoadingSpinner/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary/ErrorBoundary';
import Navigation from './components/ui/Navigation/Navigation';
import ParticleBackground from './components/ui/ParticleBackground/ParticleBackground';
import { BackgroundMusic, AutoMusicStarter, AutoClickStarter } from './components/audio';
import SoundDebugPanel from './components/debug/SoundDebugPanel';
import { GameInvitationList } from './components/game/GameInvitation/GameInvitation';
import AuthGuard from './components/auth/AuthGuard/AuthGuard';

// Hooks
import { useSocket } from './hooks/useSocket';
import { useSound } from './hooks/useSound';

// Store
import { initializeApp } from './store/slices/uiSlice';
import { loadPlayerData } from './store/slices/playerSlice';
import { loadStoredAuth } from './store/slices/authSlice';
import { checkSavedGame } from './store/slices/gameSlice';

// Styles
import styles from './App.module.scss';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, isInitialized } = useSelector((state) => state.ui);
  const { isConnected } = useSelector((state) => state.socket);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [showSoundDebug, setShowSoundDebug] = React.useState(false);

  // Initialize socket connection
  useSocket();

  // Initialize sound system
  useSound();

  // Global handler for match found events
  useEffect(() => {
    // Check for pending game redirect on app load
    const pendingGameId = localStorage.getItem('pendingGameRedirect');
    if (pendingGameId) {
      console.log('App: Found pending game redirect:', pendingGameId);
      localStorage.removeItem('pendingGameRedirect');
      navigate(`/game/${pendingGameId}`);
    }

    // Listen for match found redirect events
    const handleMatchFoundRedirect = (e) => {
      if (e && e.detail && e.detail.type === 'game/matchFoundRedirect') {
        const gameId = e.detail.payload;
        console.log('App: Received match found redirect event:', gameId);
        navigate(`/game/${gameId}`);
      }
    };

    window.addEventListener('game/matchFoundRedirect', handleMatchFoundRedirect);

    return () => {
      window.removeEventListener('game/matchFoundRedirect', handleMatchFoundRedirect);
    };
  }, [navigate]);

  useEffect(() => {
    // Initialize app
    dispatch(initializeApp());
    dispatch(loadPlayerData());
    dispatch(loadStoredAuth());
  }, [dispatch]);

  // Check for saved games after authentication is loaded
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(checkSavedGame());
    }
  }, [dispatch, isAuthenticated, user]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Debug panel keyboard shortcut (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyPress = (event) => {
      // Ctrl+Shift+S to toggle sound debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setShowSoundDebug(prev => !prev);
        console.log('Sound debug panel:', !showSoundDebug ? 'opened' : 'closed');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showSoundDebug]);

  if (!isInitialized) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`${styles.app} ${styles[theme]}`}>
        <Helmet>
          <title>TicTac+ | Advanced AAA-Style Tic Tac Toe Game</title>
          <meta name="description" content="Experience the ultimate Tic Tac Toe game with stunning animations, real-time multiplayer, and advanced AI opponents." />
        </Helmet>

        {/* Advanced Navigation */}
        <Navigation />

        {/* Particle background for visual appeal - temporarily disabled for performance */}
        {/* <ParticleBackground /> */}

        {/* Global background music */}
        <BackgroundMusic />
        <AutoMusicStarter />
        <AutoClickStarter />

        {/* Main application routes */}
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingSpinner size="large" />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* Protected routes */}
              <Route path="/game" element={
                <AuthGuard>
                  <Game />
                </AuthGuard>
              } />
              <Route path="/game/:gameId" element={
                <AuthGuard>
                  <Game />
                </AuthGuard>
              } />
              <Route path="/matchmaking" element={
                <AuthGuard>
                  <MatchmakingPage />
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              } />
              <Route path="/profile/:userId" element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>

        {/* Global Game Invitations */}
        <GameInvitationList position="top-right" />

        {/* Development Debug Panel */}
        {process.env.NODE_ENV === 'development' && (
          <SoundDebugPanel isVisible={showSoundDebug} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;