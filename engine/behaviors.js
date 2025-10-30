// !mpact2d — Behavior system (minimal) + PickupBehavior (HOTFIX: no setEnabled())
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
 * PickupBehavior (HOTFIX)
 * - On overlap with player: hide self, call callback.
 * - We avoid calling this.setEnabled() (not provided by Component base).
 * - Instead we set an internal flag `picked` and early-return on update.
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
    if (this.picked) return; // guard
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
      if (this.onPickup) { try { this.onPickup(this.owner); } catch(e) {} }
      // No disable call; guard prevents further work
    }
  }
}


/**
 * PatrolBehavior
 * Simple ping-pong patrol between two points along one axis.
 * options: { axis: 'x'|'y', from: number, to: number, speed?: number, pauseMs?: number }
 */
export class PatrolBehavior extends Behavior {
  constructor(options = {}){
    super();
    this.axis = options.axis || 'x';
    this.from = options.from ?? 0;
    this.to = options.to ?? 0;
    this.speed = options.speed ?? 0.12; // world units per ms (consistent with player base speed 0.25)
    this.pauseMs = options.pauseMs ?? 300;
    this._dir = 1; // 1 forward, -1 backward
    this._pausedUntil = 0;
  }
  onStart(){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    if(this.axis==='x'){ tr.position.x = this.from; }
    else { tr.position.y = this.from; }
  }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const now = performance.now();
    if(now < this._pausedUntil) return;

    const axis = this.axis;
    const pos = axis==='x' ? tr.position.x : tr.position.y;
    const targetMin = Math.min(this.from, this.to);
    const targetMax = Math.max(this.from, this.to);
    let next = pos + this._dir * this.speed * dt;

    if(next <= targetMin){
      next = targetMin;
      this._dir = 1;
      this._pausedUntil = now + this.pauseMs;
    } else if(next >= targetMax){
      next = targetMax;
      this._dir = -1;
      this._pausedUntil = now + this.pauseMs;
    }

    if(axis==='x'){ tr.position.x = next; }
    else { tr.position.y = next; }

    // Update sprite position if available
    const spr = this.owner.getComponent(Sprite);
    if(spr && spr._pixi){
      spr._pixi.x = tr.position.x;
      spr._pixi.y = tr.position.y;
    }
  }
}
