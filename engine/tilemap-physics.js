// Tilemap physics (grid-based) for !mpact2d
// Configurable tile type registry with flags/props.

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

export function rectOverlappingTiles(rect, tileSize){
  const tiles = [];
  const x0 = Math.floor(rect.x / tileSize);
  const y0 = Math.floor(rect.y / tileSize);
  const x1 = Math.floor((rect.x + rect.w - 1e-6) / tileSize);
  const y1 = Math.floor((rect.y + rect.h - 1e-6) / tileSize);
  for(let y=y0; y<=y1; y++){
    for(let x=x0; x<=x1; x++){
      tiles.push({x,y});
    }
  }
  return tiles;
}

export function moveWithTileCollisions(node, dx, dy, map2D, tileSize, rectProvider){
  // rectProvider(): returns {x,y,w,h} for the node BEFORE movement
  const rect0 = rectProvider();
  let rx = rect0.x, ry = rect0.y;
  const rw = rect0.w, rh = rect0.h;
  const eps = 0.001;

  // Move X axis
  rx += dx;
  let rectX = { x: rx, y: ry, w: rw, h: rh };
  for(const t of rectOverlappingTiles(rectX, tileSize)){
    const v = (map2D[t.y] && map2D[t.y][t.x]) ?? 0;
    if(isSolid(v)){
      if(dx > 0){
        rx = t.x * tileSize - rw - eps;
      } else if (dx < 0){
        rx = (t.x + 1) * tileSize + eps;
      }
      rectX.x = rx;
    }
  }

  // Move Y axis
  ry += dy;
  let rectY = { x: rx, y: ry, w: rw, h: rh };
  for(const t of rectOverlappingTiles(rectY, tileSize)){
    const v = (map2D[t.y] && map2D[t.y][t.x]) ?? 0;
    if(isSolid(v)){
      if(dy > 0){
        ry = t.y * tileSize - rh - 0.001;
      } else if (dy < 0){
        ry = (t.y + 1) * tileSize + 0.001;
      }
      rectY.y = ry;
    }
  }

  return { x: rx, y: ry };
}
