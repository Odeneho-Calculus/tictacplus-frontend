import { STORAGE_KEYS } from './constants';

/**
 * Generate a unique device ID for guest authentication
 * Backend requires deviceId to be 10-100 characters
 * @returns {string} Device ID
 */
export const generateDeviceId = () => {
    // Check if we already have a device ID stored
    const existingDeviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (existingDeviceId && existingDeviceId.length >= 10 && existingDeviceId.length <= 100) {
        return existingDeviceId;
    }

    // Generate new device ID that meets backend requirements (10-100 characters)
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const browserInfo = getBrowserFingerprint();

    // Ensure minimum length of 10 characters
    let deviceId = `device_${timestamp}_${randomPart}_${browserInfo}`;

    // If too short, add more random characters
    while (deviceId.length < 10) {
        deviceId += Math.random().toString(36).substring(2, 5);
    }

    // If too long, truncate to 100 characters
    if (deviceId.length > 100) {
        deviceId = deviceId.substring(0, 100);
    }

    // Store it for future use
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);

    return deviceId;
};

/**
 * Get a simple browser fingerprint for device identification
 * @returns {string} Browser fingerprint
 */
const getBrowserFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36).substring(0, 8);
};

/**
 * Get device information for analytics
 * @returns {object} Device information
 */
export const getDeviceInfo = () => {
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
        deviceMemory: navigator.deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    };
};

/**
 * Check if device supports required features
 * @returns {object} Feature support information
 */
export const checkDeviceCapabilities = () => {
    return {
        localStorage: typeof (Storage) !== 'undefined',
        sessionStorage: typeof (Storage) !== 'undefined',
        webSocket: typeof (WebSocket) !== 'undefined',
        webWorker: typeof (Worker) !== 'undefined',
        canvas: !!document.createElement('canvas').getContext,
        webGL: !!document.createElement('canvas').getContext('webgl'),
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        geolocation: 'geolocation' in navigator,
        notification: 'Notification' in window,
        serviceWorker: 'serviceWorker' in navigator
    };
};

/**
 * Get stored device ID
 * @returns {string|null} Device ID or null if not found
 */
export const getStoredDeviceId = () => {
    return localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
};

/**
 * Clear stored device ID (for logout/reset)
 */
export const clearDeviceId = () => {
    localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
};

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if device is tablet
 * @returns {boolean} True if tablet device
 */
export const isTabletDevice = () => {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
};

/**
 * Get device type
 * @returns {string} Device type: 'mobile', 'tablet', or 'desktop'
 */
export const getDeviceType = () => {
    if (isMobileDevice()) return 'mobile';
    if (isTabletDevice()) return 'tablet';
    return 'desktop';
};

/**
 * Check if device has touch support
 * @returns {boolean} True if touch is supported
 */
export const hasTouchSupport = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get network information if available
 * @returns {object} Network information
 */
export const getNetworkInfo = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
        return {
            effectiveType: 'unknown',
            downlink: 'unknown',
            rtt: 'unknown',
            saveData: false
        };
    }

    return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 'unknown',
        rtt: connection.rtt || 'unknown',
        saveData: connection.saveData || false
    };
};

export default {
    generateDeviceId,
    getDeviceInfo,
    checkDeviceCapabilities,
    getStoredDeviceId,
    clearDeviceId,
    isMobileDevice,
    isTabletDevice,
    getDeviceType,
    hasTouchSupport,
    getNetworkInfo
};