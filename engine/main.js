
if (!window.factory) {
  try { registerDefaultPrefabs(); } catch (e) { console.warn('registerDefaultPrefabs()', e); }
  window.factory = factory;
}

const BUILD = "MAPLOADER-HOTFIX2-2025-11-01";

import { factory, registerDefaultPrefabs } from './factory.js';

// --- factory bootstrap (single instance via window.factory) ---
catch (e) { console.warn('registerDefaultPrefabs()', e); }
  window.factory = factory;
} catch (e) { console.warn('registerDefaultPrefabs()', e); }
  window.factory = factory;
}
import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';
import { TileTypes, moveWithTileCollisions } from './tilemap-physics.js';
import { TriggerSystem } from './triggers.js';
import { getColliders } from './collider.js';
import { PickupBehavior, PatrolBehavior } from './behaviors.js';
import { MapLoader } from './maploader.js';

// Ensure a global factory instance for debug/test spawns
if (!(typeof window !== 'undefined' && window.factory)) {
  try {
    const __f = /* removed EntityFactory */;
    registerDefaultPrefabs(__f);
    if (typeof window !== 'undefined') window.factory = __f;
    // fall back to global var as well
    // eslint-disable-next-line no-var

  } catch (err) {
    console.error('[factory-boot]', err);
  }
} else {
  // eslint-disable-next-line no-var

}


// Scene & Player
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

// Camera follow
class CameraFollow extends Component {
  constructor(renderer){ super(); this.r = renderer; }
  onUpdate(){ 
    const tr = this.owner.getComponent(Transform);
    if(tr) this.r.setCamera(tr.position.x, tr.position.y);
  }
}

const game = new Game();
const renderer = new PixiRenderer();

// Shared state
let tiles = null, TS = 32;
let lastEvent = "";
let gemCount = 0;

function makeFallbackTiles() {
  const W = 40, H = 30; TS = 32;
  const t = [];
  for(let y=0;y<H;y++){ 
    const row=[];
    for(let x=0;x<W;x++){ 
      let v=0;
      if(x===0||y===0||x===W-1||y===H-1) v=1;
      else if((x+y)%19===0) v=1;
      else if((x*y)%113===0) v=2;
      else if((x+2*y)%37===0) v=3;
      else if((2*x+y)%41===0) v=4;
      row.push(v);
    } 
    t.push(row); 
  }
  // clear corridors and add lava patch
  for(let yy=1; yy<=10; yy++){ for(let xx=1; xx<=12; xx++) t[yy][xx]=0; }
  for(let yy=8; yy<=10; yy++){ for(let xx=12; xx<=24; xx++) t[yy][xx]=0; }
  for(let yy=8; yy<=9; yy++){ for(let xx=22; xx<=24; xx++) t[yy][xx]=2; }
  t[9][15]=0;
  return t;
}

