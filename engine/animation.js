/**
 * Impact2D Engine - Animation
 * Sprite sheet animator and tween system
 */

import { lerp, clamp } from './utils.js';

// Easing functions
export const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInElastic: t => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutBounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

// Sprite sheet animator
export class SpriteAnimator {
  constructor() {
    this.animations = new Map();
    this.currentAnim = null;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.playing = false;
    this.loop = true;
    this.pingPong = false;
    this.direction = 1;
    this.onComplete = null;
    this.onFrameChange = null;
  }

  addAnimation(name, frames, fps = 10, options = {}) {
    this.animations.set(name, {
      frames,
      fps,
      frameDuration: 1000 / fps,
      loop: options.loop !== undefined ? options.loop : true,
      pingPong: options.pingPong || false,
      onComplete: options.onComplete || null,
      onFrameChange: options.onFrameChange || null
    });
  }

  play(name, restart = false) {
    if (!this.animations.has(name)) {
      console.warn(`[SpriteAnimator] Animation not found: ${name}`);
      return;
    }

    if (this.currentAnim !== name || restart) {
      const anim = this.animations.get(name);
      this.currentAnim = name;
      this.currentFrame = 0;
      this.frameTime = 0;
      this.loop = anim.loop;
      this.pingPong = anim.pingPong;
      this.direction = 1;
      this.onComplete = anim.onComplete;
      this.onFrameChange = anim.onFrameChange;
    }

    this.playing = true;
  }

  stop() {
    this.playing = false;
  }

  reset() {
    this.currentFrame = 0;
    this.frameTime = 0;
    this.direction = 1;
  }

  update(dt) {
    if (!this.playing || !this.currentAnim) return;

    const anim = this.animations.get(this.currentAnim);
    if (!anim) return;

    this.frameTime += dt;

    if (this.frameTime >= anim.frameDuration) {
      this.frameTime = 0;
      const oldFrame = this.currentFrame;
      this.currentFrame += this.direction;

      // Handle loop/pingpong
      if (this.currentFrame >= anim.frames.length) {
        if (this.pingPong) {
          this.direction = -1;
          this.currentFrame = anim.frames.length - 2;
        } else if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = anim.frames.length - 1;
          this.playing = false;
          if (this.onComplete) this.onComplete();
        }
      } else if (this.currentFrame < 0) {
        if (this.pingPong) {
          this.direction = 1;
          this.currentFrame = 1;
        } else {
          this.currentFrame = 0;
        }
      }

      if (oldFrame !== this.currentFrame && this.onFrameChange) {
        this.onFrameChange(this.currentFrame);
      }
    }
  }

  getCurrentFrame() {
    if (!this.currentAnim) return null;
    const anim = this.animations.get(this.currentAnim);
    return anim ? anim.frames[this.currentFrame] : null;
  }
}

// Tween system
export class Tween {
  constructor(target, props, duration, easing = 'linear') {
    this.target = target;
    this.startValues = {};
    this.endValues = props;
    this.duration = duration;
    this.elapsed = 0;
    this.easing = typeof easing === 'string' ? Easing[easing] || Easing.linear : easing;
    this.active = false;
    this.onUpdate = null;
    this.onComplete = null;

    // Store start values
    for (const key in props) {
      this.startValues[key] = target[key];
    }
  }

  start() {
    this.active = true;
    this.elapsed = 0;
    return this;
  }

  update(dt) {
    if (!this.active) return;

    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / this.duration);
    const easedT = this.easing(t);

    // Interpolate all properties
    for (const key in this.endValues) {
      const start = this.startValues[key];
      const end = this.endValues[key];
      this.target[key] = lerp(start, end, easedT);
    }

    if (this.onUpdate) {
      this.onUpdate(easedT);
    }

    if (t >= 1) {
      this.active = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  stop() {
    this.active = false;
  }

  chain(nextTween) {
    this.onComplete = () => nextTween.start();
    return nextTween;
  }
}

// Tween manager
export class TweenManager {
  constructor() {
    this.tweens = [];
  }

  add(tween) {
    this.tweens.push(tween);
    return tween;
  }

  create(target, props, duration, easing = 'linear') {
    const tween = new Tween(target, props, duration, easing);
    this.add(tween);
    return tween;
  }

  remove(tween) {
    const index = this.tweens.indexOf(tween);
    if (index !== -1) {
      this.tweens.splice(index, 1);
    }
  }

  update(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tween = this.tweens[i];
      tween.update(dt);
      if (!tween.active) {
        this.tweens.splice(i, 1);
      }
    }
  }

  clear() {
    this.tweens = [];
  }
}

// Global tween manager instance
export const tweenManager = new TweenManager();
