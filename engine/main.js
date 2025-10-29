const BUILD = "2025-10-29a"; // shown in HUD

import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';

// Scene & player
const scene = new Scene('Root');
const player = new Node('Player');
const t = player.addComponent(new Transform());
t.position.x = 220;
t.position.y = 160;

// Guaranteed-visible rect sprite
player.addComponent(new Sprite('rect:56'));
scene.add(player);

// Movement
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

// Start engine
const game = new Game();
const renderer = new PixiRenderer();
renderer.init().then(()=>{
  renderer.attach(scene);
  game.start(scene);
});

// HUD with build
let last = performance.now(), frames=0, fps=0;
const hud = document.getElementById('hud');
function meter(){
  const now = performance.now(); frames++;
  if(now - last >= 1000){ fps = frames; frames=0; last = now; hud.textContent = `!mpact2d • BUILD 2025-10-29a • FPS: ${fps}`; }
  requestAnimationFrame(meter);
}
meter();
