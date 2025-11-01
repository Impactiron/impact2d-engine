// engine/maploader.js
import { factory } from './factory.js';
export async function loadMap(url = 'engine/test-map.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  const json = await res.json();
  const entities = Array.isArray(json?.entities) ? json.entities : [];
  const spawned = [];
  for (const e of entities) {
    const type = e.type || e.prefab || e.name;
    if (!type) continue;
    const ent = factory.spawn(type, { x: e.x|0, y: e.y|0, props: e.props||{}, tag: 'map' });
    spawned.push(ent);
  }
  return { tiles: json?.tiles || [], entities: spawned };
}
export async function loadTestMap() { return loadMap('engine/test-map.json'); }
