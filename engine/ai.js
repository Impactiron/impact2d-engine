/**
 * Impact2D Engine - AI
 * FSM, steering behaviors, and A* pathfinding
 */

import { dist, normalize } from './utils.js';

// Finite State Machine
export class FSM {
  constructor(initialState = 'idle') {
    this.currentState = initialState;
    this.states = new Map();
    this.transitions = new Map();
  }

  addState(name, onEnter = null, onUpdate = null, onExit = null) {
    this.states.set(name, { onEnter, onUpdate, onExit });
  }

  addTransition(from, to, condition) {
    const key = `${from}->${to}`;
    this.transitions.set(key, condition);
  }

  setState(newState) {
    if (!this.states.has(newState)) {
      console.warn(`[FSM] State not found: ${newState}`);
      return;
    }

    const currentStateData = this.states.get(this.currentState);
    if (currentStateData && currentStateData.onExit) {
      currentStateData.onExit();
    }

    this.currentState = newState;

    const newStateData = this.states.get(newState);
    if (newStateData && newStateData.onEnter) {
      newStateData.onEnter();
    }
  }

  update(dt, context) {
    const stateData = this.states.get(this.currentState);
    if (stateData && stateData.onUpdate) {
      stateData.onUpdate(dt, context);
    }

    // Check transitions
    for (const [key, condition] of this.transitions) {
      const [from, to] = key.split('->');
      if (from === this.currentState && condition(context)) {
        this.setState(to);
        break;
      }
    }
  }

  getState() {
    return this.currentState;
  }
}

// Steering behaviors
export const Steering = {
  seek(x, y, targetX, targetY, maxSpeed = 1) {
    const dir = normalize(targetX - x, targetY - y);
    return {
      vx: dir.x * maxSpeed,
      vy: dir.y * maxSpeed
    };
  },

  flee(x, y, targetX, targetY, maxSpeed = 1) {
    const dir = normalize(x - targetX, y - targetY);
    return {
      vx: dir.x * maxSpeed,
      vy: dir.y * maxSpeed
    };
  },

  arrive(x, y, targetX, targetY, maxSpeed = 1, slowRadius = 100) {
    const distance = dist(x, y, targetX, targetY);
    const dir = normalize(targetX - x, targetY - y);

    let speed = maxSpeed;
    if (distance < slowRadius) {
      speed = maxSpeed * (distance / slowRadius);
    }

    return {
      vx: dir.x * speed,
      vy: dir.y * speed
    };
  },

  wander(x, y, currentAngle, wanderDistance = 50, wanderRadius = 20, angleChange = 0.3) {
    const newAngle = currentAngle + (Math.random() - 0.5) * angleChange;
    const circleX = x + Math.cos(currentAngle) * wanderDistance;
    const circleY = y + Math.sin(currentAngle) * wanderDistance;
    const targetX = circleX + Math.cos(newAngle) * wanderRadius;
    const targetY = circleY + Math.sin(newAngle) * wanderRadius;

    const dir = normalize(targetX - x, targetY - y);
    return {
      vx: dir.x,
      vy: dir.y,
      angle: newAngle
    };
  }
};

// A* Pathfinding
export class Pathfinder {
  constructor(grid, width, height) {
    this.grid = grid; // 2D array: 0 = walkable, 1 = blocked
    this.width = width;
    this.height = height;
    this.allowDiagonal = true;
  }

  findPath(startX, startY, endX, endY) {
    const start = { x: startX, y: startY, g: 0, h: 0, f: 0, parent: null };
    const end = { x: endX, y: endY };

    const openList = [start];
    const closedList = [];
    const openMap = new Map();
    openMap.set(this.key(startX, startY), start);

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
        return this.reconstructPath(current);
      }

      // Move current from open to closed
      openList.splice(currentIndex, 1);
      openMap.delete(this.key(current.x, current.y));
      closedList.push(current);

      // Check neighbors
      const neighbors = this.getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        const { x, y, cost } = neighbor;

        // Skip if in closed list
        if (closedList.some(n => n.x === x && n.y === y)) continue;

        const g = current.g + cost;
        const h = this.heuristic(x, y, end.x, end.y);
        const f = g + h;

        const existing = openMap.get(this.key(x, y));
        if (existing) {
          // Update if better path found
          if (g < existing.g) {
            existing.g = g;
            existing.h = h;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          // Add to open list
          const node = { x, y, g, h, f, parent: current };
          openList.push(node);
          openMap.set(this.key(x, y), node);
        }
      }
    }

    // No path found
    return [];
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const dirs = [
      { dx: 0, dy: -1, cost: 1 }, // up
      { dx: 1, dy: 0, cost: 1 }, // right
      { dx: 0, dy: 1, cost: 1 }, // down
      { dx: -1, dy: 0, cost: 1 } // left
    ];

    if (this.allowDiagonal) {
      dirs.push(
        { dx: 1, dy: -1, cost: 1.414 }, // up-right
        { dx: 1, dy: 1, cost: 1.414 }, // down-right
        { dx: -1, dy: 1, cost: 1.414 }, // down-left
        { dx: -1, dy: -1, cost: 1.414 } // up-left
      );
    }

    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (this.isWalkable(nx, ny)) {
        neighbors.push({ x: nx, y: ny, cost: dir.cost });
      }
    }

    return neighbors;
  }

  isWalkable(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.grid[y] && this.grid[y][x] === 0;
  }

  heuristic(x1, y1, x2, y2) {
    // Manhattan distance for grid-based movement
    // return Math.abs(x2 - x1) + Math.abs(y2 - y1);

    // Euclidean distance (better for diagonal movement)
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  reconstructPath(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    return path;
  }

  key(x, y) {
    return `${x},${y}`;
  }
}
