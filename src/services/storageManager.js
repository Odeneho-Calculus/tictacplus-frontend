/**
 * Storage Manager - Unified interface for different storage mechanisms
 * Provides fallbacks and error handling for localStorage, sessionStorage, and IndexedDB
 */
class StorageManager {
    constructor() {
        this.storageAvailable = {
            localStorage: this._testStorage('localStorage'),
            sessionStorage: this._testStorage('sessionStorage'),
            indexedDB: this._testIndexedDB()
        };

        this.memoryStorage = new Map();
        this.dbName = 'TicTacPlusDB';
        this.dbVersion = 1;
        this.db = null;

        console.log('Storage availability:', this.storageAvailable);
    }

    /**
     * Initialize storage manager
     */
    async initialize() {
        if (this.storageAvailable.indexedDB) {
            try {
                await this._initIndexedDB();
            } catch (error) {
                console.warn('Failed to initialize IndexedDB:', error);
                this.storageAvailable.indexedDB = false;
            }
        }
    }

    /**
     * Store data with automatic fallback
     */
    async setItem(key, value, options = {}) {
        const {
            storageType = 'auto',
            serialize = true,
            compress = false,
            ttl = null
        } = options;

        const dataToStore = {
            value: serialize ? JSON.stringify(value) : value,
            timestamp: Date.now(),
            ttl: ttl ? Date.now() + ttl : null,
            compressed: compress
        };

        if (compress && serialize) {
            // Simple compression simulation (in real app, use a library like lz-string)
            dataToStore.value = this._compress(dataToStore.value);
        }

        try {
            switch (storageType) {
                case 'localStorage':
                    return this._setLocalStorage(key, dataToStore);
                case 'sessionStorage':
                    return this._setSessionStorage(key, dataToStore);
                case 'indexedDB':
                    return await this._setIndexedDB(key, dataToStore);
                case 'memory':
                    return this._setMemoryStorage(key, dataToStore);
                default: // 'auto'
                    return await this._setWithFallback(key, dataToStore);
            }
        } catch (error) {
            console.error(`Failed to store item ${key}:`, error);
            throw error;
        }
    }

