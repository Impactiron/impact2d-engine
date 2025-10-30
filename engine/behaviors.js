// !mpact2d — Behavior system: Pickup + Patrol
import { Component, Transform } from './component.js';
import { Sprite } from './sprite.js';

export class Behavior extends Component { constructor(){ super(); } }

function overlaps(a, b){
  return (Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0 &&
          Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0);
}
function resolveSize(node, fallback){
  const spr = node.getComponent(Sprite);
  if(spr && typeof spr.textureKey==='string' && spr.textureKey.startsWith('rect:')){
    const n = parseInt(spr.textureKey.split(':')[1], 10);
    if(!isNaN(n)) return n|0;
  }
  return fallback|0;
}

export class PickupBehavior extends Behavior{
  constructor(playerNode, options={}){
    super();
    this.playerNode = playerNode;
    this.size = options.size ?? 24;
    this.playerSize = options.playerSize ?? 24;
    this.onPickup = typeof options.onPickup==='function' ? options.onPickup : null;
    this.picked = false;
  }
  onUpdate(){
    if(this.picked) return;
    const tr = this.owner.getComponent(Transform);
    const ptr = this.playerNode.getComponent(Transform);
    if(!tr || !ptr) return;
    const a = { x: tr.position.x, y: tr.position.y, w: resolveSize(this.owner,this.size), h: resolveSize(this.owner,this.size) };
    const b = { x: ptr.position.x, y: ptr.position.y, w: this.playerSize, h: this.playerSize };
    if(overlaps(a,b)){
      this.picked = true;
      const s = this.owner.getComponent(Sprite);
      if(s && s._pixi) s._pixi.visible = false;
      if(this.onPickup){ try{ this.onPickup(this.owner); }catch(e){} }
    }
  }
}

export class PatrolBehavior extends Behavior{
  constructor(options={}){
    super();
    this.axis = options.axis || 'x';
    this.from = options.from ?? 0;
    this.to = options.to ?? 0;
    this.speed = options.speed ?? 0.10;
    this.pauseMs = options.pauseMs ?? 300;
    this._dir = 1;
    this._pausedUntil = 0;
  }
  onStart(){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    if(this.axis==='x') tr.position.x = this.from;
    else tr.position.y = this.from;
  }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const now = performance.now();
    if(now < this._pausedUntil) return;
    const pos = this.axis==='x' ? tr.position.x : tr.position.y;
    const lo = Math.min(this.from,this.to), hi = Math.max(this.from,this.to);
    let next = pos + this._dir * this.speed * dt;
    if(next <= lo){ next = lo; this._dir = 1; this._pausedUntil = now + this.pauseMs; }
    if(next >= hi){ next = hi; this._dir = -1; this._pausedUntil = now + this.pauseMs; }
    if(this.axis==='x') tr.position.x = next; else tr.position.y = next;
    const spr = this.owner.getComponent(Sprite);
    if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
  }
}
