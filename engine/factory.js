// !mpact2d — Entity Factory (prefabs & spawn) • Safe sync version
import { Node } from './node.js';
import { Transform } from './component.js';
import { Sprite } from './sprite.js';
import { Collider } from './collider.js';

export class EntityFactory {
  constructor() { this.prefabs = new Map(); }

  register(name, config) {
    this.prefabs.set(name, { ...config });
  }

  has(name) { return this.prefabs.has(name); }

  spawn(name, opts = {}) {
    const p = this.prefabs.get(name);
    if (!p) throw new Error('Prefab not found: ' + name);

    const n = new Node(name);
    const t = n.addComponent(new Transform());
    t.position.x = (opts.x ?? 0);
    t.position.y = (opts.y ?? 0);

    // --- always use visible world layer ---
    const layer = (opts.layer || p.layer || 'world');

    const spriteId = opts.sprite || p.sprite || 'rect:16';
    const s = n.addComponent(new Sprite(spriteId));
    s.layer = layer;

    // --- collider (no async/await) ---
    if (p.collider) {
      const c = n.addComponent(new Collider(p.collider.size ?? 16, !!p.collider.solid));
      c.layer = layer;
    }

    n.props = { ...(p.props || {}), ...(opts.props || {}) };
    return n;
  }
}

export const registerDefaultPrefabs = (factory) => {
  factory.register('crate', { sprite: 'rect:18', layer: 'actors', props: { loot: 1 }, collider: { size: 18, solid: true } });
  factory.register('gem',   { sprite: 'rect:24', layer: 'actors', props: { value: 10 }, collider: null });
  factory.register('bot',   { sprite: 'rect:16', layer: 'actors', props: { hp: 5 }, collider: { size: 16, solid: true } });
};

