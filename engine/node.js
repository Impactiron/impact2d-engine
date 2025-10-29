import { Component } from './component.js';
let NODE_ID = 1;
export class Node {
  constructor(name='Node'){
    this.id = NODE_ID++;
    this.name = name;
    this.active = true;
    this.parent = null;
    this.children = [];
    this._components = [];
  }
  add(child){
    child.remove();
    child.parent = this;
    this.children.push(child);
    return child;
  }
  remove(){
    if(!this.parent) return;
    const i = this.parent.children.indexOf(this);
    if(i>=0) this.parent.children.splice(i,1);
    this.parent=null;
  }
  addComponent(c){
    c.owner = this;
    this._components.push(c);
    c.onAttach?.();
    return c;
  }
  getComponent(ctor){
    for(const c of this._components) if(c instanceof ctor) return c;
    return null;
  }
  getComponents(ctor){
    return this._components.filter(c=>c instanceof ctor);
  }
  _init(){ for(const c of this._components) c.onInit?.(); for(const ch of this.children) ch._init(); }
  _update(dt){ if(!this.active) return; for(const c of this._components) c.onUpdate?.(dt); for(const ch of this.children) ch._update(dt); }
  _fixedUpdate(st){ if(!this.active) return; for(const c of this._components) c.onFixedUpdate?.(st); for(const ch of this.children) ch._fixedUpdate(st); }
  _render(ctx){ if(!this.active) return; for(const c of this._components) c.onRender?.(ctx); for(const ch of this.children) ch._render(ctx); }
}
export class Scene extends Node { constructor(name='Scene'){ super(name); } }
