/**
 * Impact2D Engine - Replay System
 * Deterministic input recording and playback
 */

export class ReplayRecorder {
  constructor() {
    this.recording = false;
    this.frames = [];
    this.currentFrame = 0;
    this.startTime = 0;
  }

  start() {
    this.recording = true;
    this.frames = [];
    this.currentFrame = 0;
    this.startTime = performance.now();
  }

  stop() {
    this.recording = false;
    return {
      frames: this.frames,
      duration: performance.now() - this.startTime,
      frameCount: this.frames.length
    };
  }

  recordFrame(inputs) {
    if (!this.recording) return;

    this.frames.push({
      frame: this.currentFrame,
      timestamp: performance.now() - this.startTime,
      inputs: { ...inputs }
    });

    this.currentFrame++;
  }

  save(name = 'replay') {
    const data = {
      name,
      frames: this.frames,
      duration: performance.now() - this.startTime,
      frameCount: this.frames.length,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(`impact2d_replay_${name}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[replay] Failed to save replay:', e);
      return false;
    }
  }

  load(name = 'replay') {
    try {
      const data = localStorage.getItem(`impact2d_replay_${name}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('[replay] Failed to load replay:', e);
      return null;
    }
  }

  listReplays() {
    const replays = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('impact2d_replay_')) {
        const name = key.replace('impact2d_replay_', '');
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          replays.push({
            name,
            frameCount: data.frameCount,
            duration: data.duration,
            timestamp: data.timestamp
          });
        } catch (e) {
          // Skip invalid replays
        }
      }
    }
    return replays;
  }

  delete(name = 'replay') {
    localStorage.removeItem(`impact2d_replay_${name}`);
  }
}

export class ReplayPlayer {
  constructor() {
    this.playing = false;
    this.frames = [];
    this.currentFrameIndex = 0;
    this.startTime = 0;
    this.speed = 1.0;
    this.loop = false;
    this.onComplete = null;
  }

  load(replayData) {
    this.frames = replayData.frames || [];
    this.currentFrameIndex = 0;
    return this.frames.length > 0;
  }

  play(loop = false, speed = 1.0) {
    if (this.frames.length === 0) return false;

    this.playing = true;
    this.loop = loop;
    this.speed = speed;
    this.currentFrameIndex = 0;
    this.startTime = performance.now();
    return true;
  }

  stop() {
    this.playing = false;
    this.currentFrameIndex = 0;
  }

  pause() {
    this.playing = false;
  }

  resume() {
    this.playing = true;
    this.startTime = performance.now();
  }

  update() {
    if (!this.playing || this.frames.length === 0) return null;

    const elapsed = (performance.now() - this.startTime) * this.speed;
    
    // Find the frame that should be playing now
    while (this.currentFrameIndex < this.frames.length) {
      const frame = this.frames[this.currentFrameIndex];
      
      if (frame.timestamp > elapsed) {
        break;
      }

      this.currentFrameIndex++;
    }

    // Check if replay finished
    if (this.currentFrameIndex >= this.frames.length) {
      if (this.loop) {
        this.currentFrameIndex = 0;
        this.startTime = performance.now();
      } else {
        this.playing = false;
        if (this.onComplete) {
          this.onComplete();
        }
        return null;
      }
    }

    // Return current frame inputs
    if (this.currentFrameIndex > 0 && this.currentFrameIndex <= this.frames.length) {
      return this.frames[this.currentFrameIndex - 1].inputs;
    }

    return null;
  }

  seek(frameIndex) {
    this.currentFrameIndex = Math.max(0, Math.min(this.frames.length - 1, frameIndex));
    this.startTime = performance.now() - (this.frames[this.currentFrameIndex]?.timestamp || 0);
  }

  getProgress() {
    if (this.frames.length === 0) return 0;
    return this.currentFrameIndex / this.frames.length;
  }

  getCurrentFrame() {
    return this.currentFrameIndex;
  }

  getTotalFrames() {
    return this.frames.length;
  }
}

// Global instances
export const replayRecorder = new ReplayRecorder();
export const replayPlayer = new ReplayPlayer();
