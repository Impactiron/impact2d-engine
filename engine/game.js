// engine/game.js
export class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = null;
    this.running = false;
    this.lastTime = 0;
    this.acc = 0;
    this.fixedStep = 1000 / 60; // 60 FPS
    this.loop = this.loop.bind(this);
  }

  start(scene) {
    this.scene = scene;

    // Renderer anhängen (falls vorhanden)
    if (this.renderer && typeof this.renderer.attach === 'function' && this.scene) {
      try { this.renderer.attach(this.scene); }
      catch (e) { console.warn('[game] renderer.attach failed', e); }
    }

    // Init: bevorzugt "init", fallback auf "_init"
    if (this.scene) {
      try {
        if (typeof this.scene.init === 'function') this.scene.init();
        else if (typeof this.scene._init === 'function') this.scene._init();
      } catch (e) { console.warn('[game] scene init failed', e); }
    }

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  stop() { this.running = false; }

  loop(t) {
    if (!this.running || !this.scene) return;

    const dt = t - this.lastTime;
    this.lastTime = t;
    this.acc += dt;

    // Fixed update (neu) oder Fallback (alt)
    while (this.acc >= this.fixedStep) {
      try {
        if (typeof this.scene.fixedUpdate === 'function') this.scene.fixedUpdate(this.fixedStep);
        else if (typeof this.scene._fixedUpdate === 'function') this.scene._fixedUpdate(this.fixedStep);
      } catch (e) { console.warn('[game] fixedUpdate failed', e); }
      this.acc -= this.fixedStep;
    }

    // Variable update (neu/alt)
    try {
      if (typeof this.scene.update === 'function') this.scene.update(dt);
      else if (typeof this.scene._update === 'function') this.scene._update(dt);
    } catch (e) { console.warn('[game] update failed', e); }

    // Render-Hook ist optional (Pixi rendert ohnehin über Ticker nach attach())
    try {
      if (typeof this.scene.render === 'function') this.scene.render();
      else if (typeof this.scene._render === 'function') this.scene._render(null);
    } catch (e) { console.warn('[game] render failed', e); }

    requestAnimationFrame(this.loop);
  }
}
