/**
 * Impact2D Engine - Memory Management
 * Object pools and deterministic timing utilities
 */

export class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.available = [];
    this.active = [];

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  get() {
    let obj;
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.factory();
    }
    this.active.push(obj);

    // Reset object if it has a reset method
    if (obj.reset) {
      obj.reset();
    }

    return obj;
  }

  release(obj) {
    const index = this.active.indexOf(obj);
    if (index !== -1) {
      this.active.splice(index, 1);
      this.available.push(obj);
    }
  }

  releaseAll() {
    this.available.push(...this.active);
    this.active = [];
  }

  clear() {
    this.available = [];
    this.active = [];
  }

  getActiveCount() {
    return this.active.length;
  }

  getAvailableCount() {
    return this.available.length;
  }
}

// Fixed timestep accumulator for deterministic physics
export class FixedTimeStep {
  constructor(fixedDt = 16.666) {
    this.fixedDt = fixedDt;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.maxSteps = 5; // Prevent spiral of death
  }

  update(callback) {
    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp delta to prevent large jumps
    if (deltaTime > 250) {
      deltaTime = 250;
    }

    this.accumulator += deltaTime;

    let steps = 0;
    while (this.accumulator >= this.fixedDt && steps < this.maxSteps) {
      callback(this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps++;
    }

    return deltaTime;
  }

  reset() {
    this.accumulator = 0;
    this.lastTime = performance.now();
  }
}

// Performance profiler
export class Profiler {
  constructor() {
    this.markers = new Map();
    this.results = new Map();
  }

  start(name) {
    this.markers.set(name, performance.now());
  }

  end(name) {
    if (!this.markers.has(name)) return 0;

    const startTime = this.markers.get(name);
    const duration = performance.now() - startTime;

    if (!this.results.has(name)) {
      this.results.set(name, { total: 0, count: 0, avg: 0, min: Infinity, max: 0 });
    }

    const result = this.results.get(name);
    result.total += duration;
    result.count++;
    result.avg = result.total / result.count;
    result.min = Math.min(result.min, duration);
    result.max = Math.max(result.max, duration);

    this.markers.delete(name);
    return duration;
  }

  getResult(name) {
    return this.results.get(name);
  }

  getAllResults() {
    return Array.from(this.results.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  clear() {
    this.markers.clear();
    this.results.clear();
  }
}

// Global instances
export const profiler = new Profiler();
