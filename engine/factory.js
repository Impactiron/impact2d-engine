
class Crate {
  constructor(p = {}) {
    this.type = 'crate';
    this.x = p.x|0;
    this.y = p.y|0;
    this.size = p.size || 32;
    this.solid = true;
    this.sprite = { texture: 'crate', layer: 'objects', tint: p.tint };
  }
}

// engine/factory.js
const _prefabs = new Map();

export const factory = {
  register(name, ctor) {
    if (!name || typeof ctor !== 'function') {
      console.warn('[factory.register] invalid registration for', name);
      return;
    }
    _prefabs.set(name, ctor);
  },
  spawn(name, game, props = {}) {
    const Ctor = _prefabs.get(name);
    if (!Ctor) {
      console.warn(`[factory.spawn] unknown prefab: ${name}`);
      return null;
    }
    const entity = new Ctor(props);
    try {
      if (entity && typeof entity.addTo === 'function' && game) entity.addTo(game);
      else if (game && typeof game.addChild === 'function') game.addChild(entity);
    } catch (e) {
      console.warn('[factory.spawn] attach skipped:', e);
    }
    return entity;
  },
  clear() { _prefabs.clear(); },
  list() { return Array.from(_prefabs.keys()); }
};

export function registerDefaultPrefabs() {
  try { factory.register('crate', Crate); } catch (e) { /* ignore if double */ }
  class Gem { constructor(p={}){ this.x=p.x|0; this.y=p.y|0; this.type='gem'; this.size=p.size||16; } }
  class Bot { constructor(p={}){ this.x=p.x|0; this.y=p.y|0; this.type='bot'; this.size=p.size||16; this.speed=p.speed||1; } }
  factory.register('gem', Gem);
  factory.register('bot', Bot);
};
