const BUILD = "TILEMAP-RENDER-2025-10-29";

import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';
import { Tilemap } from './tilemap.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

// Scene & Player
const scene = new Scene('Root');

const player = new Node('Player');
const t = player.addComponent(new Transform());
t.position.x = 32 * 3;
t.position.y = 32 * 3;
const playerSprite = player.addComponent(new Sprite('rect:24'));
playerSprite.layer = 'default';
scene.add(player);

// Simple movement
class MoveScript extends Component {
  constructor(input){ super(); this.input = input; this.speed = 0.25; }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const s = this.speed * dt;
    if(this.input.get('ArrowLeft').down || this.input.get('KeyA').down) tr.position.x -= s;
    if(this.input.get('ArrowRight').down || this.input.get('KeyD').down) tr.position.x += s;
    if(this.input.get('ArrowUp').down || this.input.get('KeyW').down) tr.position.y -= s;
    if(this.input.get('ArrowDown').down || this.input.get('KeyS').down) tr.position.y += s;
    const spr = this.owner.getComponent(Sprite);
    if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
  }
}
const input = new Input();
player.addComponent(new MoveScript(input));

// Camera follow
class CameraFollow extends Component {
  constructor(renderer){ super(); this.r = renderer; }
  onUpdate(){ 
    const tr = this.owner.getComponent(Transform);
    if(tr) this.r.setCamera(tr.position.x, tr.position.y);
  }
}

// Build a demo tilemap (render-only)
// 0 = floor, 1 = wall
const W = 40, H = 30, TS = 32;
const tiles = [];
for(let y=0;y<H;y++){
  const row = [];
  for(let x=0;x<W;x++){
    if(x===0||y===0||x===W-1||y===H-1) row.push(1); // border walls
    else if((x+y)%11===0) row.push(1);             // some pattern
    else row.push(0);
  }
  tiles.push(row);
}
const palette = { 0: 0x202733, 1: 0x586174 }; // darker floor, lighter walls
const tilemap = new Tilemap({ tiles, tileSize: TS, palette });

// Start engine + renderer
const game = new Game();
const renderer = new PixiRenderer();

renderer.init().then(()=>{
  renderer.defineLayer('sky', 0.2);
  renderer.defineLayer('far', 0.5);
  renderer.defineLayer('mid', 0.8);
  renderer.defineLayer('default', 1.0);
  
  // Draw tilemap into 'mid' layer using PIXI Graphics
  const cont = renderer.getLayerContainer('mid');
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

  renderer.attach(scene);
  player.addComponent(new CameraFollow(renderer));
  game.start(scene);
});

// HUD with build + FPS
let last = performance.now(), frames=0, fps=0;
const hud = document.getElementById('hud');
function meter(){
  const now = performance.now(); frames++;
  if(now - last >= 1000){ fps = frames; frames=0; last = now; hud.textContent = `!mpact2d • {BUILD} • FPS: ${fps}`; }
  requestAnimationFrame(meter);
}
meter();
