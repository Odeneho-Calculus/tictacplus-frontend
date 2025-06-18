import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { FaUser, FaTrophy, FaGamepad, FaClock, FaChartLine, FaCalendarAlt } from 'react-icons/fa';

// Redux actions
import { loadPlayerData, updateProfile } from '../../store/slices/playerSlice';

// Components
import {
  LoadingSpinner,
  Card,
  StatsCard,
  SecondaryButton,
  SuccessButton,
  NeonButton
} from '../../components/ui';

// Styles
import styles from './Profile.module.scss';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isSaving, error } = useSelector((state) => state.player);
  const player = useSelector((state) => state.player);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: '',
    avatar: null,
  });

  // Load player data when component mounts
  useEffect(() => {
    dispatch(loadPlayerData());
  }, [dispatch]);

  // Update form data when player data changes
  useEffect(() => {
    if (player) {
      // Log the player and user objects to see what data we have
      console.log('Player object in Profile component:', player);
      console.log('User object in Profile component:', user);

      // Get email from player or auth user
      const userEmail = player.email || user?.email || '';
      console.log('Email to display:', userEmail);

      setFormData({
        displayName: player.displayName || user?.displayName || 'Anonymous Player',
        email: userEmail,
        bio: player.bio || '',
        avatar: player.avatar || user?.avatar || null,
      });
    }
  }, [player, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatar,
        email: formData.email // Include email in the update
      })).unwrap();

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: player.displayName || user?.displayName || 'Anonymous Player',
      email: player.email || user?.email || '',
      bio: player.bio || '',
      avatar: player.avatar || user?.avatar || null,
    });
    setIsEditing(false);
  };

  // Extract stats from player data
  const stats = {
    totalGames: player?.stats?.gamesPlayed || 0,
    wins: player?.stats?.gamesWon || 0,
    losses: player?.stats?.gamesLost || 0,
    draws: player?.stats?.gamesDraw || 0,
    winRate: player?.stats?.winRate || 0,
    longestWinStreak: player?.stats?.bestWinStreak || 0,
    currentWinStreak: player?.stats?.winStreak || 0,
    averageGameTime: player?.stats?.averageGameTime || 0,
    favoriteMode: 'Multiplayer',
    rank: player?.stats?.rank || 'Novice',
    score: player?.stats?.elo || 1200,
    level: player?.stats?.level || 1
  };

  if (isLoading && !player) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile - TicTac+</title>
        <meta name="description" content="View and edit your TicTac+ profile and statistics" />
      </Helmet>

      <div className={styles.profile}>
        <motion.div
          className={styles.container}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.profileHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.avatarWrapper}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className={styles.avatar} />
                ) : (
                  <div className={styles.defaultAvatar}>
                    <FaUser />
                  </div>
                )}
                <div className={styles.avatarGlow}></div>
              </div>

              <div className={styles.nameAndRank}>
                <h1 className={styles.playerName}>{formData.displayName}</h1>
                <div className={styles.badges}>
                  <span className={styles.rank}>{stats.rank}</span>
                  <span className={styles.score}>{stats.score} pts</span>
                  <span className={styles.level}>Level {stats.level}</span>
                </div>
              </div>
            </div>

            <div className={styles.headerRight}>
              {!isEditing && (
                <NeonButton
                  onClick={() => setIsEditing(true)}
                  glowEffect
                  size="small"
                >
                  Edit Profile
                </NeonButton>
              )}
            </div>
          </div>

          <div className={styles.mainContent}>
            <div className={styles.profileSection}>
              <Card
                className={styles.profileCard}
                glassMorphism
                elevation="medium"
                variant="profile"
              >
                <h2 className={styles.sectionTitle}>Player Info</h2>

                {isEditing ? (
                  <div className={styles.editForm}>
                    <div className={styles.formGroup}>
                      <label htmlFor="displayName">Display Name</label>
                      <input
                        id="displayName"
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled={true}
                        className={`${styles.input} ${styles.disabled}`}
                      />
                      <small className={styles.helpText}>Email cannot be changed</small>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>

                    <div className={styles.actions}>
                      <SuccessButton
                        onClick={handleSave}
                        disabled={isSaving}
                        glowEffect
                      >
                        {isSaving ? <LoadingSpinner size="small" /> : 'Save Changes'}
                      </SuccessButton>
                      <SecondaryButton
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </SecondaryButton>
                    </div>
                  </div>
                ) : (
                  <div className={styles.profileDetails}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>
                        {formData.email || user?.email || 'No email provided'}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Bio</span>
                      <p className={styles.bio}>{formData.bio || 'No bio provided'}</p>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Joined</span>
                      <span className={styles.infoValue}>
                        <FaCalendarAlt className={styles.inlineIcon} />
                        {player?.createdAt ? new Date(player.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Favorite Mode</span>
                      <span className={styles.infoValue}>{stats.favoriteMode}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className={styles.statsSection}>
              <Card
                className={styles.statsOverview}
                glassMorphism
                elevation="medium"
                variant="stats"
              >
                <h2 className={styles.sectionTitle}>
                  <FaChartLine className={styles.sectionIcon} />
                  Statistics
                </h2>

                <div className={styles.statsHighlights}>
                  <div className={styles.statHighlight}>
                    <div className={styles.statIcon}>
                      <FaGamepad />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.totalGames}</span>
                      <span className={styles.statLabel}>Games</span>
                    </div>
                  </div>

                  <div className={styles.statHighlight}>
                    <div className={styles.statIcon}>
                      <FaTrophy />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.wins}</span>
                      <span className={styles.statLabel}>Wins</span>
                    </div>
                  </div>

                  <div className={styles.statHighlight}>
                    <div className={styles.statIcon}>
                      <FaClock />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>{stats.averageGameTime || 0}s</span>
                      <span className={styles.statLabel}>Avg. Time</span>
                    </div>
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  <StatsCard
                    value={stats.wins}
                    label="Wins"
                    variant="default"
                  />
                  <StatsCard
                    value={stats.losses}
                    label="Losses"
                    variant="danger"
                  />
                  <StatsCard
                    value={stats.draws}
                    label="Draws"
                    variant="default"
                  />
                  <StatsCard
                    value={`${stats.winRate}%`}
                    label="Win Rate"
                    variant="neon"
                  />
                  <StatsCard
                    value={stats.longestWinStreak}
                    label="Best Streak"
                    variant="default"
                  />
                  <StatsCard
                    value={stats.currentWinStreak}
                    label="Current Streak"
                    variant="default"
                  />
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Profile;