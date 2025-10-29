import { Sprite } from './sprite.js';
import { Application, Sprite as PixiSprite, Container, Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export class PixiRenderer {
  constructor(){ this.app = null; this.layers = new Map(); }
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

        // place on layer
        let layer = this.layers.get(c.layer);
        if(!layer){
          layer = new Container();
          this.layers.set(c.layer, layer);
          this.app.stage.addChild(layer);
        }
        layer.addChild(display);

        // initial position sync (0,0 if no Transform set yet)
        c._pixi = display;
        const tr = node.getComponent?.(/* Transform is not imported here */ function(){}) || null;
        // We can't import Transform here cleanly; main.js sets position every frame.
      }
      for(const ch of node.children) create(ch);
    };
    create(scene);
  }
}
