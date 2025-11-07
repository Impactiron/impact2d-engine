/**
 * Impact2D Engine - Physics
 * 2D AABB physics with swept collision, restitution, friction, gravity, and spatial hash
 */

import { rectIntersect } from './utils.js';

export class PhysicsBody {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;

    this.mass = 1;
    this.restitution = 0.5; // Bounce/elasticity (0-1)
    this.friction = 0.8; // Ground friction (0-1)
    this.airFriction = 0.98; // Air resistance (0-1)

    this.isStatic = false;
    this.isSolid = true;
    this.isGrounded = false;

    this.gravity = 0.5;
    this.maxVelX = 10;
    this.maxVelY = 20;

    // Collision groups (bitflags for filtering)
    this.collisionMask = 0xffffffff;
    this.collisionLayer = 1;
  }

  getAABB() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  addVelocity(vx, vy) {
    this.vx += vx;
    this.vy += vy;
  }

  applyForce(fx, fy) {
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  }
}

export class PhysicsWorld {
  constructor() {
    this.bodies = [];
    this.gravity = { x: 0, y: 0.5 };
    this.spatialHash = new SpatialHash(64);
  }

  addBody(body) {
    if (!this.bodies.includes(body)) {
      this.bodies.push(body);
    }
    return body;
  }

  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  update(dt) {
    // Update spatial hash
    this.spatialHash.clear();
    for (const body of this.bodies) {
      this.spatialHash.insert(body);
    }

    // Update physics for each body
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      // Apply gravity
      body.ay += this.gravity.y;
      body.ax += this.gravity.x;

      // Update velocity
      body.vx += body.ax * dt;
      body.vy += body.ay * dt;

      // Apply friction
      if (body.isGrounded) {
        body.vx *= body.friction;
      } else {
        body.vx *= body.airFriction;
        body.vy *= body.airFriction;
      }

      // Clamp velocity
      body.vx = Math.max(-body.maxVelX, Math.min(body.maxVelX, body.vx));
      body.vy = Math.max(-body.maxVelY, Math.min(body.maxVelY, body.vy));

      // Reset acceleration
      body.ax = 0;
      body.ay = 0;

      // Move and resolve collisions
      body.isGrounded = false;
      this.moveAndCollide(body, body.vx * dt, body.vy * dt);
    }
  }

  moveAndCollide(body, dx, dy) {
    // Swept AABB collision resolution
    const origX = body.x;
    const origY = body.y;

    // Move X axis
    body.x += dx;
    const xCollisions = this.getCollisions(body);
    if (xCollisions.length > 0) {
      // Resolve X collisions
      for (const other of xCollisions) {
        if (this.shouldCollide(body, other)) {
          const resolution = this.resolveCollisionX(body, other, dx);
          body.x = resolution.x;
          body.vx *= -body.restitution;
        }
      }
    }

    // Move Y axis
    body.y += dy;
    const yCollisions = this.getCollisions(body);
    if (yCollisions.length > 0) {
      // Resolve Y collisions
      for (const other of yCollisions) {
        if (this.shouldCollide(body, other)) {
          const resolution = this.resolveCollisionY(body, other, dy);
          body.y = resolution.y;

          // Check if grounded (colliding from above)
          if (dy > 0) {
            body.isGrounded = true;
          }

          body.vy *= -body.restitution;
        }
      }
    }

    return { x: body.x, y: body.y, collided: xCollisions.length > 0 || yCollisions.length > 0 };
  }

  getCollisions(body) {
    const candidates = this.spatialHash.query(body);
    const collisions = [];

    for (const other of candidates) {
      if (other === body || !other.isSolid) continue;
      if (rectIntersect(body.getAABB(), other.getAABB())) {
        collisions.push(other);
      }
    }

    return collisions;
  }

  shouldCollide(bodyA, bodyB) {
    if (!bodyA.isSolid || !bodyB.isSolid) return false;
    if (bodyA.isStatic && bodyB.isStatic) return false;
    // Check collision mask/layer
    return (bodyA.collisionMask & bodyB.collisionLayer) !== 0;
  }

  resolveCollisionX(body, other, dx) {
    if (dx > 0) {
      // Moving right, push left
      return { x: other.x - body.w };
    } else {
      // Moving left, push right
      return { x: other.x + other.w };
    }
  }

  resolveCollisionY(body, other, dy) {
    if (dy > 0) {
      // Moving down, push up
      return { y: other.y - body.h };
    } else {
      // Moving up, push down
      return { y: other.y + other.h };
    }
  }

  raycast(x1, y1, x2, y2) {
    const hits = [];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    const steps = Math.ceil(length);

    for (let i = 0; i < steps; i++) {
      const x = x1 + dirX * i;
      const y = y1 + dirY * i;

      for (const body of this.bodies) {
        if (!body.isSolid) continue;
        const aabb = body.getAABB();
        if (x >= aabb.x && x <= aabb.x + aabb.w && y >= aabb.y && y <= aabb.y + aabb.h) {
          hits.push({ body, x, y, distance: i });
          break;
        }
      }
    }

    return hits;
  }
}

class SpatialHash {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  getCellKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  insert(body) {
    const aabb = body.getAABB();
    const minX = Math.floor(aabb.x / this.cellSize);
    const minY = Math.floor(aabb.y / this.cellSize);
    const maxX = Math.floor((aabb.x + aabb.w) / this.cellSize);
    const maxY = Math.floor((aabb.y + aabb.h) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = `${cx},${cy}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key).push(body);
      }
    }
  }

  query(body) {
    const aabb = body.getAABB();
    const minX = Math.floor(aabb.x / this.cellSize);
    const minY = Math.floor(aabb.y / this.cellSize);
    const maxX = Math.floor((aabb.x + aabb.w) / this.cellSize);
    const maxY = Math.floor((aabb.y + aabb.h) / this.cellSize);

    const results = new Set();
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const b of cell) {
            results.add(b);
          }
        }
      }
    }

    results.delete(body); // Remove self
    return Array.from(results);
  }
}

export { SpatialHash };
