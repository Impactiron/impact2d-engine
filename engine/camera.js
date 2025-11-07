/**
 * Impact2D Engine - Camera
 * Camera system with follow, lerp, bounds, and parallax support
 */

import { lerp, clamp } from './utils.js';

export class Camera {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    
    // Follow settings
    this.target = null;
    this.followLerp = 0.1;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Bounds (null = no bounds)
    this.bounds = null; // { minX, minY, maxX, maxY }
    
    // Shake effect
    this.shakeAmount = 0;
    this.shakeDuration = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    
    // Viewport dimensions (set by renderer)
    this.viewportWidth = 0;
    this.viewportHeight = 0;
  }

  setViewport(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  follow(target, lerpFactor = 0.1, offsetX = 0, offsetY = 0) {
    this.target = target;
    this.followLerp = lerpFactor;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  clearBounds() {
    this.bounds = null;
  }

  shake(amount, duration) {
    this.shakeAmount = amount;
    this.shakeDuration = duration;
  }

  update(dt) {
    // Follow target
    if (this.target) {
      let tx = this.target.x + this.offsetX;
      let ty = this.target.y + this.offsetY;
      
      // Transform support
      if (this.target.position) {
        tx = this.target.position.x + this.offsetX;
        ty = this.target.position.y + this.offsetY;
      }
      
      this.targetX = tx;
      this.targetY = ty;
    }

    // Lerp to target
    this.x = lerp(this.x, this.targetX, this.followLerp);
    this.y = lerp(this.y, this.targetY, this.followLerp);

    // Apply bounds
    if (this.bounds) {
      const halfW = this.viewportWidth / 2;
      const halfH = this.viewportHeight / 2;
      this.x = clamp(this.x, this.bounds.minX + halfW, this.bounds.maxX - halfW);
      this.y = clamp(this.y, this.bounds.minY + halfH, this.bounds.maxY - halfH);
    }

    // Update shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeAmount = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      } else {
        this.shakeX = (Math.random() - 0.5) * this.shakeAmount;
        this.shakeY = (Math.random() - 0.5) * this.shakeAmount;
      }
    }
  }

  getX() {
    return this.x + this.shakeX;
  }

  getY() {
    return this.y + this.shakeY;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(wx, wy) {
    return {
      x: wx - this.getX() + this.viewportWidth / 2,
      y: wy - this.getY() + this.viewportHeight / 2
    };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(sx, sy) {
    return {
      x: sx + this.getX() - this.viewportWidth / 2,
      y: sy + this.getY() - this.viewportHeight / 2
    };
  }
}
