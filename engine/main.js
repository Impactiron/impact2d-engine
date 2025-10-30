const BUILD = "MAP-LOADER-2025-10-30";

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
import { loadMap, queryMapName } from './map-loader.js';

const scene = new Scene('Root');
const PLAYER_SIZE = 24;

const playerNode = new Node('Player');
const t = playerNode.addComponent(new Transform());
t.position.x = 32 * 3;
t.position.y = 32 * 3;
const playerSprite = playerNode.addComponent(new Sprite('rect:'+PLAYER_SIZE));
playerSprite.layer = 'default';
scene.add(playerNode);

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

class CameraFollow extends Component {
  constructor(renderer){ super(); this.r = renderer; }
  onUpdate(){ const tr = this.owner.getComponent(Transform); if(tr) this.r.setCamera(tr.position.x, tr.position.y); }
}

const game = new Game();
const renderer = new PixiRenderer();

renderer.init().then(async ()=>{
  renderer.defineLayer('world', 1.0);
  renderer.defineLayer('default', 1.0);
  const input = new Input();

  // Map laden (+ Fallback)
  const mapName = queryMapName();
  let map;
  try {
    map = await loadMap(mapName);   // lädt korrekt maps/<name>.json
  } catch(e){
    console.error('MapLoader failed, fallback map used', e);
    map = { name:'Fallback', tileSize:32, width:20, height:15,
      palette: { 0:0x202733,1:0x586174,2:0xb24b36,3:0x2f6aa5,4:0xa68a5b },
      tiles: Array.from({ length:15 }, (_,y)=>Array.from({ length:20 },(_,x)=> (x===0||y===0||x===19||y===14)?1:0)),
      entities:[{type:'gem',x:15*32,y:9*32},{type:'crate',x:12*32,y:9*32},{type:'bot',x:10*32,y:9*32}],
      triggers:[]
    };
  }

  const TS = map.tileSize|0, W = map.width|0, H = map.height|0;

  // Tiles rendern
  const cont = renderer.getLayerContainer('world');
  cont.removeChildren();
  for(let y=0;y<H;y++){ for(let x=0;x<W;x++){
    const v = (map.tiles[y]&&map.tiles[y][x]) ?? 0;
    const col = map.palette[String(v)] ?? map.palette[v] ?? 0x333333;
    const g = new Graphics(); g.rect(0,0,TS,TS).fill(col); g.x=x*TS; g.y=y*TS; cont.addChild(g);
  }} 

  // Movement & Physics
  const mover = playerNode.addComponent(new MoveScript(input, ()=>{
    const cx = Math.floor((t.position.x + PLAYER_SIZE/2)/TS);
    const cy = Math.floor((t.position.y + PLAYER_SIZE/2)/TS);
    const id = (map.tiles[cy] && map.tiles[cy][cx]) ?? 0;
    return (TileTypes[id]?.speedMul ?? 1.0);
  }));

  function resolveEntityCollisions(rect) {
    let rx = rect.x, ry = rect.y; const rw = rect.w, rh = rect.h;
    for (const c of getColliders()) { if (!c.solid) continue; if (c.owner === playerNode) continue;
      const b = c.getAABB(); const overlapX = Math.min(rx+rw, b.x+b.w) - Math.max(rx, b.x);
      const overlapY = Math.min(ry+rh, b.y+b.h) - Math.max(ry, b.y);
      if (overlapX > 0 && overlapY > 0) { if (overlapX < overlapY) { rx += (rx < b.x ? -overlapX : overlapX); } else { ry += (ry < b.y ? -overlapY : overlapY); } }
    }
    return { x: rx, y: ry };
  }

  class TileAndEntityCollisionResolver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      const rectProvider = ()=>({ x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      let res = moveWithTileCollisions(playerNode, mover.dx||0, mover.dy||0, map.tiles, TS, rectProvider);
      res = resolveEntityCollisions({ x: res.x, y: res.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      tr.position.x = res.x; tr.position.y = res.y;
      const spr = playerNode.getComponent(Sprite);
      if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
    }
  }
  playerNode.addComponent(new TileAndEntityCollisionResolver());

  // Entities
  const factory = new EntityFactory();
  factory.register('crate', { sprite:'rect:18', layer:'default', props:{ loot:1 }, collider:{ size:18, solid:true } });
  factory.register('gem',   { sprite:'rect:24', layer:'default', props:{ value:10 }, collider:null });
  factory.register('bot',   { sprite:'rect:16', layer:'default', props:{ hp:5 }, collider:{ size:16, solid:true } });

  let gemCountLocal = 0;
  for (const e of map.entities) {
    const n = factory.spawn(e.type, { x: e.x|0, y: e.y|0 }); if(!n) continue;
    scene.add(n);
    if (e.behavior && e.behavior.patrol) {
      const p = e.behavior.patrol;
      n.addComponent(new PatrolBehavior({ axis:p.axis||'x', from:(p.from??0)|0, to:(p.to??0)|0, speed:p.speed??0.10, pauseMs:p.pauseMs??300 }));
    }
    if (e.type === 'gem') {
      n.addComponent(new PickupBehavior(playerNode, { size:24, playerSize:PLAYER_SIZE, onPickup:()=>{ gemCountLocal+=1; lastEvent='Item collected (+1)'; } }));
    }
  }

  // Triggers
  const triggers = new TriggerSystem();
  for (const tr of (map.triggers||[])) {
    const r = tr.rect || [0,0,0,0];
    triggers.add({
      x:r[0]|0,y:r[1]|0,w:r[2]|0,h:r[3]|0, once:!!tr.once,
      onEnter: tr.onEnter ? (()=>{ lastEvent = tr.onEnter; }) : undefined,
      onExit: tr.onExit ? (()=>{ lastEvent = tr.onExit; }) : undefined,
      onStay: tr.onStay ? (()=>{ lastEvent = tr.onStay; }) : undefined
    });
  }
  class TriggerDriver extends Component { onUpdate(){ const tr=playerNode.getComponent(Transform); const rect={x:tr.position.x,y:tr.position.y,w:PLAYER_SIZE,h:PLAYER_SIZE}; triggers.tick(rect, { time: performance.now() }); } }
  playerNode.addComponent(new TriggerDriver());

  // Start
  renderer.attach(scene);
  playerNode.addComponent(new CameraFollow(renderer));
  game.start(scene);

  // HUD
  const hud = document.getElementById('hud');
  let last = performance.now(), frames=0, fps=0; let lastEvent = '';
  function meter(){
    const now = performance.now(); frames++; if(now-last>=1000){ fps=frames; frames=0; last=now; }
    const base = '!mpact2d • ' + BUILD + ' • Map: ' + (map?.name || 'n/a') + ' • FPS: ' + fps + ' • Gems: ' + gemCountLocal;
    hud.textContent = lastEvent ? base + ' • ' + lastEvent : base;
    requestAnimationFrame(meter);
  }
  meter();
});
