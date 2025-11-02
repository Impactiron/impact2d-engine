// !mpact2d — Collider component (AABB) + simple registry for dynamic checks
import { Component } from './component.js';
import { Transform } from './component.js';

const _colliders = new Set(); // store components

export function getColliders() { return _colliders; }

export class Collider extends Component {
  // size: number (assume square); solid: boolean
  constructor(size = 16, solid = true) {
    super();
    this.size = size|0;
    this.solid = !!solid;
  }
  onAttach() {
    _colliders.add(this);
  }
  onDetach() {
    _colliders.delete(this);
  }
  getAABB() {
    const tr = this.owner.getComponent(Transform);
    if (!tr) return { x:0, y:0, w:this.size, h:this.size };
    return { x: tr.position.x, y: tr.position.y, w: this.size, h: this.size };
  }
}
