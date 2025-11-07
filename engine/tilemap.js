// Render-only Tilemap for !mpact2d (no collisions)
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export class Tilemap {
  /**
   * @param {Object} options - Configuration options
   * @param {number[][]} options.tiles - 2D array of tile IDs
   * @param {number} options.tileSize - Tile size in pixels (default: 32)
   * @param {Object} options.palette - Map of tileValue -> hex color (e.g., {0: 0x1a1f2b, 1: 0x3a3f4b})
   */
  constructor({ tiles, tileSize = 32, palette = { 0: 0x101418, 1: 0x2f3542 } } = {}) {
    this.tiles = tiles || [[1]];
    this.tileSize = tileSize;
    this.palette = palette;
  }

  /**
   * Draw the tilemap to a renderer layer
   * @param {Object} renderer - The renderer instance
   * @param {string} layerName - Name of the layer to draw on (default: 'mid')
   */
  draw(renderer, layerName = 'mid') {
    if (!renderer || typeof renderer.getLayerContainer !== 'function') {
      console.warn('[Tilemap.draw] Invalid renderer or missing getLayerContainer method');
      return;
    }

    const layer = renderer.getLayerContainer(layerName);
    if (!layer) {
      console.warn(`[Tilemap.draw] Layer "${layerName}" not found`);
      return;
    }

    // Clear previous draw (remove children and let GC handle)
    if (typeof layer.removeChildren === 'function') {
      layer.removeChildren();
    }

    // Create new Graphics object for drawing tiles
    const g = new Graphics();

    // Draw each tile based on the palette
    for (let y = 0; y < this.tiles.length; y++) {
      const row = this.tiles[y];
      for (let x = 0; x < row.length; x++) {
        const tileValue = row[x];
        const color = this.palette[tileValue];

        // Only draw if color is defined in palette
        if (color !== undefined && color !== null) {
          g.rect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize).fill(color);
        }
      }
    }

    // Add the graphics object to the layer
    if (typeof layer.addChild === 'function') {
      layer.addChild(g);
    } else {
      console.warn('[Tilemap.draw] Layer does not support addChild method');
    }
  }
}