renderer.init().then(async ()=>{
  const hud = document.getElementById('hud');
  const loader = new MapLoader(renderer);
  let mapMeta = null; let mapName = 'fallback';
  try {
    const res = await loader.loadAuto();
    const data = res.data;
    mapMeta = loader.buildFromData(scene, data);
    TS = mapMeta.tileSize; tiles = data.tiles; mapName = data.name || res.url;
    lastEvent = 'Map loaded: ' + mapName;
  } catch(e) {
    // Fallback to generated tiles
    renderer.defineLayer('world', 1.0);
    renderer.defineLayer('default', 1.0);
    tiles = makeFallbackTiles();
    const palette = { 0:0x202733, 1:0x586174, 2:0xb24b36, 3:0x2f6aa5, 4:0xa68a5b };
    const cont = renderer.getLayerContainer('world');
    for(let y=0;y<tiles.length;y++){ 
      for(let x=0;x<tiles[y].length;x++){ 
        const v=tiles[y][x]; 
        const col=palette[v]??0x333333; 
        const g=new Graphics(); 
        g.rect(0,0,TS,TS).fill(col); 
        g.x=x*TS; g.y=y*TS; 
        cont.addChild(g); 
      } 
    }
    lastEvent = 'Map fallback active';
  }

  // Ensure default layer exists for sprites
  renderer.defineLayer('default', 1.0);

  // Input + movement
  const input = new Input();
  const mover = playerNode.addComponent(new MoveScript(input, ()=>{
    const tr = playerNode.getComponent(Transform);
    const cx = Math.floor((tr.position.x + PLAYER_SIZE/2)/TS);
    const cy = Math.floor((tr.position.y + PLAYER_SIZE/2)/TS);
    const id = (tiles[cy] && tiles[cy][cx]) ?? 0;
    return (TileTypes[id]?.speedMul ?? 1.0);
  }));

  // Tile + Entity collisions
  function resolveEntityCollisions(rect) {
    let rx = rect.x, ry = rect.y;
    const rw = rect.w, rh = rect.h;
    for (const c of getColliders()) {
      if (!c.solid) continue;
      if (c.owner === playerNode) continue;
      const b = c.getAABB();
      const overlapX = Math.min(rx+rw, b.x+b.w) - Math.max(rx, b.x);
      const overlapY = Math.min(ry+rh, b.y+b.h) - Math.max(ry, b.y);
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) { if (rx < b.x) rx -= overlapX; else rx += overlapX; }
        else { if (ry < b.y) ry -= overlapY; else ry += overlapY; }
      }
    }
    return { x: rx, y: ry };
  }
  class TileAndEntityCollisionResolver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      const rectProvider = ()=>({ x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      let res = moveWithTileCollisions(playerNode, mover.dx||0, mover.dy||0, tiles, TS, rectProvider);
      res = resolveEntityCollisions({ x: res.x, y: res.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      tr.position.x = res.x; tr.position.y = res.y;
      const spr = playerNode.getComponent(Sprite);
      if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
    }
  }
  playerNode.addComponent(new TileAndEntityCollisionResolver());

  // Factory defaults (used if map didn't spawn any)

  factory.register('crate', { sprite:'rect:18', layer:'default', props:{ loot:1 }, collider:{ size:18, solid:true } });
  factory.register('gem',   { sprite:'rect:24', layer:'default', props:{ value:10 }, collider:null });
  factory.register('bot',   { sprite:'rect:16', layer:'default', props:{ hp:5 }, collider:{ size:16, solid:true } });

  if (!scene.children.some(n => (n.name||'').toLowerCase().includes('gem'))) {
    const gem = window.factory.spawn('gem',   { x: 15*TS, y: 9*TS });
    const crate = window.factory.spawn('crate', { x: 18*TS, y: 9*TS });
    const bot = window.factory.spawn('bot',   { x: 20*TS, y: 9*TS });
    scene.add(gem); scene.add(crate); scene.add(bot);
  }

  // Attach behaviors
  for (const n of scene.children) {
    const nm = (n.name||'').toLowerCase();
    if (nm.includes('gem')) {
      n.addComponent(new PickupBehavior(playerNode, { size: 24, playerSize: PLAYER_SIZE, onPickup: () => { gemCount += 1; lastEvent = 'Item collected (+1)'; } }));
    }
    if (nm.includes('bot')) {
      n.addComponent(new PatrolBehavior({ axis: 'x', from: 18*TS, to: 24*TS, speed: 0.10, pauseMs: 300 }));
    }
  }

  // Triggers
  const triggers = new TriggerSystem();
  const zone = (tx, ty, tw, th, opts={}) => ({ x: tx*TS, y: ty*TS, w: tw*TS, h: th*TS, ...opts });
  triggers.add(zone(3,2,3,2,{ tag:'hint', once:true, onEnter:() => { lastEvent='Map active • Use WASD/Arrows'; } }));
  class TriggerDriver extends Component { onUpdate(){ const tr = playerNode.getComponent(Transform); const rect = { x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE }; triggers.tick(rect, { time: performance.now() }); } }
  playerNode.addComponent(new TriggerDriver());

  // Start
  renderer.attach(scene);
  playerNode.addComponent(new CameraFollow(renderer));
  game.start(scene);

  // HUD meter
  let last = performance.now(), frames=0, fps=0;
  function meter(){
    const now = performance.now(); frames++;
    if(now - last >= 1000){ fps = frames; frames=0; last = now; }
    const base = '!mpact2d • ' + BUILD + ' • FPS: ' + fps + ' • Gems: ' + gemCount;
    const hud = document.getElementById('hud');
    hud.textContent = lastEvent ? base + ' • ' + lastEvent : base;
    requestAnimationFrame(meter);
  }
  meter();
});



// === DEBUG v2: Safe entity render even if `data` is undefined ===
try {
  const _data = (typeof data !== 'undefined' && data)
             || (typeof mapData !== 'undefined' && mapData)
             || (typeof level !== 'undefined' && level)
             || (typeof currentMap !== 'undefined' && currentMap)
             || (typeof window !== 'undefined' && window.__mapData)
             || null;
  if (_data) {
    window.__mapData = _data;
    const TS = (_data.tileSize ? _data.tileSize : 32);
    console.log('[map.v2] entities:', _data.entities);
    if (hud && typeof hud.setDebug === 'function') { hud.setDebug(`ents:${(_data.entities && _data.entities.length) || 0}`); }
    if (Array.isArray(_data.entities)) {
      for (const e of _data.entities) {
        try {
          const node = window.factory.spawn(e.type, { x: ((e.x||0)*TS), y: ((e.y||0)*TS), layer: 'actors' });
          if (node && node.get) { try { const s = node.get(Sprite); if (s && 'tint' in s) s.tint = (e.type==='gem')?0x5edfff:(e.type==='bot')?0xff5353:(e.type==='crate')?0xffcc33:0xffffff; } catch {} }
          scene.add(node);
          console.log('[spawn.v2]', e.type, 'at', node && node.transform && node.transform.position, 'layer=actors');
        } catch (err) { console.error('[spawn-error.v2]', e, err); }
      }
    }
  } else {
    console.warn('[map.v2] no map data reference available.');
  }
} catch (err) { console.error('[entities-debug.v2]', err); }

// Keep the 3 hard-coded markers as a visibility check
try {
  for (let i=0;i<3;i++) {
    const n = window.factory.spawn('gem', { x: 300 + i*40, y: 340, layer: 'actors' });
    if (n && n.get) { try { const s = n.get(Sprite); if (s && 'tint' in s) s.tint = 0x5edfff; } catch {} }
    scene.add(n);
  }
  console.log('[debug.v2] 3 hard-coded markers spawned on actors');
} catch (err) { console.error('[debug-markers.v2]', err); }