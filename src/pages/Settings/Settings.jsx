import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { saveSettings } from '../../store/slices/settingsSlice';

// Components
import { Card, PrimaryButton, SecondaryButton, DangerButton } from '../../components/ui';

// Hooks
import { useSound } from '../../hooks/useSound';

// Styles
import styles from './Settings.module.scss';

const Settings = () => {
    const dispatch = useDispatch();
    const settings = useSelector((state) => state.settings);
    const { playSound } = useSound();

    const [localSettings, setLocalSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const categoryRefs = useRef({});

    // Initialize refs for each category
    useEffect(() => {
        settingsCategories.forEach(category => {
            categoryRefs.current[category.id] = React.createRef();
        });
    }, []);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        const hasChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
        setHasChanges(hasChanged);
    }, [localSettings, settings]);

    const handleSettingChange = (category, key, value) => {
        // Directly update the setting in the flat structure to match Redux store
        setLocalSettings(prev => ({
            ...prev,
            [key]: value,
            lastUpdated: Date.now()
        }));
    };

    const handleSave = () => {
        // Actually save settings to Redux and localStorage
        dispatch({ type: 'settings/updateSettings', payload: localSettings });

        // Also dispatch the saveSettings thunk to persist to localStorage
        dispatch(saveSettings(localSettings));

        playSound('success');
        toast.success('Settings saved successfully!', {
            icon: '✅',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
        setHasChanges(false);
    };

    const handleReset = () => {
        // Show a more stylized confirmation dialog
        if (window.confirm('⚠️ Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            // Dispatch reset action
            dispatch({ type: 'settings/resetSettings' });

            // Also save the reset settings to localStorage
            dispatch(saveSettings({}));

            playSound('alert');
            toast.success('Settings reset to default!', {
                icon: '🔄',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

            // Update local state to match the reset settings
            setLocalSettings(settings);
        }
    };

    const handleCancel = () => {
        playSound('cancel');
        setLocalSettings(settings);
    };

    const scrollToCategory = (categoryId) => {
        if (categoryRefs.current[categoryId] && categoryRefs.current[categoryId].current) {
            categoryRefs.current[categoryId].current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            setActiveCategory(categoryId);

            // Reset active category after animation completes
            setTimeout(() => {
                setActiveCategory(null);
            }, 2000);
        }
    };

    // Enhanced settings categories with more options
    const settingsCategories = [
        {
            id: 'game',
            title: 'Game Settings',
            icon: '🎮',
            settings: [
                {
                    key: 'difficulty',
                    label: 'Default AI Difficulty',
                    type: 'select',
                    options: [
                        { value: 'easy', label: 'Easy' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'hard', label: 'Hard' },
                        { value: 'expert', label: 'Expert' }
                    ],
                    description: 'Default difficulty level for AI opponents'
                },
                {
                    key: 'autoSave',
                    label: 'Auto Save Games',
                    type: 'toggle',
                    description: 'Automatically save game progress'
                },
                {
                    key: 'showHints',
                    label: 'Show Move Hints',
                    type: 'toggle',
                    description: 'Display helpful hints during gameplay'
                },
                {
                    key: 'boardSize',
                    label: 'Board Size',
                    type: 'select',
                    options: [
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }
                    ],
                    description: 'Set the size of the game board'
                }
            ]
        },
        {
            id: 'display',
            title: 'Display Settings',
            icon: '🎨',
            settings: [
                {
                    key: 'theme',
                    label: 'Theme',
                    type: 'select',
                    options: [
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'neon', label: 'Neon' },
                        { value: 'auto', label: 'Auto (System)' }
                    ],
                    description: 'Choose your preferred color theme'
                },
                {
                    key: 'animations',
                    label: 'Enable Animations',
                    type: 'toggle',
                    description: 'Show smooth animations and transitions'
                },
                {
                    key: 'particles',
                    label: 'Background Particles',
                    type: 'toggle',
                    description: 'Show animated particles in the background'
                },
                {
                    key: 'effectsIntensity',
                    label: 'Visual Effects Intensity',
                    type: 'range',
                    min: 0,
                    max: 100,
                    step: 10,
                    description: 'Adjust the intensity of visual effects'
                }
            ]
        },
        {
            id: 'audio',
            title: 'Audio Settings',
            icon: '🔊',
            settings: [
                {
                    key: 'masterVolume',
                    label: 'Master Volume',
                    type: 'range',
                    min: 0,
                    max: 100,
                    step: 5,
                    description: 'Overall volume level'
                },
                {
                    key: 'musicVolume',
                    label: 'Music Volume',
                    type: 'range',
                    min: 0,
                    max: 100,
                    step: 5,
                    description: 'Background music volume'
                },
                {
                    key: 'soundEffects',
                    label: 'Sound Effects',
                    type: 'toggle',
                    description: 'Play sound effects during gameplay'
                },
                {
                    key: 'ambientSounds',
                    label: 'Ambient Sounds',
                    type: 'toggle',
                    description: 'Play ambient background sounds'
                }
            ]
        },
        {
            id: 'accessibility',
            title: 'Accessibility',
            icon: '♿',
            settings: [
                {
                    key: 'highContrast',
                    label: 'High Contrast Mode',
                    type: 'toggle',
                    description: 'Increase contrast for better visibility'
                },
                {
                    key: 'largeText',
                    label: 'Large Text',
                    type: 'toggle',
                    description: 'Increase text size throughout the app'
                },
                {
                    key: 'reducedMotion',
                    label: 'Reduced Motion',
                    type: 'toggle',
                    description: 'Minimize animations and motion effects'
                },
                {
                    key: 'screenReader',
                    label: 'Screen Reader Support',
                    type: 'toggle',
                    description: 'Enhanced support for screen readers'
                }
            ]
        }
    ];

    const renderSetting = (category, setting) => {
        // Get value directly from the flat structure
        const value = localSettings[setting.key] !== undefined ?
            localSettings[setting.key] :
            (setting.type === 'toggle' ? false :
                setting.type === 'range' ? 50 :
                    setting.options?.[0]?.value || '');

        switch (setting.type) {
            case 'toggle':
                return (
                    <label className={styles.toggleContainer} aria-label={`${setting.label} - ${value ? 'Enabled' : 'Disabled'}`}>
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => {
                                playSound('buttonClick');
                                handleSettingChange(category.id, setting.key, e.target.checked);
                            }}
                            className={styles.toggleInput}
                            aria-hidden="true"
                        />
                        <span className={styles.toggleSlider}></span>
                    </label>
                );

            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => {
                            playSound('buttonClick');
                            handleSettingChange(category.id, setting.key, e.target.value);
                        }}
                        className={styles.select}
                        aria-label={setting.label}
                    >
                        {setting.options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'range':
                return (
                    <div className={styles.rangeContainer}>
                        <input
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={value}
                            onChange={(e) => {
                                playSound('buttonClick');
                                handleSettingChange(category.id, setting.key, parseInt(e.target.value));
                            }}
                            className={styles.range}
                            aria-label={`${setting.label}: ${value}%`}
                            aria-valuemin={setting.min}
                            aria-valuemax={setting.max}
                            aria-valuenow={value}
                            style={{ '--range-progress': `${value}%` }}
                        />
                        <span className={styles.rangeValue}>{value}%</span>
                    </div>
                );

            default:
                return null;
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    const pulseVariants = {
        pulse: {
            scale: [1, 1.03, 1],
            boxShadow: [
                '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 212, 255, 0.3)',
                '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 255, 0.5)',
                '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 212, 255, 0.3)'
            ],
            transition: {
                duration: 1.5,
                repeat: 2,
                repeatType: 'reverse'
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Settings - TicTac+</title>
                <meta name="description" content="Customize your TicTac+ experience with these settings" />
            </Helmet>

            <div className={styles.settings} role="main">
                <motion.div
                    className={styles.container}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className={styles.header} variants={itemVariants}>
                        <motion.h1
                            className={styles.title}
                            data-text="Settings"
                            animate={{
                                textShadow: [
                                    '0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(255, 0, 110, 0.3)',
                                    '0 0 40px rgba(0, 212, 255, 0.6), 0 0 80px rgba(255, 0, 110, 0.4)',
                                    '0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(255, 0, 110, 0.3)'
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'reverse'
                            }}
                        >
                            Settings
                        </motion.h1>
                        <motion.p
                            className={styles.subtitle}
                            variants={itemVariants}
                        >
                            Customize your TicTac+ experience
                        </motion.p>
                    </motion.div>

                    {/* Category Navigation */}
                    <motion.div
                        className={styles.categoriesNav}
                        variants={itemVariants}
                    >
                        {settingsCategories.map((category) => (
                            <motion.div
                                key={category.id}
                                className={styles.categoryButtonWrapper}
                            >
                                <SecondaryButton
                                    className={styles.categoryButton}
                                    onClick={() => {
                                        playSound('buttonClick');
                                        scrollToCategory(category.id);
                                    }}
                                    icon={
                                        <motion.span
                                            animate={activeCategory === category.id ? { scale: [1, 1.2, 1] } : {}}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {category.icon}
                                        </motion.span>
                                    }
                                    glassMorphism
                                    aria-label={`Go to ${category.title}`}
                                >
                                    <span className={styles.categoryTitle}>{category.title}</span>
                                </SecondaryButton>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className={styles.settingsContent}>
                        {settingsCategories.map((category) => (
                            <Card
                                key={category.id}
                                ref={categoryRefs.current[category.id]}
                                className={styles.category}
                                variant="feature"
                                glassMorphism
                                elevation="high"
                                variants={activeCategory === category.id ? pulseVariants : itemVariants}
                                animate={activeCategory === category.id ? 'pulse' : 'visible'}
                                id={category.id}
                            >
                                <div className={styles.categoryHeader}>
                                    <motion.span
                                        className={styles.categoryIcon}
                                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, -5, 5, 0] }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {category.icon}
                                    </motion.span>
                                    <h2 className={styles.categoryTitle}>{category.title}</h2>
                                </div>

                                <div className={styles.settingsList}>
                                    {category.settings.map((setting, index) => (
                                        <motion.div
                                            key={setting.key}
                                            className={styles.settingItem}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <div className={styles.settingInfo}>
                                                <label
                                                    className={styles.settingLabel}
                                                    htmlFor={`${category.id}-${setting.key}`}
                                                >
                                                    {setting.label}
                                                </label>
                                                <p className={styles.settingDescription}>
                                                    {setting.description}
                                                </p>
                                            </div>
                                            <div className={styles.settingControl} id={`${category.id}-${setting.key}`}>
                                                {renderSetting(category, setting)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <AnimatePresence>
                        {hasChanges && (
                            <motion.div
                                className={styles.actionBar}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <motion.p
                                    className={styles.changesText}
                                    animate={{
                                        opacity: [0.7, 1, 0.7],
                                        scale: [1, 1.02, 1]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: 'reverse'
                                    }}
                                >
                                    You have unsaved changes
                                </motion.p>
                                <div className={styles.actions}>
                                    <SecondaryButton
                                        onClick={handleCancel}
                                        aria-label="Cancel changes"
                                    >
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton
                                        onClick={handleSave}
                                        glowEffect
                                        aria-label="Save all changes"
                                    >
                                        Save Changes
                                    </PrimaryButton>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Card
                        className={styles.dangerZone}
                        variant="neon"
                        neonBorder
                        variants={itemVariants}
                    >
                        <motion.h3
                            className={styles.dangerTitle}
                            animate={{
                                textShadow: [
                                    '0 0 15px rgba(239, 68, 68, 0.3)',
                                    '0 0 25px rgba(239, 68, 68, 0.5)',
                                    '0 0 15px rgba(239, 68, 68, 0.3)'
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'reverse'
                            }}
                        >
                            Danger Zone
                        </motion.h3>
                        <p className={styles.dangerDescription}>
                            These actions cannot be undone. Please be careful.
                        </p>
                        <DangerButton
                            onClick={handleReset}
                            size="large"
                            glowEffect
                            aria-label="Reset all settings to default values"
                        >
                            Reset All Settings
                        </DangerButton>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default Settings;