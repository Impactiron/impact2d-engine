/**
 * Impact2D Engine - Haptics
 * Gamepad rumble and Vibration API wrapper
 */

export class HapticsEngine {
  constructor() {
    this.gamepads = [];
    this.vibrationSupported = 'vibrate' in navigator;
  }

  update() {
    // Poll gamepad state
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    this.gamepads = Array.from(gps).filter(gp => gp !== null);
  }

  // Gamepad rumble (if supported)
  rumble(intensity = 1.0, duration = 200, gamepadIndex = 0) {
    if (gamepadIndex >= this.gamepads.length) return false;

    const gamepad = this.gamepads[gamepadIndex];
    if (!gamepad || !gamepad.vibrationActuator) return false;

    try {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration,
        weakMagnitude: intensity * 0.5,
        strongMagnitude: intensity
      });
      return true;
    } catch (e) {
      console.warn('[haptics] Gamepad rumble failed:', e);
      return false;
    }
  }

  // Vibration API fallback (mobile devices)
  vibrate(pattern) {
    if (!this.vibrationSupported) return false;

    try {
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(pattern);
      }
      return true;
    } catch (e) {
      console.warn('[haptics] Vibration failed:', e);
      return false;
    }
  }

  // Convenience methods
  pulse(intensity = 1.0, duration = 100) {
    const rumbled = this.rumble(intensity, duration);
    if (!rumbled) {
      this.vibrate(duration);
    }
  }

  doublePulse(intensity = 1.0) {
    const rumbled = this.rumble(intensity, 100);
    if (!rumbled) {
      this.vibrate([100, 50, 100]);
    }
  }

  stop() {
    // Stop vibration
    if (this.vibrationSupported) {
      navigator.vibrate(0);
    }

    // Stop all gamepad rumble
    for (const gamepad of this.gamepads) {
      if (gamepad && gamepad.vibrationActuator) {
        try {
          gamepad.vibrationActuator.reset();
        } catch (e) {
          // Ignore
        }
      }
    }
  }
}

// Global singleton instance
export const haptics = new HapticsEngine();
