/**
 * Date and time utility functions for the Tic-Tac-Plus game
 */

/**
 * Format a date to a readable string
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return dateObj.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format a time duration in seconds to a readable string
 * @param {number} seconds - Duration in seconds
 * @param {boolean} showSeconds - Whether to show seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds, showSeconds = true) => {
  if (typeof seconds !== 'number' || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return showSeconds
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  return showSeconds
    ? `${minutes}:${secs.toString().padStart(2, '0')}`
    : `${minutes}m`;
};

/**
 * Format a duration in milliseconds to a readable string
 * @param {number} milliseconds - Duration in milliseconds
 * @param {boolean} showSeconds - Whether to show seconds
 * @returns {string} Formatted time string
 */
export const formatDuration = (milliseconds, showSeconds = true) => {
  return formatTime(Math.floor(milliseconds / 1000), showSeconds);
};

/**
 * Get relative time string (e.g., "2 minutes ago", "in 5 hours")
 * @param {Date|string|number} date - The date to compare
 * @param {Date|string|number} baseDate - The base date to compare against (default: now)
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date, baseDate = new Date()) => {
  if (!date) return 'Unknown';

  const dateObj = new Date(date);
  const baseDateObj = new Date(baseDate);

  if (isNaN(dateObj.getTime()) || isNaN(baseDateObj.getTime())) {
    return 'Invalid Date';
  }

  const diffMs = dateObj.getTime() - baseDateObj.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffSeconds < 60) {
    return diffSeconds < 5 ? 'just now' : `${prefix}${diffSeconds} second${diffSeconds !== 1 ? 's' : ''}${suffix}`;
  } else if (diffMinutes < 60) {
    return `${prefix}${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}${suffix}`;
  } else if (diffHours < 24) {
    return `${prefix}${diffHours} hour${diffHours !== 1 ? 's' : ''}${suffix}`;
  } else if (diffDays < 7) {
    return `${prefix}${diffDays} day${diffDays !== 1 ? 's' : ''}${suffix}`;
  } else if (diffWeeks < 4) {
    return `${prefix}${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}${suffix}`;
  } else if (diffMonths < 12) {
    return `${prefix}${diffMonths} month${diffMonths !== 1 ? 's' : ''}${suffix}`;
  } else {
    return `${prefix}${diffYears} year${diffYears !== 1 ? 's' : ''}${suffix}`;
  }
};

/**
 * Check if a date is today
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  const dateObj = new Date(date);
  const today = new Date();

  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is yesterday
 */
export const isYesterday = (date) => {
  if (!date) return false;

  const dateObj = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Check if a date is tomorrow
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is tomorrow
 */
export const isTomorrow = (date) => {
  if (!date) return false;

  const dateObj = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return dateObj.toDateString() === tomorrow.toDateString();
};

/**
 * Format a date with relative context (today, yesterday, etc.)
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string with context
 */
export const formatDateWithContext = (date, options = {}) => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  if (isToday(date)) {
    return `Today at ${dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    })}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    })}`;
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    })}`;
  } else {
    return formatDate(date, options);
  }
};

/**
 * Get the start of day for a given date
 * @param {Date|string|number} date - The date
 * @returns {Date} Start of day
 */
export const getStartOfDay = (date = new Date()) => {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Get the end of day for a given date
 * @param {Date|string|number} date - The date
 * @returns {Date} End of day
 */
export const getEndOfDay = (date = new Date()) => {
  const dateObj = new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Add time to a date
 * @param {Date|string|number} date - The base date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit of time ('seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years')
 * @returns {Date} New date with added time
 */
export const addTime = (date, amount, unit) => {
  const dateObj = new Date(date);

  switch (unit) {
    case 'seconds':
      dateObj.setSeconds(dateObj.getSeconds() + amount);
      break;
    case 'minutes':
      dateObj.setMinutes(dateObj.getMinutes() + amount);
      break;
    case 'hours':
      dateObj.setHours(dateObj.getHours() + amount);
      break;
    case 'days':
      dateObj.setDate(dateObj.getDate() + amount);
      break;
    case 'weeks':
      dateObj.setDate(dateObj.getDate() + (amount * 7));
      break;
    case 'months':
      dateObj.setMonth(dateObj.getMonth() + amount);
      break;
    case 'years':
      dateObj.setFullYear(dateObj.getFullYear() + amount);
      break;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }

  return dateObj;
};

/**
 * Subtract time from a date
 * @param {Date|string|number} date - The base date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit of time
 * @returns {Date} New date with subtracted time
 */
export const subtractTime = (date, amount, unit) => {
  return addTime(date, -amount, unit);
};

/**
 * Get the difference between two dates in specified unit
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @param {string} unit - Unit to return difference in
 * @returns {number} Difference in specified unit
 */
export const getTimeDifference = (date1, date2, unit = 'milliseconds') => {
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);

  const diffMs = dateObj1.getTime() - dateObj2.getTime();

  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'weeks':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'months':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    case 'years':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
};

/**
 * Format a countdown timer
 * @param {number} seconds - Seconds remaining
 * @param {boolean} showHours - Whether to show hours
 * @returns {string} Formatted countdown string
 */
export const formatCountdown = (seconds, showHours = false) => {
  if (seconds <= 0) return showHours ? '00:00:00' : '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (showHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Check if a date is in the past
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
};

/**
 * Check if a date is in the future
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false;
  return new Date(date).getTime() > Date.now();
};

/**
 * Get timezone offset in hours
 * @param {Date} date - The date to get timezone for
 * @returns {number} Timezone offset in hours
 */
export const getTimezoneOffset = (date = new Date()) => {
  return -date.getTimezoneOffset() / 60;
};

/**
 * Convert UTC date to local time
 * @param {Date|string|number} utcDate - UTC date
 * @returns {Date} Local date
 */
export const utcToLocal = (utcDate) => {
  const date = new Date(utcDate);
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
};

/**
 * Convert local date to UTC
 * @param {Date|string|number} localDate - Local date
 * @returns {Date} UTC date
 */
export const localToUtc = (localDate) => {
  const date = new Date(localDate);
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
};