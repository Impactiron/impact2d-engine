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
player.addComponent(new Sprite('https://picsum.photos/seed/impact2d/64'));
scene.add(player);

// Simple movement script
class MoveScript extends Component {
  constructor(input){ super(); this.input = input; this.speed = 0.2; }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const s = this.speed * dt;
    const left = this.input.get('ArrowLeft').down || this.input.get('KeyA').down;
    const right= this.input.get('ArrowRight').down || this.input.get('KeyD').down;
    const up   = this.input.get('ArrowUp').down || this.input.get('KeyW').down;
    const down = this.input.get('ArrowDown').down || this.input.get('KeyS').down;
    if(left) tr.position.x -= s;
    if(right) tr.position.x += s;
    if(up) tr.position.y -= s;
    if(down) tr.position.y += s;

    // apply to PIXI sprite if present
    const spr = this.owner.getComponent(Sprite);
    if(spr && spr._pixi){
      spr._pixi.x = tr.position.x;
      spr._pixi.y = tr.position.y;
    }
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

// simple HUD FPS
let last = performance.now(), frames=0, fps=0;
const hud = document.getElementById('hud');
function meter(){
  const now = performance.now(); frames++;
  if(now - last >= 1000){ fps = frames; frames=0; last = now; hud.textContent = `!mpact2d • Demo • FPS: ${fps}`; }
  requestAnimationFrame(meter);
}
meter();
