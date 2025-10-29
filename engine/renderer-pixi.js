import { Sprite } from './sprite.js';
import { Transform } from './component.js';
import { Application, Sprite as PixiSprite, Container, Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export class PixiRenderer {
  constructor(){
    this.app = null;
    this.layers = new Map();   // name -> { container, factor }
    this.cameraX = 0;
    this.cameraY = 0;
  }

  async init(canvas){
    this.app = new Application();
    await this.app.init({
      antialias:false,
      canvas,
      resizeTo: window,
      background: '#0b0e13'
    });
    if(!this.app.canvas.isConnected){
      document.body.appendChild(this.app.canvas);
    }
  }

  defineLayer(name, factor=1){
    // Create or update a layer with parallax factor
    let entry = this.layers.get(name);
    if(!entry){
      const container = new Container();
      this.app.stage.addChild(container);
      entry = { container, factor };
      this.layers.set(name, entry);
    } else {
      entry.factor = factor;
    }
    this._applyCameraTo(entry);
  }

  setCamera(x, y){
    this.cameraX = x; this.cameraY = y;
    for(const entry of this.layers.values()) this._applyCameraTo(entry);
  }

  _applyCameraTo(entry){
    if(!this.app) return;
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const f = entry.factor ?? 1;
    entry.container.position.set(
      Math.floor(w/2 - this.cameraX * f),
      Math.floor(h/2 - this.cameraY * f)
    );
  }

  attach(scene){
    const create = (node)=>{
      const comps = node.getComponents?.(Sprite) || [];
      for(const c of comps){
        let display;
        if(typeof c.texture === 'string' && c.texture.startsWith('rect:')){
          const size = parseInt(c.texture.split(':')[1] || '48', 10);
          display = new Graphics().rect(0,0,size,size).fill(0xffffff);
        } else if (c.texture){
          display = PixiSprite.from(c.texture);
        } else {
          display = new Graphics().rect(0,0,48,48).fill(0xffffff);
        }

        // ensure layer exists
        let entry = this.layers.get(c.layer || 'default');
        if(!entry){
          this.defineLayer(c.layer || 'default', 1);
          entry = this.layers.get(c.layer || 'default');
        }
        entry.container.addChild(display);

        // initial world position (Transform if present)
        const tr = node.getComponent?.(Transform);
        if(tr){
          display.x = tr.position.x;
          display.y = tr.position.y;
        }
        c._pixi = display;
      }
      for(const ch of node.children) create(ch);
    };
    create(scene);
    // re-apply camera to all layers at end
    for(const entry of this.layers.values()) this._applyCameraTo(entry);
  }
}
