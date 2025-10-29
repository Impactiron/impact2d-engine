// !mpact2d — Entity Factory (prefabs & spawn) + optional collider support
import { Node } from './node.js';
import { Transform } from './component.js';
import { Sprite } from './sprite.js';
import { Collider } from './collider.js';

export class EntityFactory {
  constructor() {
    this.prefabs = new Map();
  }

  register(name, config) {
    // config: { sprite?: 'rect:24' or URL, size?: number, layer?: string, props?: object,
    //           collider?: { size?: number, solid?: boolean } }
    this.prefabs.set(name, { ...config });
  }

  spawn(name, options = {}) {
    const base = this.prefabs.get(name);
    if (!base) throw new Error(`Prefab not found: ${name}`);
    const cfg = { ...base, ...options };

    const node = new Node(cfg.name || name);
    const t = node.addComponent(new Transform());
    if (cfg.x != null) t.position.x = cfg.x;
    if (cfg.y != null) t.position.y = cfg.y;

    const tex = cfg.sprite || `rect:${cfg.size ?? 16}`;
    const s = node.addComponent(new Sprite(tex));
    if (cfg.layer) s.layer = cfg.layer;

    // optional collider
    const colCfg = cfg.collider;
    if (colCfg) {
      const csize = (colCfg.size != null) ? colCfg.size : (cfg.size ?? 16);
      const csolid = (colCfg.solid != null) ? !!colCfg.solid : true;
      node.addComponent(new Collider(csize, csolid));
    }

    node.__props = { ...(base.props||{}), ...(cfg.props||{}) };
    return node;
  }
}
