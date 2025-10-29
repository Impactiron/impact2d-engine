// Very small AABB + slide movement helper for !mpact2d

import { Transform } from './component.js';
import { Sprite } from './sprite.js';

export function rectSizeFromSprite(sprite){
  // sprite.texture: 'rect:56' or 'rect:56x24' or other (assume 48x48)
  if(!sprite || typeof sprite.texture !== 'string') return {w:48,h:48};
  if(!sprite.texture.startsWith('rect:')) return {w:48,h:48};
  const body = sprite.texture.split(':')[1] ?? '48';
  if(body.includes('x')){
    const [sw, sh] = body.split('x');
    const w = Math.max(1, parseInt(sw,10)||48);
    const h = Math.max(1, parseInt(sh,10)||48);
    return {w,h};
  } else {
    const s = Math.max(1, parseInt(body,10)||48);
    return {w:s,h:s};
  }
}

export function aabbOf(node){
  const tr = node.getComponent(Transform);
  const spr = node.getComponent(Sprite);
  const {w,h} = rectSizeFromSprite(spr);
  const x = tr ? tr.position.x : 0;
  const y = tr ? tr.position.y : 0;
  return {x,y,w,h};
}

export function intersects(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function moveWithCollisions(node, dx, dy, colliders){
  const tr = node.getComponent(Transform);
  const spr = node.getComponent(Sprite);
  if(!tr) return {dx:0, dy:0};
  const {w,h} = rectSizeFromSprite(spr);
  const eps = 0.001;

  // Move X
  let nx = tr.position.x + dx;
  let ny = tr.position.y;
  let ax = {x:nx, y:ny, w, h};
  for(const c of colliders){
    if(intersects(ax, c)){
      if(dx > 0){
        nx = c.x - w - eps;
      } else if (dx < 0){
        nx = c.x + c.w + eps;
      }
      ax.x = nx;
    }
  }
  tr.position.x = nx;

  // Move Y
  ny = tr.position.y + dy;
  ax = {x:tr.position.x, y:ny, w, h};
  for(const c of colliders){
    if(intersects(ax, c)){
      if(dy > 0){
        ny = c.y - h - eps;
      } else if (dy < 0){
        ny = c.y + c.h + eps;
      }
      ax.y = ny;
    }
  }
  tr.position.y = ny;

  return {dx: tr.position.x - (nx - dx), dy: tr.position.y - (ny - dy)};
}
