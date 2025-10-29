// Tilemap physics (grid-based) for !mpact2d
// HOTFIX: precise collisions (no early blocking) via inset sampling & stable EPS.

export const TileTypes = {
  // id: { name, solid, speedMul, lethal, friction, custom?: any }
  0: { name: 'floor', solid: false, speedMul: 1.0, lethal: false, friction: 1.0 },
  1: { name: 'wall',  solid: true,  speedMul: 0.0, lethal: false, friction: 1.0 },
  2: { name: 'lava',  solid: false, speedMul: 0.8, lethal: true,  friction: 1.0 },
  3: { name: 'water', solid: false, speedMul: 0.6, lethal: false, friction: 1.1 },
  4: { name: 'sand',  solid: false, speedMul: 0.8, lethal: false, friction: 1.2 },
};

export function setTileType(id, props){ TileTypes[id] = { ...(TileTypes[id]||{}), ...props }; }
export function getTileProps(id){ return TileTypes[id] || TileTypes[0]; }
export function isSolid(id){ return !!getTileProps(id).solid; }
export function speedMulFor(id){ return getTileProps(id).speedMul ?? 1.0; }
export function isLethal(id){ return !!getTileProps(id).lethal; }

const EPS  = 1e-3;   // numerical tolerance
const INSET = 0.1;   // shrink sampling rect by this many pixels on each side

function rectOverlappingTilesStrict(rect, tileSize){
  const x = rect.x + INSET;
  const y = rect.y + INSET;
  const w = Math.max(0, rect.w - 2*INSET);
  const h = Math.max(0, rect.h - 2*INSET);
  const x0 = Math.floor((x + EPS) / tileSize);
  const y0 = Math.floor((y + EPS) / tileSize);
  const x1 = Math.floor(((x + w) - EPS) / tileSize);
  const y1 = Math.floor(((y + h) - EPS) / tileSize);
  const tiles = [];
  for(let ty=y0; ty<=y1; ty++){
    for(let tx=x0; tx<=x1; tx++){
      tiles.push({x:tx,y:ty});
    }
  }
  return tiles;
}

export function moveWithTileCollisions(node, dx, dy, map2D, tileSize, rectProvider){
  const r0 = rectProvider();
  let rx = r0.x, ry = r0.y;
  const rw = r0.w, rh = r0.h;

  // Move X axis
  rx += dx;
  let rectX = { x: rx, y: ry, w: rw, h: rh };
  for(const t of rectOverlappingTilesStrict(rectX, tileSize)){
    const v = (map2D[t.y] && map2D[t.y][t.x]) ?? 0;
    if(isSolid(v)){
      if(dx > 0){
        rx = t.x * tileSize - rw - EPS;
      } else if (dx < 0){
        rx = (t.x + 1) * tileSize + EPS;
      }
      rectX.x = rx;
    }
  }

  // Move Y axis
  ry += dy;
  let rectY = { x: rx, y: ry, w: rw, h: rh };
  for(const t of rectOverlappingTilesStrict(rectY, tileSize)){
    const v = (map2D[t.y] && map2D[t.y][t.x]) ?? 0;
    if(isSolid(v)){
      if(dy > 0){
        ry = t.y * tileSize - rh - EPS;
      } else if (dy < 0){
        ry = (t.y + 1) * tileSize + EPS;
      }
      rectY.y = ry;
    }
  }

  return { x: rx, y: ry };
}
