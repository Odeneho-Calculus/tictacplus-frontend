import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { showError } from '../store/slices/uiSlice';
import { gameService } from '../services/gameService';

/**
 * Custom hook to fetch and manage online players
 * @returns {Object} - Online players data and functions
 */
export const useOnlinePlayers = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();

    /**
     * Fetch online players from the API
     */
    const fetchPlayers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameService.getOnlinePlayers();

            if (response && response.data) {
                // Process player data
                const processedPlayers = response.data.map(player => {
                    // Calculate win rate
                    const gamesPlayed = player.stats?.gamesPlayed || 0;
                    const gamesWon = player.stats?.gamesWon || 0;
                    const winRate = gamesPlayed > 0
                        ? Math.round((gamesWon / gamesPlayed) * 100)
                        : 0;

                    return {
                        ...player,
                        winRate
                    };
                });

                setPlayers(processedPlayers);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching online players:', err);
            setError(err.message || 'Failed to load online players');

            // Check if it's an authentication error
            if (err.message === 'Authentication required' || err.status === 401) {
                dispatch(showError('Please log in to view online players.'));
            } else {
                dispatch(showError('Failed to load online players. Please try again.'));
            }
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Initial fetch
    useEffect(() => {
        fetchPlayers();

        // Set up polling interval
        const interval = setInterval(() => {
            fetchPlayers();
        }, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [fetchPlayers]);

    return {
        players,
        loading,
        error,
        refreshPlayers: fetchPlayers
    };
};