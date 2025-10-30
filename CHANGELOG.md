# !mpact2d Engine – CHANGELOG
(Chronological history from v0.1 → v0.7d2)

## 🧩 v0.1 – Project Setup & Core Structure
**Date:** 2025-02-01  
**Build Tag:** CORE-INIT-2025-02-01

### Added
- Repository **impact2d-engine** created (Go-Monorepo architecture).
- Base folder layout: `/engine`, `/demos`, `/docs`.
- Core systems stubbed: `Game`, `Scene`, `Node`, `Transform`, `Sprite`, `Component`.
- Simple rendering pipeline using **PIXI.js** with placeholder scene.

### Changed
- Unified build script for GitHub Actions.
- Web-friendly structure (no local installation required).

### Fixed
- Initial rendering delay under GitHub Pages.

### Description
> First public baseline of the engine. Defines ECS-style architecture and render loop.

---

## ⚙️ v0.2 – Renderer Integration & Input System
**Date:** 2025-02-10  
**Build Tag:** RENDER-INPUT-2025-02-10

### Added
- **PixiRenderer** module with layered rendering.
- Layer registry: `sky`, `far`, `mid`, `default`, `ui`.
- **Input system** (`Input` class with key states).
- Added FPS meter and on-screen HUD.

### Changed
- Improved main loop delta-time accuracy.
- Refactored `Game.start()` for async renderer init.

### Fixed
- Missing texture flush on resize.

---

## 🔧 v0.3 – Movement & Scene Handling
**Date:** 2025-02-17  
**Build Tag:** MOVE-SCENE-2025-02-17

### Added
- **MoveScript** component (keyboard movement).
- Camera follow system.
- SceneManager prototype for switching levels.

### Changed
- Normalized coordinate system to tile grid.

### Fixed
- Player jitter on diagonal movement.

---

## 🧱 v0.4 – Core Physics & Collision Preparation
**Date:** 2025-02-25  
**Build Tag:** CORE-PHYS-PREP-2025-02-25

### Added
- Groundwork for tile-based physics (`moveWithTileCollisions` draft).
- Tile material types (`wall`, `floor`, `water`, `sand`, `lava`).

### Changed
- Player movement quantized to tile size (32 px).

---

## 🧮 v0.5 – Tilemap & Grid Physics
**Date:** 2025-03-05  
**Build Tag:** TILEMAP-GRID-PHYS-2025-03-05

### Added
- Finalized tile collision system.
- Material logic with `speedMul` & `lethal` flags.
- Color palette per material.

### Changed
- Physics handled in two passes (X/Y separation).

---

## 🧩 v0.5a – Hotfix: Collision Precision
**Date:** 2025-03-06  
**Build Tag:** TILEMAP-COLLIDE-HOTFIX-2025-03-06

### Fixed
- Over-eager wall detection corrected using **Inset + EPS** adjustment.

---

## 🧩 v0.5b – Hotfix: Layer Alignment
**Date:** 2025-03-07  
**Build Tag:** TILEMAP-COLLIDE-LAYERFIX-2025-03-07

### Fixed
- Fixed mismatch between visual and physical layers.

---

## 🎯 v0.6 – Trigger Zones
**Date:** 2025-03-15  
**Build Tag:** TRIGGERS-2025-03-15

### Added
- `engine/triggers.js` module.
- Trigger types: `onEnter`, `onStay`, `onExit`, with `once` flag.
- HUD messages on trigger events.

---

## 🩹 v0.6a – Hotfix: HUD/Map Adjustments
**Date:** 2025-03-16  
**Build Tag:** TRIGGERS-HOTFIX-2025-03-16

### Fixed
- HUD placeholders fixed.
- Start area cleared.
- Thinner diagonals for test maps.

---

## 🧰 v0.7 – Entity Factory
**Date:** 2025-03-25  
**Build Tag:** ENTITY-FACTORY-2025-03-25

