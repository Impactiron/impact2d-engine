// engine/factory.js
// Register default prefabs with colorized gem entity

export class EntityFactory {
  constructor() {
    this.prefabs = {};
  }
  register(name, fn) {
    this.prefabs[name] = fn;
  }
  spawn(name, opts = {}) {
    const prefab = this.prefabs[name];
    if (!prefab) throw new Error(`Prefab not found: ${name}`);
    return prefab(opts);
  }
}

export function registerDefaultPrefabs(factory) {
  factory.register('gem', ({ x = 0, y = 0, size = 16, color = '#2B6CB0' }) => ({
    x, y, w: size, h: size, fill: color, tag: 'gem'
  }));
}
