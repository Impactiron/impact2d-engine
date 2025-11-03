// engine/maploader.js
import { factory } from './factory.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export let currentMap = null;

/**
 * MapLoader class for loading and building game maps
 */
export class MapLoader {
  constructor(renderer){
    this.renderer = renderer;
  }
  
  /**
   * Automatically load map from URL parameter or default location
   * @returns {Promise<{url: string, data: Object}>} Map URL and parsed data
   * @throws {Error} If map loading fails
   */
  async loadAuto(){
    const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    const url = params.get('map') || 'maps/test-map.json';
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load map from ${url}: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return { url, data };
    } catch (error) {
      console.error('[MapLoader.loadAuto] Error loading map:', error);
      throw error;
    }
  }
  
  /**
   * Build scene from map data
   * @param {Object} scene - Scene instance to populate
   * @param {Object} data - Map data with tiles, entities, and palette
   * @returns {Object} Map metadata (tileSize, dimensions)
   */
  buildFromData(scene, data){
    const r = this.renderer;
    const tileSize = data.tileSize || data.tilesize || 32;
    const tiles = data.tiles || [];
    const palette = data.palette || {};
    
    // Define rendering layers
    if (r && typeof r.defineLayer === 'function'){
      r.defineLayer('world', 1.0);
      r.defineLayer('default', 1.0);
    }
    
    // Render tilemap
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
          g.rect(x*tileSize, y*tileSize, tileSize, tileSize).fill(col);
        }
      }
      cont.addChild(g);
    }
    
    // Spawn entities
    const list = Array.isArray(data.entities) ? data.entities : (data.objects || []);
    for (const spec of list){
      if (!spec || !spec.type) continue;
      try { 
        factory.spawn(spec.type, scene, spec.props || spec); 
      } catch(e){ 
        console.warn('[MapLoader.buildFromData] Failed to spawn entity:', spec.type, e);
      }
    }
    return { tileSize, tilesWidth: (tiles[0]?.length||0), tilesHeight: tiles.length };
  }
}

/**
 * Load map from URL (backward compatibility function)
 * @param {string} url - URL of the map JSON file
 * @param {Object} game - Game instance
 * @returns {Promise<{data: Object, entities: Array}>} Map data and spawned entities
 * @throws {Error} If map loading or parsing fails
 */
export async function loadMap(url, game){
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load map from ${url}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const list = Array.isArray(data.entities) ? data.entities : (data.objects || []);
    const entities = [];
    for (const spec of list) {
      if (!spec || !spec.type) continue;
      try {
        const e = factory.spawn(spec.type, game, spec.props || spec);
        if (e) entities.push(e);
      } catch(err) {
        console.warn('[loadMap] Failed to spawn entity:', spec.type, err);
      }
    }
    return { data, entities };
  } catch (error) {
    console.error('[loadMap] Error loading map:', error);
    throw error;
  }
}

/**
 * Set the current active map
 * @param {Object|null} map - Map object or null to clear
 */
export function setCurrentMap(map){ currentMap = map || null; }

/**
 * Get the current active map
 * @returns {Object|null} Current map or null
 */
export function getCurrentMap(){ return currentMap; }