import { STORAGE_KEYS, API_ENDPOINTS, VALIDATION } from '../utils/constants';
import { generateDeviceId } from '../utils/deviceUtils';

class AuthService {
  constructor() {
    this.baseURL = '/api/auth';
    this.token = this.getStoredToken();
    this.refreshToken = this.getStoredRefreshToken();
  }

  // Token management
  getStoredToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  getStoredRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !this.isTokenExpired();
  }

  // Check if token is expired
  isTokenExpired() {
    if (!this.token) return true;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  // Validate token with server
  async validateToken() {
    if (!this.token) return false;

    // First check local expiration
    if (this.isTokenExpired()) {
      return false;
    }

    try {
      // Verify with server
      const response = await fetch(`${this.baseURL}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Get current user from token with enhanced name handling
  getCurrentUser() {
    if (!this.token) return null;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));

      // Enhanced user object with proper name fallbacks
      return {
        id: payload.id,
        username: payload.username || `Guest_${Date.now().toString().slice(-6)}`,
        displayName: payload.displayName || payload.username || 'Guest Player',
        email: payload.email,
        exp: payload.exp
      };
    } catch (error) {
      return null;
    }
  }

  // Format validation errors from backend
  formatValidationError(errorData) {
    if (errorData.details && errorData.details.errors && errorData.details.errors.length > 0) {
      const fieldErrors = errorData.details.errors.map(err => `${err.field}: ${err.message}`);
      return fieldErrors.join('\n');
    }
    return errorData.message || 'Validation failed';
  }

  // Register user
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();

      if (data.status === 'success') {
        this.setTokens(data.data.token, data.data.refreshToken);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }

      throw new Error(data.message || 'Registration failed');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (data.status === 'success') {
        this.setTokens(data.data.token, data.data.refreshToken);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }

      throw new Error(data.message || 'Login failed');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.baseURL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Refresh token
  async refreshAuthToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.status === 'success') {
        this.setTokens(data.data.token, data.data.refreshToken);
        return data.data.token;
      }

      throw new Error(data.message || 'Token refresh failed');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Get device ID for guest authentication (deprecated - use generateDeviceId instead)
  getDeviceId() {
    return generateDeviceId();
  }

  // Get authorization header
  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }

  // Make authenticated request
  async makeAuthenticatedRequest(url, options = {}) {
    // Ensure we have a valid token
    if (this.isTokenExpired() && this.refreshToken) {
      try {
        await this.refreshAuthToken();
      } catch (error) {
        throw new Error('Authentication required');
      }
    }

    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token expiration
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAuthToken();
        // Retry the request with new token
        headers.Authorization = `Bearer ${this.token}`;
        return fetch(url, { ...options, headers });
      } catch (refreshError) {
        this.clearTokens();
        throw new Error('Authentication required');
      }
    }

    return response;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;