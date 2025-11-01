// engine/factory.js
(function (global) {
  const _prefabs = new Map();
  function prefab(name, fn) { _prefabs.set(name, fn); }
  function spawn(name, opts = {}) {
    const fn = _prefabs.get(name);
    if (!fn) throw new Error(`Prefab not found: ${name}`);
    return fn(opts);
  }
  global.factory = { prefab, spawn };
  prefab('gem', ({ x = 0, y = 0, size = 16, color = '#2B6CB0' } = {}) => {
    const ent = { x, y, w: size, h: size, fill: color, tag: 'gem',
      _removed: false, remove(){ this._removed = true; } };
    return ent;
  });
})(typeof window !== 'undefined' ? window : globalThis);
