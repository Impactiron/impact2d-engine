export class Input {
  constructor(target=window){ this.keys = new Map();
    target.addEventListener('keydown', e=>this._set(e.code,true));
    target.addEventListener('keyup', e=>this._set(e.code,false));
  }
  _set(code,isDown){
    const ks = this.keys.get(code) ?? {down:false, pressed:false, released:false};
    if(isDown && !ks.down) ks.pressed = true;
    if(!isDown && ks.down) ks.released = true;
    ks.down = isDown; this.keys.set(code, ks);
  }
  get(code){ return this.keys.get(code) ?? {down:false, pressed:false, released:false}; }
  endFrame(){ for(const ks of this.keys.values()){ ks.pressed=false; ks.released=false; } }
}
