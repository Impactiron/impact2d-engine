// engine/node.js — scene graph + Pixi-safe helpers (v8 compatible)
import { Container } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';
import { Transform } from './component.js';

/** Basic ECS-style node with components & transform */
export class Node {
  constructor(name = '') {
    this.name = name;
    this.parent = null;
    this.children = [];
    this.components = [];
    this.transform = new Transform();
  }
  addComponent(c) {
    if (!c) return null;
    this.components.push(c);
    if (typeof c.onAttach === 'function')
      try {
        c.onAttach(this);
      } catch {}
    return c;
  }
  removeComponent(Ctor) {
    const i = this.components.findIndex(c => c instanceof Ctor);
    if (i >= 0) this.components.splice(i, 1);
  }
  get(Ctor) {
    for (const c of this.components) if (c instanceof Ctor) return c;
    return null;
  }
}

/** Root Scene (also a Node), keeps a flat list of children for simplicity */
export class Scene extends Node {
  constructor() {
    super('scene');
  }
  add(child) {
    if (!child) return null;
    this.children.push(child);
    child.parent = this;
    return child;
  }
  remove(child) {
    if (!child) return;
    this.children = this.children.filter(x => x !== child);
    child.parent = null;
  }
}

/** resolve container-like value */
function asContainer(x) {
  if (x instanceof Container) return x;
  if (x && typeof x.addChild === 'function') return x;
  return x && x.container ? x.container : null;
}

/** resolve display-object-like value */
function asDisplay(x) {
  if (!x) return null;
  if (typeof x.emit === 'function' && ('parent' in x || 'transform' in x)) return x;
  return x.container || x.view || x.sprite || x.node || x;
}

export function add(parent, child) {
  const cont = asContainer(parent);
  const obj = asDisplay(child);
  if (!cont || !obj) return child;
  try {
    if (obj.parent && typeof obj.parent.removeChild === 'function') {
      obj.parent.removeChild(obj);
    } else if (typeof obj.removeFromParent === 'function') {
      obj.removeFromParent();
    } else if (typeof obj.remove === 'function') {
      try {
        obj.remove();
      } catch {}
    }
  } catch {}
  try {
    cont.addChild(obj);
  } catch {}
  return child;
}

export function remove(child) {
  const obj = asDisplay(child);
  if (!obj) return;
  try {
    if (obj.parent && typeof obj.parent.removeChild === 'function') obj.parent.removeChild(obj);
    else if (typeof obj.removeFromParent === 'function') obj.removeFromParent();
    else if (typeof obj.remove === 'function') obj.remove();
  } catch {}
}

export function removeAll(parent) {
  const cont = asContainer(parent);
  if (!cont) return;
  try {
    if (typeof cont.removeChildren === 'function') cont.removeChildren();
    else if (Array.isArray(cont.children)) {
      const copy = cont.children.slice();
      for (const c of copy) {
        try {
          if (c && c.parent && c.parent.removeChild) c.parent.removeChild(c);
        } catch {}
      }
    }
  } catch {}
}
