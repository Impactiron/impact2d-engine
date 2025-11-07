# Impact2D Engine

![Impact2D Logo](./assets/logo-impact2d.svg)

**A complete, pure ESM 2D game engine that runs entirely in the browser with no external servers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Pixi.js v8](https://img.shields.io/badge/PixiJS-v8-green.svg)](https://pixijs.com/)
[![ESM](https://img.shields.io/badge/Module-ESM-yellow.svg)]()

## 🚀 Quick Start

**No installation required!** Just open `index.html` in a browser or serve it via GitHub Pages.

```bash
# Optional: Local development server
npx serve .
```

Visit [https://impactiron.github.io/impact2d-engine/](https://impactiron.github.io/impact2d-engine/) to see it live!

## ✨ Features

### Core Engine
- **Pure ESM modules** - No bundler required to run
- **PixiJS v8 renderer** - Modern WebGL-based 2D rendering via ESM CDN
- **Component-based architecture** - Flexible ECS-style system
- **Scene graph** - Hierarchical node system with lifecycle hooks

### Physics & Collision
- 2D AABB collision detection (swept and static)
- Restitution (elasticity) and friction
- Spatial hash broadphase optimization
- Tile-based collision maps
- Gravity and ground detection

### Graphics & Animation
- Sprite sheet animator with FPS control, ping-pong, and events
- Tween system with easing functions
- Particle emitters (CPU/GPU) with presets
- Layered rendering with parallax support
- Camera system with follow, lerp, bounds, and shake

### Audio
- WebAudio API wrapper
- 2D positional audio via PannerNode
- Music/SFX channels with ducking
- Load, play, stop, volume, and loop controls

### AI & Pathfinding
- Finite State Machine (FSM)
- Steering behaviors (seek, flee, arrive, wander)
- A* pathfinding with diagonal movement
- Optional Web Worker for heavy pathfinding

### Input & Haptics
- Keyboard (WASD/Arrows/Space/Shift)
- Mouse (position/click)
- Touch (tap/drag)
- Gamepad API with rumble support
- Vibration API fallback

### Networking (Serverless)
- **BroadcastChannel** for local multiplayer (same machine, multiple tabs)
- WebRTC adapter interface (commented stub)
- Simple message passing API

### Persistence & Replay
- **Save/Load system** with 3 slots using LocalStorage
- IndexedDB alternative for larger saves
- **Replay system** for deterministic input recording/playback
- Export/import save data as JSON

### Streaming & Progressive Loading
- Asset streamer with progress events
- Chunk-based map streaming
- JSON, image, audio, and blob loaders

### Localization
- Multi-language support (en, de included)
- LocalStorage persistence
- Variable replacement in translations

### Developer Tools
- Object pools for memory management
- Fixed timestep accumulator
- Performance profiler
- Debug overlay (toggle with F1)

## 📁 Project Structure

```
impact2d-engine/
├── index.html              # Main entry point
├── styles.css              # Dark theme Impact2D styling
├── assets/                 # Sprites, audio, logo
├── i18n/                   # Localization files (en.json, de.json)
├── maps/                   # Map JSON files
│   └── test-map.json
├── engine/                 # Core engine modules
│   ├── main.js             # Bootstrap & initialization
│   ├── game.js             # Game loop (fixed + variable step)
│   ├── scene.js            # Scene graph with lifecycle hooks
│   ├── node.js             # Base node implementation
│   ├── camera.js           # Camera system
│   ├── physics.js          # 2D AABB physics
│   ├── renderer-pixi.js    # PixiJS v8 renderer
│   ├── assets.js           # Asset loader
│   ├── maploader.js        # Map JSON loader
│   ├── input.js            # Keyboard, mouse, touch, gamepad
│   ├── haptics.js          # Rumble & vibration
│   ├── audio.js            # WebAudio wrapper
│   ├── animation.js        # Sprite animator & tweens
│   ├── ai.js               # FSM, steering, A* pathfinding
│   ├── particles.js        # Particle emitters
│   ├── replay.js           # Input recording/playback
│   ├── save.js             # Save/load system
│   ├── stream.js           # Progressive loading
│   ├── net.js              # BroadcastChannel networking
│   ├── i18n.js             # Localization
│   ├── eventbus.js         # Pub/sub events
│   ├── memory.js           # Object pools & profiler
│   ├── utils.js            # Common utilities
│   ├── factory.js          # Entity factory & prefabs
│   └── worker/
│       └── pathfinding.worker.js  # A* in Web Worker
├── examples/               # Interactive demos
│   ├── index.html          # Examples hub
│   ├── demo-basic.html     # Player + camera
│   ├── demo-physics.html   # Collisions & physics
│   ├── demo-factory.html   # Entity spawning
│   ├── demo-ai.html        # AI & pathfinding
│   ├── demo-audio.html     # Audio system
│   ├── demo-particles.html # Particle effects
│   ├── demo-network-local.html  # Local multiplayer
│   └── demo-replay.html    # Replay system
├── .github/workflows/
│   └── lint-build.yml      # CI: ESLint & Prettier
├── eslint.config.js        # ESLint v9 flat config
├── .prettierrc             # Prettier config
├── package.json            # Dev dependencies
└── LICENSE                 # MIT License
```

## 🎮 API Overview

### Scene & Nodes

```javascript
import { Scene, Node } from './engine/scene.js';

const scene = new Scene('game');
const player = new Node('player');

// Lifecycle hooks
player.init = () => console.log('Init');
player.fixedUpdate = (dt) => { /* Physics at 60Hz */ };
player.update = (dt) => { /* Variable update */ };
player.render = (renderer) => { /* Custom rendering */ };

scene.add(player);
```

### Physics

```javascript
import { PhysicsWorld, PhysicsBody } from './engine/physics.js';

const world = new PhysicsWorld();
const body = new PhysicsBody(x, y, width, height);
body.restitution = 0.7; // Bounce
body.friction = 0.8;
world.addBody(body);

// Update in game loop
world.update(dt);
```

### Camera

```javascript
import { Camera } from './engine/camera.js';

const camera = new Camera(x, y);
camera.follow(playerTransform, 0.1); // Lerp factor
camera.setBounds(0, 0, mapWidth, mapHeight);
camera.shake(10, 500); // Shake effect

// In update loop
camera.update(dt);
renderer.setCamera(camera.getX(), camera.getY());
```

### Audio

```javascript
import { audio } from './engine/audio.js';

await audio.init();
await audio.load('bgm', './assets/music.mp3');
const source = audio.play('bgm', { 
  loop: true, 
  volume: 0.5, 
  channel: 'music' 
});

// Positional audio
audio.play('sfx', { 
  positional: true, 
  x: 100, 
  y: 200 
});
```

### Particles

```javascript
import { ParticleEmitter, ParticlePresets } from './engine/particles.js';

const emitter = new ParticleEmitter(x, y, ParticlePresets.explosion);
emitter.setContainer(renderer.getLayerContainer('particles'));
emitter.emit(50); // Burst

// Continuous emission
emitter.start();
emitter.update(dt);
```

### AI & Pathfinding

```javascript
import { Pathfinder, FSM, Steering } from './engine/ai.js';

// A* Pathfinding
const pathfinder = new Pathfinder(gridData, width, height);
const path = pathfinder.findPath(startX, startY, endX, endY);

// FSM
const fsm = new FSM('idle');
fsm.addState('idle', onEnter, onUpdate, onExit);
fsm.addTransition('idle', 'chase', context => context.playerNear);

// Steering
const velocity = Steering.seek(x, y, targetX, targetY, maxSpeed);
```

### Networking (Local Multiplayer)

```javascript
import { net } from './engine/net.js';

net.connect();
net.on('player_move', data => {
  console.log('Player moved:', data);
});
net.send('player_move', { x: 100, y: 200 });
```

### Save/Load

```javascript
import { saveSystem } from './engine/save.js';

const gameState = {
  mapId: 'level1',
  playerPos: { x: 100, y: 200 },
  stats: { hp: 100, score: 500 }
};

saveSystem.save(0, gameState); // Slot 0
const loaded = saveSystem.load(0);
```

### Replay

```javascript
import { replayRecorder, replayPlayer } from './engine/replay.js';

// Record
replayRecorder.start();
replayRecorder.recordFrame({ keys: ['w', 's'], mouse: { x: 100, y: 200 } });
replayRecorder.save('my-replay');

// Playback
const replayData = replayRecorder.load('my-replay');
replayPlayer.load(replayData);
replayPlayer.play();
const inputs = replayPlayer.update(); // Returns inputs for current frame
```

## 🛠️ Development

### Prerequisites
- Node.js 20+ (for linting/formatting only)
- Modern browser with ES2022 support

### Scripts

```bash
npm install         # Install dev dependencies
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run format:check # Check formatting
```

### Running Locally

No build step required! Just serve the files:

```bash
# Using Node.js http-server
npx http-server -p 8000

# Using Python
python -m http.server 8000

# Using PHP
php -S localhost:8000
```

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- ESLint and Prettier pass
- Code follows existing style
- All examples work on GitHub Pages
- No external dependencies beyond PixiJS CDN

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api.md)
- [Examples](./docs/examples.md)
- [Changelog](./CHANGELOG.md)

## 🌟 Showcase

Visit [examples/index.html](./examples/index.html) to see live demos of:
- Basic player movement and camera
- Physics collisions
- AI pathfinding
- Particle effects
- Local multiplayer
- Replay system

---

**Built with ❤️ using pure ESM and PixiJS v8**
