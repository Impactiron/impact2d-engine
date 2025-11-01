// !mpact2d — v0.8 (Guard null tiles in collisions) • 2025-11-01
import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';
import { TileTypes, moveWithTileCollisions } from './tilemap-physics.js';
import { TriggerSystem } from './triggers.js';
import { EntityFactory } from './factory.js';
import { getColliders } from './collider.js';
import { PickupBehavior, PatrolBehavior } from './behaviors.js';
import { MapLoader } from './maploader.js';

const BUILD = "V0.8-GUARD-NULL-TILES-2025-11-01";

// === Scene & Player ===
const scene = new Scene('Root');
const PLAYER_SIZE = 24;
const playerNode = new Node('Player');
const t = playerNode.addComponent(new Transform());
t.position.x = 32 * 3;
t.position.y = 32 * 3;
playerNode.addComponent(new Sprite('rect:'+PLAYER_SIZE)).layer = 'default';
scene.add(playerNode);

// Movement
class MoveScript extends Component {
  constructor(input, getSpeedMul){ super(); this.input = input; this.baseSpeed = 0.25; this.getSpeedMul = getSpeedMul; this.dx=0; this.dy=0; }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const mul = this.getSpeedMul ? this.getSpeedMul() : 1.0;
    const s = this.baseSpeed * dt * mul;
    this.dx = 0; this.dy = 0;
    if(this.input.get('ArrowLeft').down || this.input.get('KeyA').down) this.dx -= s;
    if(this.input.get('ArrowRight').down || this.input.get('KeyD').down) this.dx += s;
    if(this.input.get('ArrowUp').down || this.input.get('KeyW').down) this.dy -= s;
    if(this.input.get('ArrowDown').down || this.input.get('KeyS').down) this.dy += s;
  }
}
class CameraFollow extends Component { constructor(r){ super(); this.r=r; } onUpdate(){ const tr=this.owner.getComponent(Transform); if(tr) this.r.setCamera(tr.position.x,tr.position.y); } }

const game = new Game();
const renderer = new PixiRenderer();

// Shared HUD state
let tiles=null, TS=32, gemCount=0, lastEvent="loading...", mapName="fallback";

// === Behavior attachment from JSON ===
function attachBehaviorsFromJSON(node, specs, playerRef) {
  if (!Array.isArray(specs)) return;
  for (const spec of specs) {
    const name = String(spec?.name||'').toLowerCase();
    const params = spec?.params || {};
    if (name === 'pickup') {
      node.addComponent(new PickupBehavior(playerRef, { size: params.size ?? 24, playerSize: PLAYER_SIZE, onPickup: () => { gemCount += (params.value||1); lastEvent = 'Item collected (+'+(params.value||1)+')'; } }));
    } else if (name === 'patrol') {
      node.addComponent(new PatrolBehavior({ axis: params.axis||'x', from: params.from ?? node.getComponent(Transform)?.position.x ?? 0, to: params.to ?? (node.getComponent(Transform)?.position.x ?? 0)+64, speed: params.speed ?? 0.1, pauseMs: params.pauseMs ?? 300 }));
    } else {
      console.warn('Unknown behavior in JSON:', name);
    }
  }
}

// === Tile+Entity collisions ===
function resolveEntityCollisions(subjectNode, rect) {
  let rx = rect.x, ry = rect.y; const rw=rect.w, rh=rect.h;
  for (const c of getColliders()) {
    if (!c.solid) continue;
    if (c.owner === subjectNode) continue;
    const b = c.getAABB();
    const overlapX = Math.min(rx+rw, b.x+b.w) - Math.max(rx, b.x);
    const overlapY = Math.min(ry+rh, b.y+b.h) - Math.max(ry, b.y);
    if (overlapX > 0 && overlapY > 0) {
      if (overlapX < overlapY) { if (rx < b.x) rx -= overlapX; else rx += overlapX; }
      else { if (ry < b.y) ry -= overlapY; else ry += overlapY; }
    }
  }
  return {x:rx,y:ry};
}

