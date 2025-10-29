import { Sprite } from './sprite.js';
import { Scene, Node } from './node.js';
import { Application, Sprite as PixiSprite, Container } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

export class PixiRenderer {
  constructor(){ this.app = null; this.layers = new Map(); }
  async init(canvas){
    this.app = new Application();
    await this.app.init({ antialias:false, canvas });
    document.body.appendChild(this.app.canvas);
  }
  attach(scene){
    const create = (node)=>{
      const comps = node.getComponents?.(Sprite) || [];
      for(const c of comps){
        const sprite = PixiSprite.from(c.texture);
        let layer = this.layers.get(c.layer);
        if(!layer){
          layer = new Container();
          this.layers.set(c.layer, layer);
          this.app.stage.addChild(layer);
        }
        layer.addChild(sprite);
        c._pixi = sprite;
      }
      for(const ch of node.children) create(ch);
    };
    create(scene);
  }
}