### Added
- `engine/factory.js` for prefabs & spawn.
- Prefabs: `crate`, `gem`, `bot`.
- Optional sprite, size, layer, and property handling.

---

## 🔧 v0.7b – Hotfix: Trigger Demo & Lava Patch
**Date:** 2025-03-26  
**Build Tag:** ENTITY-FACTORY-TRIGGERS-HOTFIX-2025-03-26

### Fixed
- Trigger zones placed along start corridor.
- Visible lava patch added.
- Pickup demo re-enabled.

---

## 💎 v0.7c – Gem Visibility Fix
**Date:** 2025-03-27  
**Build Tag:** ENTITY-FACTORY-GEMFIX-2025-03-27

### Fixed
- `gem` enlarged to 24 px.
- Relocated to tile (15, 9).
- Pickup trigger aligned.

---

## ⚔️ v0.7d – Entity Collision Flags
**Date:** 2025-10-29  
**Build Tag:** ENTITY-COLLISION-2025-10-29

### Added
- `engine/collider.js`: Collider component (AABB + registry).
- Factory supports `collider { size, solid }`.
- Player blocked by solid entities (`crate`, `bot`).

### Changed
- Entity collision resolution added after tile collision.

---

## 🩹 v0.7d Hotfix – Syntax Error Fix
**Date:** 2025-10-29  
**Build Tag:** ENTITY-COLLISION-HOTFIX-2025-10-29

### Fixed
- Removed invalid `await import(...)`.
- Switched to static import for `EntityFactory`.

---

## 🧠 v0.7d2 – Trigger Driver Hotfix
**Date:** 2025-10-29  
**Build Tag:** ENTITY-COLLISION-HOTFIX2-2025-10-29

### Fixed
- Re-added `TriggerDriver` for ticking triggers.
- HUD feedback restored for all zones.
- Gem pickup HUD message functional again.

---

# 🧭 Summary of Milestones

| Version | Date | Build Tag | Focus / Description |
|:--|:--|:--|:--|
| v0.1 | 2025-02-01 | CORE-INIT-2025-02-01 | Project setup & ECS architecture |
| v0.2 | 2025-02-10 | RENDER-INPUT-2025-02-10 | Renderer + Input foundation |
| v0.3 | 2025-02-17 | MOVE-SCENE-2025-02-17 | Movement + camera follow |
| v0.4 | 2025-02-25 | CORE-PHYS-PREP-2025-02-25 | Physics framework prep |
| v0.5 | 2025-03-05 | TILEMAP-GRID-PHYS-2025-03-05 | Tilemap collision system |
| v0.5a | 2025-03-06 | TILEMAP-COLLIDE-HOTFIX-2025-03-06 | Collision precision fix |
| v0.5b | 2025-03-07 | TILEMAP-COLLIDE-LAYERFIX-2025-03-07 | Layer alignment fix |
| v0.6 | 2025-03-15 | TRIGGERS-2025-03-15 | Trigger zones system |
| v0.6a | 2025-03-16 | TRIGGERS-HOTFIX-2025-03-16 | HUD and map tuning |
| v0.7 | 2025-03-25 | ENTITY-FACTORY-2025-03-25 | Entity Factory (prefabs & spawn) |
| v0.7b | 2025-03-26 | ENTITY-FACTORY-TRIGGERS-HOTFIX-2025-03-26 | Trigger demo & lava patch |
| v0.7c | 2025-03-27 | ENTITY-FACTORY-GEMFIX-2025-03-27 | Gem visibility & pickup alignment |
| v0.7d | 2025-10-29 | ENTITY-COLLISION-2025-10-29 | Entity collision flags |
| v0.7d Hotfix | 2025-10-29 | ENTITY-COLLISION-HOTFIX-2025-10-29 | Syntax fix (await import) |
| v0.7d2 | 2025-10-29 | ENTITY-COLLISION-HOTFIX2-2025-10-29 | Re-enabled TriggerDriver & HUD |
