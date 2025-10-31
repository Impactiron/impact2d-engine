// engine/behaviors/patrol.js
// Simple waypoint patrol movement. Integrate with your physics/collision layer.

function lerp(a,b,t){ return a + (b-a)*t; }

export function createPatrolBehavior(opts={}){
  const { points = [], speed = 60, mode = "loop", startAt = 0 } = opts;
  let i = Math.min(Math.max(startAt, 0), Math.max(points.length-1, 0));
  let forward = true;

  function nextIndex(){
    if(mode === "loop"){
      i = (i + 1) % points.length;
    } else {
      // pingpong
      if(forward){
        if(i >= points.length-1){ forward = false; i--; } else { i++; }
      } else {
        if(i <= 0){ forward = true; i++; } else { i--; }
      }
    }
  }

  return {
    name: "patrol",
    onAttach(entity){
      if(points.length === 0) { this._done = true; return; }
      const p = points[i];
      if(typeof entity.x === "number" && typeof entity.y === "number"){
        // optional: snap to first point
        // entity.x = p.x; entity.y = p.y;
      }
      console.debug(`[patrol] attached with ${points.length} points, mode=${mode}`);
    },
    update(dt, entity, manager){
      if(points.length < 2){ this._done = true; return; }
      const cur = points[i];
      const nxt = points[(i+1) % points.length];

      const dx = nxt.x - entity.x;
      const dy = nxt.y - entity.y;
      const dist = Math.hypot(dx, dy);
      const step = speed * dt;

      if(dist <= step){
        // move to next and advance index
        entity.x = nxt.x; entity.y = nxt.y;
        nextIndex();
        return;
      }

      // normalized move
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // TODO: integrate with your collision/tile physics instead of raw assignment
      entity.x += nx * step;
      entity.y += ny * step;
    },
    onDetach(entity){
      console.debug("[patrol] detached");
    }
  };
}
