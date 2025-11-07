/**
 * Impact2D Engine - Save/Load System
 * Save slots using LocalStorage with versioned schema
 */

export class SaveSystem {
  constructor() {
    this.version = '1.0.0';
    this.maxSlots = 3;
    this.prefix = 'impact2d_save_';
  }

  save(slotIndex, gameState) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      console.error('[save] Invalid slot index:', slotIndex);
      return false;
    }

    try {
      const saveData = {
        version: this.version,
        timestamp: Date.now(),
        slot: slotIndex,
        state: gameState
      };

      const key = `${this.prefix}${slotIndex}`;
      localStorage.setItem(key, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error('[save] Failed to save:', e);
      return false;
    }
  }

  load(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      console.error('[save] Invalid slot index:', slotIndex);
      return null;
    }

    try {
      const key = `${this.prefix}${slotIndex}`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;

      const saveData = JSON.parse(data);

      // Version migration (if needed)
      if (saveData.version !== this.version) {
        console.warn('[save] Save version mismatch:', saveData.version, 'vs', this.version);
        // Could implement migration logic here
      }

      return saveData.state;
    } catch (e) {
      console.error('[save] Failed to load:', e);
      return null;
    }
  }

  delete(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      console.error('[save] Invalid slot index:', slotIndex);
      return false;
    }

    try {
      const key = `${this.prefix}${slotIndex}`;
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('[save] Failed to delete:', e);
      return false;
    }
  }

  exists(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;

    const key = `${this.prefix}${slotIndex}`;
    return localStorage.getItem(key) !== null;
  }

  getSlotInfo(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) return null;

    try {
      const key = `${this.prefix}${slotIndex}`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;

      const saveData = JSON.parse(data);
      return {
        slot: slotIndex,
        timestamp: saveData.timestamp,
        version: saveData.version,
        // Extract key info from state for display
        mapId: saveData.state.mapId,
        playerPos: saveData.state.playerPos,
        stats: saveData.state.stats
      };
    } catch (e) {
      console.error('[save] Failed to get slot info:', e);
      return null;
    }
  }

  listSlots() {
    const slots = [];
    for (let i = 0; i < this.maxSlots; i++) {
      const info = this.getSlotInfo(i);
      slots.push(info || { slot: i, empty: true });
    }
    return slots;
  }

  // Export save data as JSON blob (for backup/download)
  exportSlot(slotIndex) {
    const key = `${this.prefix}${slotIndex}`;
    const data = localStorage.getItem(key);
    if (!data) return null;

    const blob = new Blob([data], { type: 'application/json' });
    return blob;
  }

  // Import save data from JSON
  importSlot(slotIndex, jsonString) {
    try {
      const saveData = JSON.parse(jsonString);
      
      // Validate structure
      if (!saveData.version || !saveData.state) {
        throw new Error('Invalid save data structure');
      }

      const key = `${this.prefix}${slotIndex}`;
      localStorage.setItem(key, jsonString);
      return true;
    } catch (e) {
      console.error('[save] Failed to import:', e);
      return false;
    }
  }

  // Clear all saves
  clearAll() {
    for (let i = 0; i < this.maxSlots; i++) {
      this.delete(i);
    }
  }
}

// IndexedDB alternative for larger saves (future enhancement)
export class SaveSystemIDB {
  constructor() {
    this.dbName = 'impact2d_saves';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'slot' });
        }
      };
    });
  }

  async save(slotIndex, gameState) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['saves'], 'readwrite');
      const store = transaction.objectStore('saves');
      
      const data = {
        slot: slotIndex,
        timestamp: Date.now(),
        state: gameState
      };

      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async load(slotIndex) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['saves'], 'readonly');
      const store = transaction.objectStore('saves');
      const request = store.get(slotIndex);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.state : null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Global singleton instance
export const saveSystem = new SaveSystem();
