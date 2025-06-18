import authService from './authService';
import gameService from './gameService';

class PlayerService {
    constructor() {
        this.baseURL = '/api/players';
    }

    // Make authenticated request
    async makeRequest(url, options = {}) {
        try {
            return await authService.makeAuthenticatedRequest(url, options);
        } catch (error) {
            console.error('Player service request failed:', error);
            throw error;
        }
    }

    // Get player profile
    async getProfile() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/profile`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get player profile');
            }

            const data = await response.json();

            // Log the response to see what we're getting
            console.log('Profile API response:', JSON.stringify(data));

            // Ensure email is included in the player data
            const player = data.data.player;

            // If email is missing, try to get it from auth service
            if (!player.email) {
                const user = authService.getCurrentUser();
                if (user?.email) {
                    player.email = user.email;
                    console.log('Added email from auth service:', player.email);
                }
            }

            return player;
        } catch (error) {
            console.error('Get profile failed:', error);
            throw error;
        }
    }

    // Update player profile
    async updateProfile(profileData) {
        try {
            // Log the data being sent to the server for debugging
            console.log('Updating profile with data:', profileData);

            const response = await this.makeRequest(`${this.baseURL}/profile`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            console.log('Profile update response:', data);
            return data.data.player;
        } catch (error) {
            console.error('Update profile failed:', error);
            throw error;
        }
    }

    // Get player statistics
    async getPlayerStats() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/stats`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get player statistics');
            }

            const data = await response.json();
            return data.data.stats;
        } catch (error) {
            console.error('Get player stats failed:', error);
            throw error;
        }
    }

    // Get player game history
    async getGameHistory(page = 1, limit = 10) {
        try {
            const response = await this.makeRequest(
                `${this.baseURL}/game-history?page=${page}&limit=${limit}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error('Failed to get game history');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Get game history failed:', error);
            throw error;
        }
    }

    // Get combined player data (profile + stats)
    async getPlayerData() {
        try {
            const [profile, stats] = await Promise.all([
                this.getProfile(),
                this.getPlayerStats()
            ]);

            // Log the profile to see if email is included
            console.log('Profile from API in getPlayerData:', JSON.stringify(profile));

            // Get user from auth service to ensure we have email
            const user = authService.getCurrentUser();
            console.log('User from auth service:', user);

            // Create combined data with email
            const combinedData = {
                ...profile,
                // Ensure email is included, prioritize profile email then auth email
                email: profile.email || user?.email || '',
                stats: {
                    ...stats.basic,
                    ...stats.derived
                },
                recentGames: stats.recent || []
            };

            console.log('Combined player data:', JSON.stringify(combinedData));

            return combinedData;
        } catch (error) {
            console.error('Get player data failed:', error);

            // Fallback to local storage data if API fails
            const user = authService.getCurrentUser();
            return {
                id: user?.id || 'guest',
                username: user?.username || 'Guest',
                displayName: user?.displayName || 'Guest Player',
                email: user?.email || '', // Ensure email is included from the user object
                avatar: user?.avatar || null,
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    gamesLost: 0,
                    gamesDraw: 0,
                    winRate: 0,
                    rank: 'Novice',
                    elo: 1200,
                    winStreak: 0,
                    bestWinStreak: 0
                }
            };
        }
    }
}

// Create singleton instance
const playerService = new PlayerService();

export default playerService;