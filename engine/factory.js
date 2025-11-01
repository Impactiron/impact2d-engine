// engine/factory.js
export const factory = (() => {
  const registry = new Map();
  function register(name, creator) { registry.set(name, creator); }
  function spawn(name, opts = {}) {
    const make = registry.get(name);
    if (typeof make === 'function') return make(opts);
    return { type: name, x: opts.x|0, y: opts.y|0, props: opts.props||{} };
  }
  function clear() {}
  function list() { return Array.from(registry.keys()); }
  register('gem', (o)=>({ type:'gem', x:o.x|0, y:o.y|0, props:o.props||{} }));
  register('bot', (o)=>({ type:'bot', x:o.x|0, y:o.y|0, props:o.props||{} }));
  return { register, spawn, clear, list };
})();
