import authService from './authService';
import { API_ENDPOINTS } from '../utils/constants';

class GameService {
    constructor() {
        this.baseURL = '/api/games';
        this.playerURL = '/api/players';
    }

    // Make authenticated request
    async makeRequest(url, options = {}) {
        try {
            return await authService.makeAuthenticatedRequest(url, options);
        } catch (error) {
            // If authentication fails, try without auth for some endpoints
            if (error.message === 'Authentication required' && options.allowUnauthenticated) {
                return fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
            }
            throw error;
        }
    }

    // Save game state
    async saveGameState(gameState) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/save-state`, {
                method: 'POST',
                body: JSON.stringify(gameState),
                allowUnauthenticated: true
            });

            if (!response.ok) {
                throw new Error('Failed to save game state');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Save game state failed:', error);
            throw error;
        }
    }

    // Load game state
    async loadGameState(gameId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/load-state/${gameId}`, {
                method: 'GET',
                allowUnauthenticated: true
            });

            if (!response.ok) {
                throw new Error('Failed to load game state');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Load game state failed:', error);
            throw error;
        }
    }

    // Check for saved game
    async checkSavedGame() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/check-saved`, {
                method: 'GET',
                allowUnauthenticated: true
            });

            if (!response.ok) {
                throw new Error('Failed to check saved game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Check saved game failed:', error);
            throw error;
        }
    }

    // Delete saved game
    async deleteSavedGame(gameId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/saved/${gameId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete saved game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete saved game failed:', error);
            throw error;
        }
    }

    // Create new game
    async createGame(gameConfig) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/create`, {
                method: 'POST',
                body: JSON.stringify(gameConfig)
            });

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Create game failed:', error);
            throw error;
        }
    }

    // Join game
    async joinGame(gameId, playerData = {}) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/join/${gameId}`, {
                method: 'POST',
                body: JSON.stringify(playerData)
            });

            if (!response.ok) {
                throw new Error('Failed to join game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Join game failed:', error);
            throw error;
        }
    }

    // Get game details
    async getGame(gameId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/${gameId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get game failed:', error);
            throw error;
        }
    }

    // Make move
    async makeMove(gameId, moveData) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/${gameId}/move`, {
                method: 'POST',
                body: JSON.stringify(moveData)
            });

            if (!response.ok) {
                throw new Error('Failed to make move');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Make move failed:', error);
            throw error;
        }
    }

    // Leave game
    async leaveGame(gameId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/${gameId}/leave`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to leave game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Leave game failed:', error);
            throw error;
        }
    }

    // Spectate game
    async spectateGame(gameId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/${gameId}/spectate`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to spectate game');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Spectate game failed:', error);
            throw error;
        }
    }

    // Get active games
    async getActiveGames(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${this.baseURL}/active${queryParams ? `?${queryParams}` : ''}`;

            const response = await this.makeRequest(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get active games');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get active games failed:', error);
            throw error;
        }
    }

    // Get game history
    async getGameHistory(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `${this.baseURL}/history${queryParams ? `?${queryParams}` : ''}`;

            const response = await this.makeRequest(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get game history');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get game history failed:', error);
            throw error;
        }
    }

    // Find match (matchmaking)
    async findMatch(preferences = {}) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/find-match`, {
                method: 'POST',
                body: JSON.stringify(preferences)
            });

            if (!response.ok) {
                throw new Error('Failed to find match');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Find match failed:', error);
            throw error;
        }
    }

    // Cancel matchmaking
    async cancelMatchmaking() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/cancel-match`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to cancel matchmaking');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Cancel matchmaking failed:', error);
            throw error;
        }
    }

    // Get player stats
    async getPlayerStats(playerId) {
        try {
            const response = await this.makeRequest(`/api/players/${playerId}/stats`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get player stats');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get player stats failed:', error);
            throw error;
        }
    }

    // Get leaderboard
    async getLeaderboard(type = 'elo', limit = 10) {
        try {
            const response = await this.makeRequest(`/api/leaderboard?type=${type}&limit=${limit}`, {
                method: 'GET',
                allowUnauthenticated: true
            });

            if (!response.ok) {
                throw new Error('Failed to get leaderboard');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get leaderboard failed:', error);
            throw error;
        }
    }

    // Get online players
    async getOnlinePlayers() {
        try {
            const response = await this.makeRequest(`${this.playerURL}/online`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get online players');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get online players failed:', error);
            throw error;
        }
    }

    // Send game invitation
    async sendGameInvitation(inviteData) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/invite`, {
                method: 'POST',
                body: JSON.stringify(inviteData)
            });

            if (!response.ok) {
                throw new Error('Failed to send game invitation');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Send game invitation failed:', error);
            throw error;
        }
    }

    // Accept game invitation
    async acceptGameInvitation(invitationId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/invite/${invitationId}/accept`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to accept game invitation');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Accept game invitation failed:', error);
            throw error;
        }
    }

    // Decline game invitation
    async declineGameInvitation(invitationId) {
        try {
            const response = await this.makeRequest(`${this.baseURL}/invite/${invitationId}/decline`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to decline game invitation');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Decline game invitation failed:', error);
            throw error;
        }
    }

    // Get matchmaking queue info
    async getMatchmakingQueueInfo() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/queue-info`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get matchmaking queue info');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get matchmaking queue info failed:', error);
            throw error;
        }
    }

    // Get pending invitations
    async getPendingInvitations() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/invitations`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Failed to get pending invitations');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get pending invitations failed:', error);
            throw error;
        }
    }
}

// Create singleton instance
const gameService = new GameService();

export { gameService };
export default gameService;