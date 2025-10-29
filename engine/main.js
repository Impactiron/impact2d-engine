const BUILD = "PARALLAX-2025-10-29b";

import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';

// Scene setup
const scene = new Scene('Root');

// Player
const player = new Node('Player');
const t = player.addComponent(new Transform());
t.position.x = 0;
t.position.y = 0;
const playerSprite = player.addComponent(new Sprite('rect:56'));
playerSprite.layer = 'default';
scene.add(player);

// Parallax stars helper
function addStars(layerName, count, size, range){
  for(let i=0;i<count;i++){
    const n = new Node('star');
    const tr = n.addComponent(new Transform());
    tr.position.x = Math.floor((Math.random()*2-1) * range);
    tr.position.y = Math.floor((Math.random()*2-1) * range);
    const sp = n.addComponent(new Sprite('rect:'+size));
    sp.layer = layerName;
    scene.add(n);
  }
}
// Layers: sky (farthest), far, mid, default (player/world)
addStars('sky', 120, 2, 4000);
addStars('far', 80, 3, 3000);
addStars('mid', 50, 4, 2000);

// Movement script
class MoveScript extends Component {
  constructor(input){ super(); this.input = input; this.speed = 0.25; }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const s = this.speed * dt;
    const L = this.input.get('ArrowLeft').down || this.input.get('KeyA').down;
    const R = this.input.get('ArrowRight').down || this.input.get('KeyD').down;
    const U = this.input.get('ArrowUp').down || this.input.get('KeyW').down;
    const D = this.input.get('ArrowDown').down || this.input.get('KeyS').down;
    if(L) tr.position.x -= s;
    if(R) tr.position.x += s;
    if(U) tr.position.y -= s;
    if(D) tr.position.y += s;
    const spr = this.owner.getComponent(Sprite);
    if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
  }
}
const input = new Input();
player.addComponent(new MoveScript(input));

// Camera follow script
class CameraFollow extends Component {
  constructor(renderer){ super(); this.r = renderer; }
  onUpdate(){ 
    const tr = this.owner.getComponent(Transform);
    if(tr) this.r.setCamera(tr.position.x, tr.position.y);
  }
}

// Start engine + renderer
const game = new Game();
const renderer = new PixiRenderer();

renderer.init().then(()=>{
  // Parallax factors (smaller = farther away)
  renderer.defineLayer('sky', 0.2);
  renderer.defineLayer('far', 0.5);
  renderer.defineLayer('mid', 0.8);
  renderer.defineLayer('default', 1.0);

  renderer.attach(scene);
  // attach camera follow on player AFTER renderer init
  player.addComponent(new CameraFollow(renderer));
  game.start(scene);
});

// HUD with build + FPS
let last = performance.now(), frames=0, fps=0;
const hud = document.getElementById('hud');
function meter(){
  const now = performance.now(); frames++;
  if(now - last >= 1000){ fps = frames; frames=0; last = now; hud.textContent = `!mpact2d • PARALLAX-2025-10-29b • FPS: ${fps}`; }
  requestAnimationFrame(meter);
}
meter();
