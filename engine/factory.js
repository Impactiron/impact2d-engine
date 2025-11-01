// !mpact2d — Entity Factory (prefabs & spawn) • Patch: place prefabs on 'world' layer for visibility
import { Node } from './node.js';
import { Transform } from './component.js';
import { Sprite } from './sprite.js';
import { Collider } from './collider.js';

export class EntityFactory {
  constructor() { this.prefabs = new Map(); }
  register(name, config) { this.prefabs.set(name, { ...config }); }
  has(name){ return this.prefabs.has(name); }
  spawn(name, opts={}){
    const p = this.prefabs.get(name);
    if(!p) throw new Error('Prefab not found: '+name);
    const n = new Node(name);
    const t = n.addComponent(new Transform());
    t.position.x = (opts.x ?? 0);
    t.position.y = (opts.y ?? 0);
    const layer = (opts.layer || p.layer || 'world'); // FORCE world as sane default
    const spriteId = opts.sprite || p.sprite || 'rect:16';
    const s = n.addComponent(new Sprite(spriteId));
    s.layer = layer;
    const col = p.collider || null;
    if(col){
      const { Collider } = await import('./collider.js');
    }
    if (p.collider) {
      const { Collider } = await import('./collider.js');
      const c = n.addComponent(new Collider(p.collider.size ?? 16, !!p.collider.solid));
      c.layer = layer;
    }
    n.props = { ...(p.props||{}), ...(opts.props||{}) };
    return n;
  }
}

export const registerDefaultPrefabs = (factory)=>{
  factory.register('crate', { sprite:'rect:18', layer:'world', props:{ loot:1 }, collider:{ size:18, solid:true } });
  factory.register('gem',   { sprite:'rect:24', layer:'world', props:{ value:10 }, collider:null });
  factory.register('bot',   { sprite:'rect:16', layer:'world', props:{ hp:5 }, collider:{ size:16, solid:true } });
};
