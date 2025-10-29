// !mpact2d — Entity Factory (step 1: prefabs & spawn)
// Zero-install. No behaviors yet; just construction & placement.

import { Node } from './node.js';
import { Transform } from './component.js';
import { Sprite } from './sprite.js';

export class EntityFactory {
  constructor() {
    this.prefabs = new Map(); // name -> config
  }

  register(name, config) {
    // config: { sprite?: string ('rect:24' or texture URL), size?: number, layer?: string, props?: object }
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

    // attach raw props for gameplay systems later
    node.__props = { ...(base.props||{}), ...(cfg.props||{}) };
    return node;
  }
}