// === Boot ===
renderer.init().then(async ()=>{
  const hud = document.getElementById('hud');
  // Layers
  renderer.defineLayer('world', 1.0);
  renderer.defineLayer('default', 1.0);

  // Input + Movement
  const input = new Input();
  const mover = playerNode.addComponent(new MoveScript(input, ()=>{ 
    if(!tiles) return 1.0;
    const tr = playerNode.getComponent(Transform);
    const cx = Math.floor((tr.position.x + PLAYER_SIZE/2)/TS);
    const cy = Math.floor((tr.position.y + PLAYER_SIZE/2)/TS);
    const id = (tiles?.[cy]?.[cx]) ?? 0;
    return (TileTypes[id]?.speedMul ?? 1.0);
  }));
  class TileAndEntityCollisionResolver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      if(!tiles){ // map not ready yet: free move without collisions
        tr.position.x += mover.dx||0; tr.position.y += mover.dy||0;
        const spr = playerNode.getComponent(Sprite); if(spr&&spr._pixi){ spr._pixi.x=tr.position.x; spr._pixi.y=tr.position.y; }
        return;
      }
      const rectProvider = ()=>({ x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      let res = moveWithTileCollisions(playerNode, mover.dx||0, mover.dy||0, tiles, TS, rectProvider);
      res = resolveEntityCollisions(playerNode, { x: res.x, y: res.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      tr.position.x = res.x; tr.position.y = res.y;
      const spr = playerNode.getComponent(Sprite); if(spr&&spr._pixi){ spr._pixi.x=tr.position.x; spr._pixi.y=tr.position.y; }
    }
  }
  playerNode.addComponent(new TileAndEntityCollisionResolver());

  // Camera + start
  renderer.attach(scene);
  playerNode.addComponent(new CameraFollow(renderer));
  game.start(scene);

  // === Factory defaults ===
  const factory = new EntityFactory();
  factory.register('crate', { sprite:'rect:18', layer:'default', props:{ loot:1 }, collider:{ size:18, solid:true } });
  factory.register('gem',   { sprite:'rect:24', layer:'default', props:{ value:10 }, collider:null });
  factory.register('bot',   { sprite:'rect:16', layer:'default', props:{ hp:5 }, collider:{ size:16, solid:true } });

  // === Load map + spawn entities from JSON ===
  try {
    const loader = new MapLoader(renderer);
    const res = await loader.loadAuto();
    const data = res.data; TS = data.tileSize||32; tiles = data.tiles; mapName = data.name || res.url;
    lastEvent = 'Map loaded: '+mapName;
    if (Array.isArray(data.entities)) {
      for (const e of data.entities) {
        const n = factory.spawn(String(e.type||'').toLowerCase(), { x:(e.x||0)*TS, y:(e.y||0)*TS, layer:e.layer });
        if (n) { attachBehaviorsFromJSON(n, e.behaviors, playerNode); scene.add(n); }
      }
    }
  } catch (err) {
    // Fallback arena + defaults
    TS = 32;
    const W=40,H=30; const palette={0:0x202733,1:0x586174,2:0xb24b36,3:0x2f6aa5,4:0xa68a5b};
    tiles=[]; for(let y=0;y<H;y++){ const row=[]; for(let x=0;x<W;x++){ let v=0; if(x===0||y===0||x===W-1||y===H-1) v=1; else if((x+y)%19===0) v=1; else if((x*y)%113===0) v=2; else if((x+2*y)%37===0) v=3; else if((2*x+y)%41===0) v=4; row.push(v); } tiles.push(row);}
    const cont=renderer.getLayerContainer('world');
    for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ const col=palette[tiles[y][x]]??0x333333; const g=new Graphics(); g.rect(0,0,TS,TS).fill(col); g.x=x*TS; g.y=y*TS; cont.addChild(g); } }
    lastEvent='Map fallback active';
    const gem=factory.spawn('gem',{x:15*TS,y:9*TS}); const crate=factory.spawn('crate',{x:18*TS,y:9*TS}); const bot=factory.spawn('bot',{x:20*TS,y:9*TS});
    scene.add(gem); scene.add(crate); scene.add(bot);
    attachBehaviorsFromJSON(gem,[{name:'pickup',params:{value:1,size:24}}], playerNode);
    attachBehaviorsFromJSON(bot,[{name:'patrol',params:{axis:'x',from:18*TS,to:24*TS,speed:0.1}}], playerNode);
  }

  // HUD: tile hints
  class TileHintDriver extends Component { constructor(){ super(); this.lastId=-1; this.cooldown=0; } onUpdate(dt){ if(!tiles) return; const tr=playerNode.getComponent(Transform); const cx=Math.floor((tr.position.x+PLAYER_SIZE/2)/TS); const cy=Math.floor((tr.position.y+PLAYER_SIZE/2)/TS); const id=(tiles?.[cy]?.[cx])??0; if(id!==this.lastId||this.cooldown<=0){ if(id===2) lastEvent='Warning: lava!'; else if(id===3||id===4) lastEvent='Info: water/sand slow movement'; else lastEvent='Map active'; this.lastId=id; this.cooldown=300; } else this.cooldown-=(dt||16); } }
  playerNode.addComponent(new TileHintDriver());

  // HUD meter
  let last=performance.now(), frames=0, fps=0; function meter(){ const now=performance.now(); frames++; if(now-last>=1000){ fps=frames; frames=0; last=now; } const base='!mpact2d • '+BUILD+' • FPS: '+fps+' • Gems: '+gemCount+' • Map: '+mapName+' • Map loaded: '+(tiles?'yes':'no'); hud.textContent = lastEvent ? base + ' • ' + lastEvent : base; requestAnimationFrame(meter); } meter();
});
