const BUILD = "PHYS-2025-10-29a";

import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';
import { aabbOf, moveWithCollisions } from './physics-lite.js';

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

// Build some walls (rectangles) in world space
const walls = [];

function addWall(x,y,w,h){
  const n = new Node('wall');
  const tr = n.addComponent(new Transform());
  tr.position.x = x;
  tr.position.y = y;
  const sp = n.addComponent(new Sprite(`rect:${w}x${h}`)); // wide rectangles supported by renderer
  sp.layer = 'default';
  scene.add(n);
  walls.push(n);
}

// World bounds box (1000x1000)
addWall(-520, -520, 1040, 20);  // top
addWall(-520, 500, 1040, 20);   // bottom
addWall(-520, -500, 20, 1000);  // left
addWall(500, -500, 20, 1000);   // right

// Some inner obstacles
addWall(-200, -200, 300, 20);
addWall(50, -100, 20, 260);
addWall(-100, 150, 220, 20);

// Precompute collider AABBs for faster checks
function collectColliders(){
  return walls.map(aabbOf);
}
let colliders = collectColliders();

// Movement script with AABB sliding
class MoveScript extends Component {
  constructor(input){ super(); this.input = input; this.speed = 0.25; }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const s = this.speed * dt;
    let dx = 0, dy = 0;
    if(this.input.get('ArrowLeft').down || this.input.get('KeyA').down) dx -= s;
    if(this.input.get('ArrowRight').down || this.input.get('KeyD').down) dx += s;
    if(this.input.get('ArrowUp').down || this.input.get('KeyW').down) dy -= s;
    if(this.input.get('ArrowDown').down || this.input.get('KeyS').down) dy += s;

    moveWithCollisions(this.owner, dx, dy, colliders);

    // sync to display
    const spr = this.owner.getComponent(Sprite);
    if(spr && spr._pixi){
      spr._pixi.x = tr.position.x;
      spr._pixi.y = tr.position.y;
    }
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
  renderer.defineLayer('sky', 0.2);
  renderer.defineLayer('far', 0.5);
  renderer.defineLayer('mid', 0.8);
  renderer.defineLayer('default', 1.0);

  renderer.attach(scene);
  player.addComponent(new CameraFollow(renderer));
  game.start(scene);
});

// HUD with build + FPS
let last = performance.now(), frames=0, fps=0;
const hud = document.getElementById('hud');
function meter(){
  const now = performance.now(); frames++;
  if(now - last >= 1000){ fps = frames; frames=0; last = now; hud.textContent = `!mpact2d • ${BUILD} • FPS: ${fps}`; }
  requestAnimationFrame(meter);
}
meter();
