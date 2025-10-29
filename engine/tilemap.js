// Render-only Tilemap for !mpact2d (no collisions)
export class Tilemap {
  /**
   * tiles: 2D array of numbers
   * tileSize: number (px)
   * palette: map tileValue -> hex color (e.g., {0: 0x1a1f2b, 1: 0x3a3f4b})
   */
  constructor({ tiles, tileSize = 32, palette = {0:0x101418, 1:0x2f3542} } = {}){
    this.tiles = tiles || [[1]];
    this.tileSize = tileSize;
    this.palette = palette;
  }

  draw(renderer, layerName='mid'){
    const layer = renderer.getLayerContainer(layerName);
    // clear previous draw (remove children and let GC handle)
    layer.removeChildren();

    // draw visible region naive (full draw; can be optimized later)
    const g = new renderer.app.renderer.graphics();
    // However PIXI v8 Graphics is from import; we can't new via renderer. Use standard import in main.
  }
}
