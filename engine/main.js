const BUILD = "ENTITY-FACTORY-GEMFIX-2025-10-29";

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
  onUpdate(){ 
    const tr = this.owner.getComponent(Transform);
    if(tr) this.r.setCamera(tr.position.x, tr.position.y);
  }
}

const W = 40, H = 30, TS = 32;
const tiles = [];
for(let y=0;y<H;y++){
  const row = [];
  for(let x=0;x<W;x++){
    let v = 0;
    if(x===0||y===0||x===W-1||y===H-1) v = 1;
    else if((x+y)%19===0) v = 1;
    else if((x*y)%113===0) v = 2;
    else if((x+2*y)%37===0) v = 3;
    else if((2*x+y)%41===0) v = 4;
    row.push(v);
  }
  tiles.push(row);
}
for(let yy=1; yy<=10; yy++){ for(let xx=1; xx<=12; xx++){ tiles[yy][xx] = 0; } }
for(let yy=8; yy<=10; yy++){ for(let xx=12; xx<=24; xx++){ tiles[yy][xx] = 0; } }
for(let yy=8; yy<=9; yy++){ for(let xx=22; xx<=24; xx++){ tiles[yy][xx] = 2; } }
// Guarantee the gem tile is floor
tiles[9][15] = 0;

const palette = { 0:0x202733, 1:0x586174, 2:0xb24b36, 3:0x2f6aa5, 4:0xa68a5b };

const game = new Game();
const renderer = new PixiRenderer();

renderer.init().then(()=>{
  renderer.defineLayer('world', 1.0);
  renderer.defineLayer('default', 1.0);

  const cont = renderer.getLayerContainer('world');
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const v = tiles[y][x];
      const col = palette[v] ?? 0x333333;
      const g = new Graphics();
      g.rect(0,0,TS,TS).fill(col);
      g.x = x*TS; g.y = y*TS;
      cont.addChild(g);
    }
  }

  const input = new Input();
  const mover = playerNode.addComponent(new MoveScript(input, ()=>{
    const cx = Math.floor((t.position.x + PLAYER_SIZE/2)/TS);
    const cy = Math.floor((t.position.y + PLAYER_SIZE/2)/TS);
    const id = (tiles[cy] && tiles[cy][cx]) ?? 0;
    return (TileTypes[id]?.speedMul ?? 1.0);
  }));

  class TileCollisionResolver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      const rectProvider = ()=>({ x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      const res = moveWithTileCollisions(playerNode, mover.dx||0, mover.dy||0, tiles, TS, rectProvider);
      tr.position.x = res.x; tr.position.y = res.y;
      const spr = playerNode.getComponent(Sprite);
      if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
    }
  }
  playerNode.addComponent(new TileCollisionResolver());

  // Factory
  const factory = new EntityFactory();
  factory.register('crate', { sprite:'rect:18', layer:'default', props:{ loot:1 } });
  factory.register('gem',   { sprite:'rect:24', layer:'default', props:{ value:10 } }); // bigger & clearer
  factory.register('bot',   { sprite:'rect:16', layer:'default', props:{ hp:5 } });

  const gem = factory.spawn('gem',   { x: 15*TS, y: 9*TS }); // moved left by one tile
  const crate = factory.spawn('crate', { x: 18*TS, y: 9*TS });
  const bot = factory.spawn('bot',   { x: 20*TS, y: 9*TS });
  scene.add(gem); scene.add(crate); scene.add(bot);

  // Triggers + HUD
  const triggers = new TriggerSystem();
  let lastEvent = "";
  const zone = (tx, ty, tw, th, opts={}) => ({ x: tx*TS, y: ty*TS, w: tw*TS, h: th*TS, ...opts });
  triggers.add(zone(3,2,3,2,{ tag:'hint', once:true, onEnter:() => { lastEvent='Tipp: WASD oder Pfeile zum Bewegen'; } }));
  triggers.add(zone(14,9,2,2,{ tag:'slow-info', onStay:() => { lastEvent='Hinweis: Wasser/Sand verlangsamen'; } }));
  // pickup zone aligned to gem's tile
  triggers.add(zone(15,9,1,1,{ tag:'pickup', once:true, onEnter:() => { lastEvent='Item aufgenommen (+1)'; if(gem && gem.getComponent) { const s = gem.getComponent(Sprite); if(s && s._pixi) s._pixi.visible = false; } } }));
  triggers.add(zone(22,8,3,2,{ tag:'lava', onEnter:() => { lastEvent='Achtung: Lava!'; }, onExit:() => { lastEvent='Raus aus der Lava.'; } }));

  class TriggerDriver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      const rect = { x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE };
      triggers.tick(rect, { time: performance.now() });
    }
  }
  playerNode.addComponent(new TriggerDriver());

  renderer.attach(scene);
  playerNode.addComponent(new CameraFollow(renderer));
  game.start(scene);

  const hud = document.getElementById('hud');
  let last = performance.now(), frames=0, fps=0;
  function meter(){
    const now = performance.now(); frames++;
    if(now - last >= 1000){ fps = frames; frames=0; last = now; }
    const base = '!mpact2d • ' + BUILD + ' • FPS: ' + fps;
    hud.textContent = lastEvent ? base + ' • ' + lastEvent : base;
    requestAnimationFrame(meter);
  }
  meter();
});
