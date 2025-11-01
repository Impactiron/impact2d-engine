// engine/maploader.js
import { factory } from './factory.js';
export async function loadMap(url, game) {
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
