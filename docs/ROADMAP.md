# !mpact2d Engine – ROADMAP
(Chronological milestones & development status)

## ✅ Completed Milestones

### v0.1 – Core Setup
- ✅ Project initialization, ECS architecture established.
- ✅ Basic render & update loop via PIXI.js.
- ✅ GitHub Actions build verified.

### v0.2 – Renderer & Input
- ✅ Renderer layers implemented.
- ✅ Input system with key mapping active.
- ✅ FPS meter & HUD overlay added.

### v0.3 – Movement & Scene Control
- ✅ Player movement and camera follow components.
- ✅ Scene transitions supported.

### v0.4 – Physics Preparation
- ✅ Tile-based grid physics prototype created.
- ✅ Material types defined (wall, floor, water, sand, lava).

### v0.5 – Grid Collision System
- ✅ Full collision resolution (X/Y separated).
- ✅ Speed modifiers & lethal tiles functional.

### v0.5a/b – Hotfixes
- ✅ Collision precision (Inset + EPS).
- ✅ Layer alignment between visuals & physics.

### v0.6 – Trigger System
- ✅ Trigger zones (onEnter, onStay, onExit, once).
- ✅ HUD integration for event feedback.

### v0.6a – Trigger Hotfix
- ✅ HUD text fix and optimized map layout.

### v0.7 – Entity Factory
- ✅ Prefab registry + `spawn(name, options)`.
- ✅ Entities: crate, gem, bot.
- ✅ Layer + sprite + property injection.

### v0.7b – Trigger Demo & Lava Patch
- ✅ Lava and pickup zones added.
- ✅ Corridor triggers placed reliably.

### v0.7c – Gem Visibility Fix
- ✅ Enlarged gem, repositioned to (15,9).
- ✅ Pickup alignment validated.

### v0.7d – Entity Collision Flags
- ✅ Collider component (`engine/collider.js`).
- ✅ Solid entity blocking enabled (crate, bot).

### v0.7d Hotfix
- ✅ Fixed invalid `await import(...)` → static import.

### v0.7d2 – TriggerDriver Hotfix
- ✅ Trigger ticking restored.
- ✅ HUD event feedback and pickup text reactivated.

---

## 🔄 In Progress
### v0.7e – Behavior System
- Implement modular behavior components:
  - `pickup`: remove entity + increase HUD counter.
  - `patrol`: basic movement logic for AI entities.
- Add shared `BehaviorManager` for ticking logic.

---

## ⏭ Planned
### v0.8 – JSON Map Loader
- Parse external JSON maps with tile + spawn data.
- Introduce editor-compatible layer parsing.

### v0.9 – UI System
- Create flexible UI layer (buttons, overlays, counters).

### v1.0 – Public Beta
- Documentation and template demo for developers.
- Performance optimization and modular export system.

---
**Legend:**  
✅ = Completed 🔄 = In Progress ⏭ = Planned
