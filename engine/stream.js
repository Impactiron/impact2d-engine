/**
 * Impact2D Engine - Streaming
 * Progressive loading of assets and maps with progress events
 */

import { eventBus } from './eventbus.js';

export class AssetStreamer {
  constructor() {
    this.queue = [];
    this.loading = false;
    this.loaded = new Map();
    this.progress = 0;
    this.totalSize = 0;
    this.loadedSize = 0;
  }

  add(url, type = 'auto') {
    if (this.loaded.has(url)) return;

    const item = {
      url,
      type: type === 'auto' ? this.detectType(url) : type,
      size: 0,
      loaded: 0,
      data: null
    };

    this.queue.push(item);
  }

  detectType(url) {
    const ext = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp3', 'ogg', 'wav', 'webm'].includes(ext)) return 'audio';
    if (['json'].includes(ext)) return 'json';
    return 'blob';
  }

  async loadAll() {
    if (this.loading) return;

    this.loading = true;
    this.progress = 0;
    this.loadedSize = 0;

    // Estimate total size (if not known, use queue length)
    this.totalSize = this.queue.length;

    eventBus.emit('streaming:start', { total: this.queue.length });

    for (const item of this.queue) {
      try {
        await this.loadItem(item);
        this.loaded.set(item.url, item.data);
        this.loadedSize++;
        this.progress = this.loadedSize / this.totalSize;

        eventBus.emit('streaming:progress', {
          url: item.url,
          progress: this.progress,
          loaded: this.loadedSize,
          total: this.totalSize
        });
      } catch (e) {
        console.error(`[streaming] Failed to load: ${item.url}`, e);
        eventBus.emit('streaming:error', { url: item.url, error: e });
      }
    }

    this.loading = false;
    this.queue = [];
    eventBus.emit('streaming:complete', { loaded: this.loadedSize });
  }

  async loadItem(item) {
    switch (item.type) {
      case 'image':
        return this.loadImage(item);
      case 'audio':
        return this.loadAudio(item);
      case 'json':
        return this.loadJSON(item);
      default:
        return this.loadBlob(item);
    }
  }

  async loadImage(item) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        item.data = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = item.url;
    });
  }

  async loadAudio(item) {
    const response = await fetch(item.url);
    const arrayBuffer = await response.arrayBuffer();
    item.data = arrayBuffer;
    return arrayBuffer;
  }

  async loadJSON(item) {
    const response = await fetch(item.url);
    const json = await response.json();
    item.data = json;
    return json;
  }

  async loadBlob(item) {
    const response = await fetch(item.url);
    const blob = await response.blob();
    item.data = blob;
    return blob;
  }

  get(url) {
    return this.loaded.get(url);
  }

  has(url) {
    return this.loaded.has(url);
  }

  clear() {
    this.queue = [];
    this.loaded.clear();
    this.progress = 0;
  }
}

// Chunk-based map streaming
export class MapStreamer {
  constructor() {
    this.chunks = new Map();
    this.activeChunks = new Set();
    this.chunkSize = 16; // tiles
  }

  getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
  }

  worldToChunk(x, y, tileSize = 32) {
    return {
      chunkX: Math.floor(x / (this.chunkSize * tileSize)),
      chunkY: Math.floor(y / (this.chunkSize * tileSize))
    };
  }

  async loadChunk(chunkX, chunkY, mapData) {
    const key = this.getChunkKey(chunkX, chunkY);
    
    if (this.chunks.has(key)) {
      return this.chunks.get(key);
    }

    // Extract chunk data from full map
    const chunk = this.extractChunk(chunkX, chunkY, mapData);
    this.chunks.set(key, chunk);
    this.activeChunks.add(key);

    eventBus.emit('map:chunkLoaded', { chunkX, chunkY });
    return chunk;
  }

  extractChunk(chunkX, chunkY, mapData) {
    const startX = chunkX * this.chunkSize;
    const startY = chunkY * this.chunkSize;
    const tiles = [];

    for (let y = 0; y < this.chunkSize; y++) {
      const row = [];
      for (let x = 0; x < this.chunkSize; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        
        if (mapData.tiles && mapData.tiles[worldY] && mapData.tiles[worldY][worldX] !== undefined) {
          row.push(mapData.tiles[worldY][worldX]);
        } else {
          row.push(0);
        }
      }
      tiles.push(row);
    }

    return { tiles, chunkX, chunkY };
  }

  unloadChunk(chunkX, chunkY) {
    const key = this.getChunkKey(chunkX, chunkY);
    this.chunks.delete(key);
    this.activeChunks.delete(key);
    eventBus.emit('map:chunkUnloaded', { chunkX, chunkY });
  }

  updateVisibleChunks(cameraX, cameraY, viewWidth, viewHeight, tileSize, mapData) {
    const { chunkX: centerChunkX, chunkY: centerChunkY } = this.worldToChunk(cameraX, cameraY, tileSize);
    const loadRadius = 2; // Load chunks within this radius

    const neededChunks = new Set();

    for (let dy = -loadRadius; dy <= loadRadius; dy++) {
      for (let dx = -loadRadius; dx <= loadRadius; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkY = centerChunkY + dy;
        const key = this.getChunkKey(chunkX, chunkY);
        neededChunks.add(key);

        if (!this.chunks.has(key)) {
          this.loadChunk(chunkX, chunkY, mapData);
        }
      }
    }

    // Unload chunks that are too far
    for (const key of this.activeChunks) {
      if (!neededChunks.has(key)) {
        const [chunkX, chunkY] = key.split(',').map(Number);
        this.unloadChunk(chunkX, chunkY);
      }
    }
  }

  clear() {
    this.chunks.clear();
    this.activeChunks.clear();
  }
}

// Global instances
export const assetStreamer = new AssetStreamer();
export const mapStreamer = new MapStreamer();
