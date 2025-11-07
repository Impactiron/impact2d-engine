/**
 * Impact2D Engine - Pathfinding Worker
 * A* pathfinding in Web Worker for offloading heavy computation
 */

// Worker code runs in its own context
self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === 'findPath') {
    const { grid, width, height, startX, startY, endX, endY, allowDiagonal } = data;
    const path = findPath(grid, width, height, startX, startY, endX, endY, allowDiagonal);
    self.postMessage({ type: 'pathFound', path, requestId: data.requestId });
  }
};

function findPath(grid, width, height, startX, startY, endX, endY, allowDiagonal = true) {
  const start = { x: startX, y: startY, g: 0, h: 0, f: 0, parent: null };
  const end = { x: endX, y: endY };

  const openList = [start];
  const closedList = [];
  const openMap = new Map();
  openMap.set(key(startX, startY), start);

  while (openList.length > 0) {
    // Find node with lowest f score
    let current = openList[0];
    let currentIndex = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < current.f) {
        current = openList[i];
        currentIndex = i;
      }
    }

    // Found the goal
    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }

    // Move current from open to closed
    openList.splice(currentIndex, 1);
    openMap.delete(key(current.x, current.y));
    closedList.push(current);

    // Check neighbors
    const neighbors = getNeighbors(grid, width, height, current.x, current.y, allowDiagonal);
    for (const neighbor of neighbors) {
      const { x, y, cost } = neighbor;

      // Skip if in closed list
      if (closedList.some(n => n.x === x && n.y === y)) continue;

      const g = current.g + cost;
      const h = heuristic(x, y, end.x, end.y);
      const f = g + h;

      const existing = openMap.get(key(x, y));
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.h = h;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        const node = { x, y, g, h, f, parent: current };
        openList.push(node);
        openMap.set(key(x, y), node);
      }
    }
  }

  return [];
}

function getNeighbors(grid, width, height, x, y, allowDiagonal) {
  const neighbors = [];
  const dirs = [
    { dx: 0, dy: -1, cost: 1 },
    { dx: 1, dy: 0, cost: 1 },
    { dx: 0, dy: 1, cost: 1 },
    { dx: -1, dy: 0, cost: 1 }
  ];

  if (allowDiagonal) {
    dirs.push(
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: 1, dy: 1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: -1, dy: -1, cost: 1.414 }
    );
  }

  for (const dir of dirs) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;

    if (isWalkable(grid, width, height, nx, ny)) {
      neighbors.push({ x: nx, y: ny, cost: dir.cost });
    }
  }

  return neighbors;
}

function isWalkable(grid, width, height, x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  return grid[y] && grid[y][x] === 0;
}

function heuristic(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function reconstructPath(node) {
  const path = [];
  let current = node;
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  return path;
}

function key(x, y) {
  return `${x},${y}`;
}
