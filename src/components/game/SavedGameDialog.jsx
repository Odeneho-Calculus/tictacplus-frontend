import React from 'react';
import { useDispatch } from 'react-redux';
import { restoreGameState, clearSavedGame } from '../../store/slices/gameSlice';
import { Modal, Button, DangerButton } from '../ui';
import './SavedGameDialog.css';

const SavedGameDialog = ({ isOpen, onClose, savedGameState }) => {
    const dispatch = useDispatch();

    const handleRestoreGame = () => {
        dispatch(restoreGameState(savedGameState));
        onClose();
    };

    const handleStartNewGame = () => {
        dispatch(clearSavedGame());
        onClose();
    };

    if (!savedGameState) return null;

    const moveCount = savedGameState.moveHistory?.length || 0;
    const lastPlayedDate = savedGameState.startTime
        ? new Date(savedGameState.startTime).toLocaleDateString()
        : 'Unknown';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Saved Game Found"
            className="saved-game-dialog"
        >
            <div className="saved-game-content">
                <div className="saved-game-info">
                    <h3>Continue Previous Game?</h3>
                    <p>We found a saved game from your last session.</p>

                    <div className="game-details">
                        <div className="detail-item">
                            <span className="label">Game Mode:</span>
                            <span className="value">
                                {savedGameState.mode === 'ai' ? 'vs AI' : 'Local Play'}
                            </span>
                        </div>

                        {savedGameState.difficulty && (
                            <div className="detail-item">
                                <span className="label">Difficulty:</span>
                                <span className="value">{savedGameState.difficulty}</span>
                            </div>
                        )}

                        <div className="detail-item">
                            <span className="label">Moves Made:</span>
                            <span className="value">{moveCount}</span>
                        </div>

                        <div className="detail-item">
                            <span className="label">Last Played:</span>
                            <span className="value">{lastPlayedDate}</span>
                        </div>

                        <div className="detail-item">
                            <span className="label">Current Turn:</span>
                            <span className="value">Player {savedGameState.currentPlayer}</span>
                        </div>
                    </div>

                    {/* Mini board preview */}
                    <div className="board-preview">
                        <h4>Board State:</h4>
                        <div className="mini-board">
                            {savedGameState.board.map((cell, index) => (
                                <div
                                    key={index}
                                    className={`mini-cell ${cell ? 'filled' : 'empty'}`}
                                >
                                    {cell || ''}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="dialog-actions">
                    <Button
                        onClick={handleRestoreGame}
                        className="restore-button"
                        variant="primary"
                    >
                        Continue Game
                    </Button>

                    <DangerButton
                        onClick={handleStartNewGame}
                        className="new-game-button"
                        variant="secondary"
                    >
                        Start New Game
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
};

export default SavedGameDialog;