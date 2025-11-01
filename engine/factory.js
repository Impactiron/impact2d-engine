// engine/factory.js
// Unified factory with default singleton export + named class export for compatibility.

class BaseEntity {
  constructor(opts = {}) {
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.vx = 0;
    this.vy = 0;
    this.tag = opts.tag ?? null;
    this.alive = true;
    this.view = opts.view ?? null; // optional PIXI container/sprite
  }
  update(dt) {}
  destroy() {
    // Guard: avoid "child.remove is not a function" across browsers/PIXI versions
    const v = this.view;
    if (v) {
      if (typeof v.remove === "function") v.remove();
      else if (v.parent && typeof v.parent.removeChild === "function") v.parent.removeChild(v);
    }
    this.alive = false;
  }
  remove() { this.destroy(); }
}

class EntityFactory {
  constructor() {
    /** @type {Map<string, Function>} */
    this._prefabs = new Map();
  }
  prefab(name, creatorFn) {
    if (typeof creatorFn !== "function") {
      throw new Error(`prefab('${name}'): creatorFn must be a function`);
    }
    this._prefabs.set(name, creatorFn);
    return this;
  }
  hasPrefab(name) { return this._prefabs.has(name); }
  clear() { this._prefabs.clear(); }
  spawn(name, opts = {}) {
    const fn = this._prefabs.get(name);
    if (!fn) throw new Error(`prefab not found: ${name}`);
    const ent = fn(opts);
    // Fallbacks if prefab returns a plain object
    if (typeof ent.destroy !== "function") ent.destroy = () => { ent.alive = false; };
    if (typeof ent.remove !== "function") ent.remove = () => ent.destroy();
    return ent;
  }
}

// Example: blue gem prefab (visible when renderer uses entity.color as tint)
function makeBlueGem() {
  return (opts = {}) => {
    const e = new BaseEntity({ ...opts, tag: "gem" });
    e.color = 0x2f6db3; // blue
    e.value = 1;
    return e;
  };
}

const factory = new EntityFactory().prefab("gem", makeBlueGem());

// Exports for both import styles:
export { EntityFactory };
export default factory;

// Optional: expose singleton for quick debugging
if (typeof window !== "undefined") {
  window.__impact2d_factory__ = factory;
}
