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
    if (this.scene && typeof this.scene.init === 'function') { try { this.scene.init(); } catch(e) { console.warn('[game] scene.init failed', e); } }
    else if (this.scene && typeof this.scene._init === 'function') { try { this.scene._init(); } catch(e) { console.warn('[game] scene._init failed', e); } }
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }
  pause(){ this.running = false; }
  resume(){ if(this.running) return; this.running = true; this.lastTime = performance.now(); requestAnimationFrame(this.loop); }
  loop = (t) => {
    if (!this.running || !this.scene) return;
    const dt = t - this.lastTime; this.lastTime = t; this.acc += dt;
    while (this.acc >= this.fixedStep) {
      if (typeof this.scene.fixedUpdate === 'function') { try { this.scene.fixedUpdate(this.fixedStep); } catch(e){ console.warn('[game] fixedUpdate failed', e);} }
      else if (typeof this.scene._fixedUpdate === 'function') { try { this.scene._fixedUpdate(this.fixedStep); } catch(e){} }
      this.acc -= this.fixedStep;
    }
    if (typeof this.scene.update === 'function') { try { this.scene.update(dt); } catch(e){ console.warn('[game] update failed', e);} }
    else if (typeof this.scene._update === 'function') { try { this.scene._update(dt); } catch(e){} }

    if (typeof this.scene.render === 'function') { try { this.scene.render(); } catch(e){ console.warn('[game] render failed', e);} }
    else if (typeof this.scene._render === 'function') { try { this.scene._render(null); } catch(e){} }

    requestAnimationFrame(this.loop);
  }
    this.scene._update(dt);
    this.scene._render(null);
    requestAnimationFrame(this.loop);
  }
}
