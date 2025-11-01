// !mpact2d — v0.8 MapLoader (hotfix: engine path + maps path)
import { EntityFactory } from './factory.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export class MapLoader {
  constructor(renderer) {
    this.renderer = renderer;
    this.factory = new EntityFactory();
  }

  async tryLoad(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async loadAuto() {
    const candidates = ['./engine/test-map.json', './maps/test-map.json'];
    let lastErr = null;
    for (const c of candidates) {
      try { return { url: c, data: await this.tryLoad(c) }; }
      catch(e) { lastErr = e; }
    }
    throw lastErr || new Error('No map found');
  }

  buildFromData(scene, data) {
    const ts = data.tileSize || 32;
    this.renderer.defineLayer('world', 1.0);
    this.renderer.defineLayer('default', 1.0);
    const palette = data.palette || { "0": 0x202733 };
    const cont = this.renderer.getLayerContainer('world');
    const tiles = data.tiles || [];
    for (let y = 0; y < tiles.length; y++) {
      const row = tiles[y];
      for (let x = 0; x < row.length; x++) {
        const v = row[x];
        const col = palette[String(v)] ?? 0x333333;
        const g = new Graphics();
        g.rect(0, 0, ts, ts).fill(col);
        g.x = x * ts; g.y = y * ts;
        cont.addChild(g);
      }
    }
    if (Array.isArray(data.entities)) {
      for (const e of data.entities) {
        const n = this.factory.spawn(e.type, { x: (e.x||0)*ts, y: (e.y||0)*ts });
        if (n) scene.add(n);
      }
    }
    return { tileSize: ts, width: (tiles[0]?.length||0), height: tiles.length, name: data.name || 'unnamed' };
  }
}
