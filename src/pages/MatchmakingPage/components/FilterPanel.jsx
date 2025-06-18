import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './FilterPanel.module.scss';

const FilterPanel = ({ filters, onFilterChange, onClose }) => {
    const [localFilters, setLocalFilters] = useState({
        minElo: filters.minElo || 0,
        maxElo: filters.maxElo || 3000,
        onlineOnly: filters.onlineOnly || false,
        showFriendsOnly: filters.showFriendsOnly || false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setLocalFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : Number(value)
        }));
    };

    const handleApply = () => {
        onFilterChange(localFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            minElo: 0,
            maxElo: 3000,
            onlineOnly: true,
            showFriendsOnly: false
        };

        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <div className={styles.filterPanel}>
            <div className={styles.filterHeader}>
                <h3>Filter Players</h3>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close filters"
                >
                    <FaTimes />
                </button>
            </div>

            <div className={styles.filterContent}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>ELO Range</label>
                    <div className={styles.rangeContainer}>
                        <div className={styles.rangeInput}>
                            <span>Min:</span>
                            <input
                                type="number"
                                name="minElo"
                                min="0"
                                max="3000"
                                value={localFilters.minElo}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.rangeInput}>
                            <span>Max:</span>
                            <input
                                type="number"
                                name="maxElo"
                                min="0"
                                max="3000"
                                value={localFilters.maxElo}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <input
                        type="range"
                        name="minElo"
                        min="0"
                        max="3000"
                        value={localFilters.minElo}
                        onChange={handleChange}
                        className={styles.rangeSlider}
                    />
                    <input
                        type="range"
                        name="maxElo"
                        min="0"
                        max="3000"
                        value={localFilters.maxElo}
                        onChange={handleChange}
                        className={styles.rangeSlider}
                    />
                    <div className={styles.rangeLabels}>
                        <span>0</span>
                        <span>1500</span>
                        <span>3000</span>
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.checkboxContainer}>
                        <input
                            type="checkbox"
                            name="onlineOnly"
                            checked={localFilters.onlineOnly}
                            onChange={handleChange}
                        />
                        <span className={styles.checkboxLabel}>Show online players only</span>
                    </label>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.checkboxContainer}>
                        <input
                            type="checkbox"
                            name="showFriendsOnly"
                            checked={localFilters.showFriendsOnly}
                            onChange={handleChange}
                        />
                        <span className={styles.checkboxLabel}>Show friends only</span>
                    </label>
                </div>
            </div>

            <div className={styles.filterActions}>
                <button
                    className={styles.resetButton}
                    onClick={handleReset}
                >
                    Reset
                </button>
                <button
                    className={styles.applyButton}
                    onClick={handleApply}
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;