    /**
     * Retrieve data with automatic fallback
     */
    async getItem(key, options = {}) {
        const { storageType = 'auto', deserialize = true } = options;

        try {
            let storedData;

            switch (storageType) {
                case 'localStorage':
                    storedData = this._getLocalStorage(key);
                    break;
                case 'sessionStorage':
                    storedData = this._getSessionStorage(key);
                    break;
                case 'indexedDB':
                    storedData = await this._getIndexedDB(key);
                    break;
                case 'memory':
                    storedData = this._getMemoryStorage(key);
                    break;
                default: // 'auto'
                    storedData = await this._getWithFallback(key);
            }

            if (!storedData) return null;

            // Check TTL
            if (storedData.ttl && Date.now() > storedData.ttl) {
                this.removeItem(key, { storageType });
                return null;
            }

            let value = storedData.value;

            // Decompress if needed
            if (storedData.compressed) {
                value = this._decompress(value);
            }

            // Deserialize if needed
            if (deserialize && typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // If parsing fails, return the string as-is
                }
            }

            return value;
        } catch (error) {
            console.error(`Failed to retrieve item ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove item from storage
     */
    async removeItem(key, options = {}) {
        const { storageType = 'auto' } = options;

        try {
            switch (storageType) {
                case 'localStorage':
                    return this._removeLocalStorage(key);
                case 'sessionStorage':
                    return this._removeSessionStorage(key);
                case 'indexedDB':
                    return await this._removeIndexedDB(key);
                case 'memory':
                    return this._removeMemoryStorage(key);
                default: // 'auto'
                    return await this._removeWithFallback(key);
            }
        } catch (error) {
            console.error(`Failed to remove item ${key}:`, error);
            throw error;
        }
    }

    /**
     * Clear storage
     */
    async clear(storageType = 'all') {
        try {
            if (storageType === 'all' || storageType === 'localStorage') {
                this._clearLocalStorage();
            }
            if (storageType === 'all' || storageType === 'sessionStorage') {
                this._clearSessionStorage();
            }
            if (storageType === 'all' || storageType === 'indexedDB') {
                await this._clearIndexedDB();
            }
            if (storageType === 'all' || storageType === 'memory') {
                this._clearMemoryStorage();
            }
        } catch (error) {
            console.error('Failed to clear storage:', error);
            throw error;
        }
    }

    /**
     * Get storage usage information
     */
    async getStorageInfo() {
        const info = {
            localStorage: { available: this.storageAvailable.localStorage, used: 0, quota: 0 },
            sessionStorage: { available: this.storageAvailable.sessionStorage, used: 0, quota: 0 },
            indexedDB: { available: this.storageAvailable.indexedDB, used: 0, quota: 0 },
            memory: { available: true, used: this.memoryStorage.size, quota: Infinity }
        };

        // Get storage estimates if available
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                info.total = {
                    used: estimate.usage,
                    quota: estimate.quota
                };
            } catch (error) {
                console.warn('Failed to get storage estimate:', error);
            }
        }

        return info;
    }

    // Private methods for localStorage
    _setLocalStorage(key, data) {
        if (!this.storageAvailable.localStorage) throw new Error('localStorage not available');
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    }

    _getLocalStorage(key) {
        if (!this.storageAvailable.localStorage) return null;
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    _removeLocalStorage(key) {
        if (!this.storageAvailable.localStorage) return false;
        localStorage.removeItem(key);
        return true;
    }

    _clearLocalStorage() {
        if (this.storageAvailable.localStorage) {
            localStorage.clear();
        }
    }

    // Private methods for sessionStorage
    _setSessionStorage(key, data) {
        if (!this.storageAvailable.sessionStorage) throw new Error('sessionStorage not available');
        sessionStorage.setItem(key, JSON.stringify(data));
        return true;
    }

    _getSessionStorage(key) {
        if (!this.storageAvailable.sessionStorage) return null;
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    _removeSessionStorage(key) {
        if (!this.storageAvailable.sessionStorage) return false;
        sessionStorage.removeItem(key);
        return true;
    }

    _clearSessionStorage() {
        if (this.storageAvailable.sessionStorage) {
            sessionStorage.clear();
        }
    }

    // Private methods for IndexedDB
    async _initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('keyvalue')) {
                    db.createObjectStore('keyvalue', { keyPath: 'key' });
                }
            };
        });
    }

    async _setIndexedDB(key, data) {
        if (!this.db) throw new Error('IndexedDB not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keyvalue'], 'readwrite');
            const store = transaction.objectStore('keyvalue');
            const request = store.put({ key, ...data });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    async _getIndexedDB(key) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keyvalue'], 'readonly');
            const store = transaction.objectStore('keyvalue');
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? {
                    value: result.value,
                    timestamp: result.timestamp,
                    ttl: result.ttl,
                    compressed: result.compressed
                } : null);
            };
        });
    }

    async _removeIndexedDB(key) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keyvalue'], 'readwrite');
            const store = transaction.objectStore('keyvalue');
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    async _clearIndexedDB() {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keyvalue'], 'readwrite');
            const store = transaction.objectStore('keyvalue');
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // Private methods for memory storage
    _setMemoryStorage(key, data) {
        this.memoryStorage.set(key, data);
        return true;
    }

    _getMemoryStorage(key) {
        return this.memoryStorage.get(key) || null;
    }

    _removeMemoryStorage(key) {
        return this.memoryStorage.delete(key);
    }

    _clearMemoryStorage() {
        this.memoryStorage.clear();
    }

    // Fallback methods
    async _setWithFallback(key, data) {
        if (this.storageAvailable.localStorage) {
            return this._setLocalStorage(key, data);
        } else if (this.storageAvailable.indexedDB) {
            return await this._setIndexedDB(key, data);
        } else if (this.storageAvailable.sessionStorage) {
            return this._setSessionStorage(key, data);
        } else {
            return this._setMemoryStorage(key, data);
        }
    }

    async _getWithFallback(key) {
        if (this.storageAvailable.localStorage) {
            const result = this._getLocalStorage(key);
            if (result) return result;
        }

        if (this.storageAvailable.indexedDB) {
            const result = await this._getIndexedDB(key);
            if (result) return result;
        }

        if (this.storageAvailable.sessionStorage) {
            const result = this._getSessionStorage(key);
            if (result) return result;
        }

        return this._getMemoryStorage(key);
    }

    async _removeWithFallback(key) {
        let removed = false;

        if (this.storageAvailable.localStorage) {
            removed = this._removeLocalStorage(key) || removed;
        }

        if (this.storageAvailable.indexedDB) {
            removed = await this._removeIndexedDB(key) || removed;
        }

        if (this.storageAvailable.sessionStorage) {
            removed = this._removeSessionStorage(key) || removed;
        }

        removed = this._removeMemoryStorage(key) || removed;

        return removed;
    }

    // Utility methods
    _testStorage(type) {
        try {
            const storage = window[type];
            const test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    _testIndexedDB() {
        return 'indexedDB' in window && window.indexedDB !== null;
    }

    _compress(str) {
        // Simple compression simulation - in real app use a proper library
        return btoa(encodeURIComponent(str));
    }

    _decompress(str) {
        // Simple decompression simulation
        try {
            return decodeURIComponent(atob(str));
        } catch (e) {
            return str; // Return as-is if decompression fails
        }
    }
}

// Export singleton instance
export const storageManager = new StorageManager();
export default storageManager;