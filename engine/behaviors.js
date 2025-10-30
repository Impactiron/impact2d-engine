// !mpact2d — Behavior system (minimal) + PickupBehavior
import { Component, Transform } from './component.js';
import { Sprite } from './sprite.js';

export class Behavior extends Component {
  constructor() { super(); }
}

// Helper: AABB overlap
function overlaps(a, b) {
  return (
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0 &&
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0
  );
}

// Resolve sprite size from 'rect:N' or fallback to provided default
function resolveSize(node, fallback) {
  const spr = node.getComponent(Sprite);
  if (spr && typeof spr.textureKey === 'string' && spr.textureKey.startsWith('rect:')) {
    const n = parseInt(spr.textureKey.split(':')[1], 10);
    if (!isNaN(n)) return n|0;
  }
  return fallback|0;
}

/**
 * PickupBehavior
 * - On overlap with player AABB: run callback, hide this entity (and disable updates).
 * options: { size?: number, playerSize?: number, onPickup?: (owner)=>void }
 */
export class PickupBehavior extends Behavior {
  constructor(playerNode, options = {}) {
    super();
    this.playerNode = playerNode;
    this.size = options.size ?? 24;
    this.playerSize = options.playerSize ?? 24;
    this.onPickup = typeof options.onPickup === 'function' ? options.onPickup : null;
    this.picked = false;
  }
  onUpdate() {
    if (this.picked) return;
    const tr = this.owner.getComponent(Transform);
    const ptr = this.playerNode.getComponent(Transform);
    if (!tr || !ptr) return;

    const size = resolveSize(this.owner, this.size);
    const psize = this.playerSize;

    const a = { x: tr.position.x, y: tr.position.y, w: size, h: size };
    const b = { x: ptr.position.x, y: ptr.position.y, w: psize, h: psize };
    if (overlaps(a, b)) {
      this.picked = true;
      // Hide sprite
      const s = this.owner.getComponent(Sprite);
      if (s && s._pixi) s._pixi.visible = false;
      // Optional callback
      if (this.onPickup) try { this.onPickup(this.owner); } catch(e) { /* no-op */ }
      // Stop ticking
      this.setEnabled(false);
    }
  }
}
