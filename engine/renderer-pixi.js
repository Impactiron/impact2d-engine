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

  // NEW: expose container to allow external drawing (e.g., Tilemap)
  getLayerContainer(name){
    if(!this.layers.get(name)){
      this.defineLayer(name, 1);
    }
    return this.layers.get(name).container;
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

  _makeRectFromSpec(spec){
    // spec can be 'rect:56' or 'rect:56x24'
    let w = 48, h = 48;
    try{
      const body = spec.split(':')[1] ?? '48';
      if(body.includes('x')){
        const [sw, sh] = body.split('x');
        w = Math.max(1, parseInt(sw,10)||48);
        h = Math.max(1, parseInt(sh,10)||48);
      } else {
        const s = Math.max(1, parseInt(body,10)||48);
        w = s; h = s;
      }
    } catch(e){}
    const g = new Graphics().rect(0,0,w,h).fill(0xffffff);
    g.__impact2d_size = {w,h};
    return g;
  }

  attach(scene){
    const create = (node)=>{
      const comps = node.getComponents?.(Sprite) || [];
      for(const c of comps){
        let display;
        if(typeof c.texture === 'string' && c.texture.startsWith('rect:')){
          display = this._makeRectFromSpec(c.texture);
        } else if (c.texture){
          display = PixiSprite.from(c.texture);
        } else {
          display = this._makeRectFromSpec('rect:48');
        }

        let entry = this.layers.get(c.layer || 'default');
        if(!entry){
          this.defineLayer(c.layer || 'default', 1);
          entry = this.layers.get(c.layer || 'default');
        }
        entry.container.addChild(display);

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
    for(const entry of this.layers.values()) this._applyCameraTo(entry);
  }
}
