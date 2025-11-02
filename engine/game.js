export class Game {
  constructor(){
    this.scene = null;
    this.running = false;
    this.lastTime = 0;
    this.acc = 0;
    this.fixedStep = 16.6667;
  }
  start(scene){
    this.scene = scene;
    this.scene._init();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }
  pause(){ this.running = false; }
  resume(){ if(this.running) return; this.running = true; this.lastTime = performance.now(); requestAnimationFrame(this.loop); }
  loop = (t)=>{
    if(!this.running || !this.scene) return;
    const dt = t - this.lastTime; this.lastTime = t; this.acc += dt;
    while(this.acc >= this.fixedStep){ this.scene._fixedUpdate(this.fixedStep); this.acc -= this.fixedStep; }
    this.scene._update(dt);
    this.scene._render(null);
    requestAnimationFrame(this.loop);
  }
}
