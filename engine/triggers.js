// Simple rectangular Trigger Zones for !mpact2d
export class TriggerSystem {
  constructor() {
    this.zones = []; // {x,y,w,h, tag, once, onEnter,onExit,onStay, _inside:false, _dead:false}
  }
  add(zone) {
    const z = Object.assign({ tag:'', once:false, onEnter:null, onExit:null, onStay:null, _inside:false, _dead:false }, zone);
    this.zones.push(z);
    return z;
  }
  clear() { this.zones.length = 0; }
  static _intersects(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }
  tick(actorRect, context={}) {
    for (const z of this.zones) {
      if (z._dead) continue;
      const hit = TriggerSystem._intersects(actorRect, z);
      if (hit) {
        if (!z._inside) {
          z._inside = true;
          if (typeof z.onEnter === 'function') z.onEnter({ zone:z, actorRect, context });
          if (z.once) z._dead = true;
        } else {
          if (typeof z.onStay === 'function') z.onStay({ zone:z, actorRect, context });
        }
      } else if (z._inside) {
        z._inside = false;
        if (typeof z.onExit === 'function') z.onExit({ zone:z, actorRect, context });
      }
    }
    this.zones = this.zones.filter(z => !z._dead);
  }
}
