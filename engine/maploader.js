// engine/maploader.js
import { factory } from './factory.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export class MapLoader {
  constructor(renderer){
    this.renderer = renderer;
  }
  async loadAuto(){
    const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    const url = params.get('map') || 'maps/test-map.json';
    const res = await fetch(url);
    const data = await res.json();
    return { url, data };
  }
  buildFromData(scene, data){
    const r = this.renderer;
    const tileSize = data.tileSize || data.tilesize || 32;
    const tiles = data.tiles || [];
    const palette = data.palette || {};
    // layers
    if (r && typeof r.defineLayer === 'function'){
      r.defineLayer('world', 1.0);
      r.defineLayer('default', 1.0);
    }
    const cont = r && typeof r.getLayerContainer === 'function' ? r.getLayerContainer('world') : null;
    if (cont){
      cont.removeChildren();
      const g = new Graphics();
      for (let y=0; y<tiles.length; y++){
        const row = tiles[y];
        for (let x=0; x<row.length; x++){
          const v = row[x];
          const col = palette.hasOwnProperty(v) ? palette[v] : null;
          if (col == null) continue;
          g.beginFill(col);
          g.drawRect(x*tileSize, y*tileSize, tileSize, tileSize);
          g.endFill();
        }
      }
      cont.addChild(g);
    }
    // entities
    const list = Array.isArray(data.entities) ? data.entities : (data.objects || []);
    for (const spec of list){
      if (!spec || !spec.type) continue;
      try { factory.spawn(spec.type, scene, spec.props || spec); } catch(e){ /* ignore */ }
    }
    return { tileSize, tilesWidth: (tiles[0]?.length||0), tilesHeight: tiles.length };
  }
}

// keep backward compatibility
export async function loadMap(url, game){
  const res = await fetch(url);
  const data = await res.json();
  const list = Array.isArray(data.entities) ? data.entities : (data.objects || []);
  const entities = [];
  for (const spec of list) {
    if (!spec || !spec.type) continue;
    const e = factory.spawn(spec.type, game, spec.props || spec);
    if (e) entities.push(e);
  }
  return { data, entities };
}
