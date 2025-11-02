// engine/factory.js (Kurzfassung mit tolerantem register)
const _prefabs = new Map();

export const factory = {
  // akzeptiert Klassen/Funktionen – und wrappt zur Not auch plain Objects
  register(name, ctor) {
    if (!name || !ctor) {
      console.warn('[factory.register] invalid registration for', name);
      return;
    }
    if (typeof ctor !== 'function') {
      // Fallback: plain object als Vorlage zulassen
      const spec = ctor;
      ctor = function(props = {}) { return Object.assign({}, spec, props); };
    }
    _prefabs.set(name, ctor);
  },

  // spawn(name, props) ODER spawn(name, game, props)
  spawn(name, a = null, b = {}) {
    let game = null, props = {};
    if (a && typeof a === 'object' && !('addChild' in a) && !('addTo' in a)) {
      props = a || {};
    } else { game = a || null; props = b || {}; }

    const Ctor = _prefabs.get(name);
    if (!Ctor) { console.warn(`[factory.spawn] unknown prefab: ${name}`); return null; }

    const entity = new Ctor(props);
    try {
      if (entity && typeof entity.addTo === 'function' && game) entity.addTo(game);
      else if (game && typeof game.addChild === 'function') game.addChild(entity);
    } catch (e) { console.warn('[factory.spawn] attach skipped:', e); }
    return entity;
  },

  clear(){ _prefabs.clear(); },
  list(){ return Array.from(_prefabs.keys()); }
};

// einfache Default-Prefabs (funktionale Ctors, robust für register+spawn)
function Crate(p = {}) { this.type='crate'; this.x=p.x|0; this.y=p.y|0; this.size=p.size||32; this.solid=true; this.sprite={ texture:'crate', layer:'objects', tint:p.tint }; }
function Gem(p = {})   { this.type='gem';   this.x=p.x|0; this.y=p.y|0; this.size=p.size||16; }
function Bot(p = {})   { this.type='bot';   this.x=p.x|0; this.y=p.y|0; this.size=p.size||16; this.speed=p.speed||1; }

export function registerDefaultPrefabs() {
  factory.register('crate', Crate);
  factory.register('gem', Gem);
  factory.register('bot', Bot);
}
