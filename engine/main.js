const BUILD = "TRIGGERS-2025-10-29";

import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';
import { TileTypes, moveWithTileCollisions } from './tilemap-physics.js';
import { TriggerSystem } from './triggers.js';

// Scene & Player
const scene = new Scene('Root');

const player = new Node('Player');
const t = player.addComponent(new Transform());
const PLAYER_SIZE = 24;
t.position.x = 32 * 3;
t.position.y = 32 * 3;
const playerSprite = player.addComponent(new Sprite('rect:'+PLAYER_SIZE));
playerSprite.layer = 'default'; // gameplay layer
scene.add(player);

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

// Demo Tilemap: 0=floor, 1=wall, 2=lava, 3=water, 4=sand
const W = 40, H = 30, TS = 32;
const tiles = [];
for(let y=0;y<H;y++){ 
  const row = [];
  for(let x=0;x<W;x++){ 
    let v = 0;
    if(x===0||y===0||x===W-1||y===H-1) v = 1; // border walls
    else if((x+y)%13===0) v = 1;             // walls pattern
    else if((x*y)%97===0) v = 2;             // lava dots
    else if((x+2*y)%29===0) v = 3;           // water traces
    else if((2*x+y)%31===0) v = 4;           // sand patches
    row.push(v);
  }
  tiles.push(row);
}

// Palette for rendering
const palette = { 
  0: 0x202733, // floor
  1: 0x586174, // wall
  2: 0xb24b36, // lava
  3: 0x2f6aa5, // water
  4: 0xa68a5b, // sand
};

// Start engine + renderer
const game = new Game();
const renderer = new PixiRenderer();

renderer.init().then(()=>{
  // Layers
  renderer.defineLayer('sky', 0.2);   // decorative only
  renderer.defineLayer('far', 0.5);   // decorative only
  renderer.defineLayer('world', 1.0); // collidable tiles
  renderer.defineLayer('default', 1.0); // player

  // Draw tilemap into the WORLD layer
  const cont = renderer.getLayerContainer('world');
  for(let y=0;y<H;y++){ 
    for(let x=0;x<W;x++){ 
      const v = tiles[y][x];
      const col = palette[v] ?? 0x333333;
      const g = new Graphics();
      g.rect(0,0,TS,TS).fill(col);
      g.x = x*TS;
      g.y = y*TS;
      cont.addChild(g);
    }
  }

  // Movement + Tile collisions
  const input = new Input();
  const mover = player.addComponent(new MoveScript(input, ()=>{ 
    const cx = Math.floor((t.position.x + PLAYER_SIZE/2)/TS);
    const cy = Math.floor((t.position.y + PLAYER_SIZE/2)/TS);
    const id = (tiles[cy] && tiles[cy][cx]) ?? 0;
    return (TileTypes[id]?.speedMul ?? 1.0);
  }));

  class TileCollisionResolver extends Component {
    onUpdate(){
      const tr = this.owner.getComponent(Transform);
      if(!tr) return;
      const rectProvider = ()=>({ x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      const res = moveWithTileCollisions(this.owner, mover.dx||0, mover.dy||0, tiles, TS, rectProvider);
      tr.position.x = res.x;
      tr.position.y = res.y;
      const spr = this.owner.getComponent(Sprite);
      if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
    }
  }
  player.addComponent(new TileCollisionResolver());

  // === v0.6 Trigger Zones ===
  const triggers = new TriggerSystem();
  const hud = document.getElementById('hud');
  let lastEvent = "";

  // Helper to place zones in tile coords
  const zone = (tx, ty, tw, th, opts={}) => ({ x: tx*TS, y: ty*TS, w: tw*TS, h: th*TS, ...opts });

  // Example zones:
  // 1) Spawn hint (once)
  triggers.add(zone(3,2,2,1,{ tag:'hint', once:true, onEnter:() => { lastEvent='Hint: WASD / Pfeile bewegen'; } }));
  // 2) Slow area info (stay)
  triggers.add(zone(10,10,3,3,{ tag:'water-info', onStay:() => { lastEvent='Du bewegst dich langsamer (Wasser/Sand)'; } }));
  // 3) Fake pickup (once)
  triggers.add(zone(20,6,1,1,{ tag:'pickup', once:true, onEnter:() => { lastEvent='Item aufgenommen (+1)'; } }));
  // 4) Danger tile (lava) enter/exit
  triggers.add(zone(6,18,2,2,{ tag:'lava', onEnter:() => { lastEvent='Achtung: Heiß!'; }, onExit:() => { lastEvent='Puh, raus aus der Lava.'; } }));

  class TriggerDriver extends Component {
    onUpdate(){
      const tr = player.getComponent(Transform);
      const rect = { x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE };
      triggers.tick(rect, { time: performance.now() });
      // Render HUD
      // Keep the classic FPS meter text, append lastEvent if present
      const text = hud.textContent.split(' • FPS:')[0]; // keep left part
      // We'll rewrite in meter() anyway; here we only store message
    }
  }
  player.addComponent(new TriggerDriver());

  renderer.attach(scene);
  player.addComponent(new CameraFollow(renderer));
  game.start(scene);

  // HUD meter with event message
  let last = performance.now(), frames=0, fps=0;
  function meter(){
    const now = performance.now(); frames++;
    if(now - last >= 1000){ fps = frames; frames=0; last = now; }
    const base = `!mpact2d • {BUILD} • FPS: ${fps}`;
    hud.textContent = lastEvent ? base + ' • ' + lastEvent : base;
    requestAnimationFrame(meter);
  }
  meter();
});
