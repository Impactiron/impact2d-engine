// engine/behavior-manager.js
// Minimal, modular manager for entity behaviors.

export class BehaviorManager {
  constructor(){
    this._map = new Map(); // entity -> Set(behaviors)
    this._paused = false;
  }

  pause(){ this._paused = true; }
  resume(){ this._paused = false; }

  attach(entity, behavior){
    if(!entity) throw new Error("attach: entity required");
    if(!behavior || typeof behavior.update !== "function")
      throw new Error("attach: behavior with update(dt, entity) required");

    let set = this._map.get(entity);
    if(!set){ set = new Set(); this._map.set(entity, set); }
    set.add(behavior);

    if(typeof behavior.onAttach === "function"){
      behavior.onAttach(entity);
    }
    return behavior;
  }

  detach(entity, behavior){
    const set = this._map.get(entity);
    if(!set) return;
    if(set.has(behavior)){
      if(typeof behavior.onDetach === "function"){
        behavior.onDetach(entity);
      }
      set.delete(behavior);
    }
    if(set.size === 0){
      this._map.delete(entity);
    }
  }

  clearEntity(entity){
    const set = this._map.get(entity);
    if(!set) return;
    for(const b of set){
      if(typeof b.onDetach === "function"){
        b.onDetach(entity);
      }
    }
    this._map.delete(entity);
  }

  update(dt){
    if(this._paused) return;
    // Iteration over snapshot to avoid mutation during iteration
    for(const [entity, set] of Array.from(this._map.entries())){
      for(const b of Array.from(set.values())){
        b.update?.(dt, entity, this);
        // Optional lifecycle self-removal
        if(b._done){
          this.detach(entity, b);
        }
      }
    }
  }
}
