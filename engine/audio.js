/**
 * Impact2D Engine - Audio
 * WebAudio wrapper with positional audio and channels
 */

export class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.sounds = new Map();
    this.playing = new Map();
    this.initialized = false;
    
    // Camera/listener position for positional audio
    this.listenerX = 0;
    this.listenerY = 0;
  }

  async init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();

      // Create gain nodes for volume control
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);

      this.musicGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.context.createGain();
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.error('[audio] Failed to initialize AudioContext:', e);
    }
  }

  async load(name, url) {
    if (!this.initialized) await this.init();

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      return true;
    } catch (e) {
      console.error(`[audio] Failed to load sound: ${name}`, e);
      return false;
    }
  }

  play(name, options = {}) {
    if (!this.initialized || !this.sounds.has(name)) return null;

    const {
      loop = false,
      volume = 1,
      channel = 'sfx', // 'music' or 'sfx'
      positional = false,
      x = 0,
      y = 0,
      maxDistance = 1000
    } = options;

    const buffer = this.sounds.get(name);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    let gainNode = this.context.createGain();
    gainNode.gain.value = volume;

    if (positional) {
      // Create panner for 2D positional audio
      const panner = this.context.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 100;
      panner.maxDistance = maxDistance;
      panner.rolloffFactor = 1;

      // Convert 2D position to 3D (z = 0)
      panner.setPosition(x, y, 0);

      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(channel === 'music' ? this.musicGain : this.sfxGain);

      // Store panner for position updates
      const playingSound = { source, gainNode, panner, x, y };
      this.playing.set(source, playingSound);
    } else {
      source.connect(gainNode);
      gainNode.connect(channel === 'music' ? this.musicGain : this.sfxGain);

      const playingSound = { source, gainNode, panner: null };
      this.playing.set(source, playingSound);
    }

    source.onended = () => {
      this.playing.delete(source);
    };

    source.start(0);
    return source;
  }

  stop(source) {
    if (source && this.playing.has(source)) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      this.playing.delete(source);
    }
  }

  stopAll() {
    for (const [source] of this.playing) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    }
    this.playing.clear();
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setMusicVolume(volume) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setSfxVolume(volume) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setListenerPosition(x, y) {
    this.listenerX = x;
    this.listenerY = y;

    if (this.context && this.context.listener) {
      // Update 3D audio listener position
      if (this.context.listener.positionX) {
        this.context.listener.positionX.value = x;
        this.context.listener.positionY.value = y;
        this.context.listener.positionZ.value = 0;
      } else {
        this.context.listener.setPosition(x, y, 0);
      }
    }
  }

  updateSoundPosition(source, x, y) {
    const sound = this.playing.get(source);
    if (sound && sound.panner) {
      sound.x = x;
      sound.y = y;
      sound.panner.setPosition(x, y, 0);
    }
  }

  // Duck music when SFX plays (simple dynamic mixing)
  duck(duration = 0.5, duckAmount = 0.3) {
    if (!this.musicGain) return;

    const originalVolume = this.musicGain.gain.value;
    const duckVolume = originalVolume * (1 - duckAmount);

    this.musicGain.gain.linearRampToValueAtTime(
      duckVolume,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.musicGain.gain.linearRampToValueAtTime(
        originalVolume,
        this.context.currentTime + duration
      );
    }, duration * 1000);
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }
}

// Global singleton instance
export const audio = new AudioEngine();
