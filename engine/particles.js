/**
 * Impact2D Engine - Particles
 * Lightweight CPU/GPU particle system using Pixi ParticleContainer or Graphics
 */

import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';
import { randomFloat, randomInt } from './utils.js';

export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 1;
    this.maxLife = 1;
    this.size = 4;
    this.color = 0xffffff;
    this.alpha = 1;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.gravity = 0;
    this.active = false;
    this.display = null; // Pixi Graphics object
  }

  reset() {
    this.active = false;
    this.life = 1;
    this.alpha = 1;
    this.rotation = 0;
    if (this.display) {
      this.display.visible = false;
    }
  }

  update(dt) {
    if (!this.active) return;

    this.vx += 0;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotationSpeed * dt;

    this.life -= dt / 1000;
    if (this.life <= 0) {
      this.active = false;
      this.reset();
      return;
    }

    // Update alpha based on life
    this.alpha = this.life / this.maxLife;

    // Update display object
    if (this.display) {
      this.display.x = this.x;
      this.display.y = this.y;
      this.display.alpha = this.alpha;
      this.display.rotation = this.rotation;
      this.display.visible = true;
    }
  }
}

export class ParticleEmitter {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.maxParticles = options.maxParticles || 100;
    this.emissionRate = options.emissionRate || 10; // particles per second
    this.particleLife = options.particleLife || 1000; // milliseconds
    this.particleLifeVariance = options.particleLifeVariance || 200;
    
    this.minSpeed = options.minSpeed || 0.5;
    this.maxSpeed = options.maxSpeed || 2;
    this.angle = options.angle !== undefined ? options.angle : 0;
    this.angleSpread = options.angleSpread !== undefined ? options.angleSpread : Math.PI * 2;
    
    this.gravity = options.gravity !== undefined ? options.gravity : 0;
    this.minSize = options.minSize || 2;
    this.maxSize = options.maxSize || 6;
    this.color = options.color || 0xffffff;
    this.rotationSpeed = options.rotationSpeed || 0;
    
    this.active = false;
    this.particles = [];
    this.emissionTimer = 0;
    this.container = null; // Pixi Container
    
    // Pre-create particles
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(new Particle());
    }
  }

  setContainer(container) {
    this.container = container;
    
    // Create display objects for all particles
    for (const particle of this.particles) {
      if (!particle.display) {
        const g = new Graphics();
        particle.display = g;
        if (this.container) {
          this.container.addChild(g);
        }
      }
    }
  }

  start() {
    this.active = true;
  }

  stop() {
    this.active = false;
  }

  emit(count = 1) {
    for (let i = 0; i < count; i++) {
      const particle = this.getInactiveParticle();
      if (!particle) break;

      const angle = this.angle + (Math.random() - 0.5) * this.angleSpread;
      const speed = randomFloat(this.minSpeed, this.maxSpeed);
      const life = this.particleLife + randomFloat(-this.particleLifeVariance, this.particleLifeVariance);
      
      particle.x = this.x;
      particle.y = this.y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life / 1000;
      particle.maxLife = life / 1000;
      particle.size = randomFloat(this.minSize, this.maxSize);
      particle.color = this.color;
      particle.gravity = this.gravity;
      particle.rotationSpeed = this.rotationSpeed;
      particle.active = true;

      // Draw particle
      if (particle.display) {
        const g = particle.display;
        g.clear();
        g.circle(0, 0, particle.size).fill(particle.color);
        g.visible = true;
      }
    }
  }

  update(dt) {
    // Emit particles
    if (this.active) {
      this.emissionTimer += dt / 1000;
      const emitCount = Math.floor(this.emissionTimer * this.emissionRate);
      if (emitCount > 0) {
        this.emit(emitCount);
        this.emissionTimer = 0;
      }
    }

    // Update active particles
    for (const particle of this.particles) {
      if (particle.active) {
        particle.update(dt);
      }
    }
  }

  getInactiveParticle() {
    return this.particles.find(p => !p.active) || null;
  }

  clear() {
    for (const particle of this.particles) {
      particle.reset();
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getActiveCount() {
    return this.particles.filter(p => p.active).length;
  }
}

// Particle preset configurations
export const ParticlePresets = {
  explosion: {
    maxParticles: 50,
    emissionRate: 0, // Burst only
    particleLife: 800,
    particleLifeVariance: 200,
    minSpeed: 1,
    maxSpeed: 4,
    angleSpread: Math.PI * 2,
    gravity: 0.2,
    minSize: 2,
    maxSize: 8,
    color: 0xff8800
  },
  
  sparkles: {
    maxParticles: 30,
    emissionRate: 15,
    particleLife: 600,
    particleLifeVariance: 100,
    minSpeed: 0.3,
    maxSpeed: 1,
    angleSpread: Math.PI * 2,
    gravity: -0.1,
    minSize: 1,
    maxSize: 3,
    color: 0xffff00,
    rotationSpeed: 0.05
  },
  
  dust: {
    maxParticles: 20,
    emissionRate: 10,
    particleLife: 400,
    particleLifeVariance: 100,
    minSpeed: 0.5,
    maxSpeed: 1.5,
    angle: -Math.PI / 2,
    angleSpread: Math.PI / 4,
    gravity: 0.3,
    minSize: 2,
    maxSize: 4,
    color: 0xaaaaaa
  },

  trail: {
    maxParticles: 40,
    emissionRate: 20,
    particleLife: 500,
    particleLifeVariance: 50,
    minSpeed: 0.1,
    maxSpeed: 0.3,
    angleSpread: Math.PI / 6,
    gravity: 0,
    minSize: 2,
    maxSize: 5,
    color: 0x7aa2f7
  }
};
