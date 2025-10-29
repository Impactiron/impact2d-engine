# !mpact2d – Roadmap

**Architektur:** Hybrid SceneGraph + Components • Ziel: leichte 2D-Engine für Browser (Desktop & Mobile).  
**Status:** Online-Demo via GitHub Pages & Actions aktiv.

## Milestones
| Version | Status | Ziel | Kurzbeschreibung |
|--------:|:------:|------|------------------|
| v0.1 | ✅ | Core Engine | SceneGraph, Components, GameLoop, Input |
| v0.2 | ✅ | Renderer (PIXI) | Layer-System, Sprites, HUD |
| v0.3 | ✅ | Parallax & Kamera | Tiefenebenen + Kamera-Follow |
| v0.4 | ✅ | Physics Lite (AABB) | Kollision, Slide, Hindernisse |
| v0.5 | 🔜 | Tilemap System | Grid-Welt, Block-Kollision |
| v0.6 | 🔜 | Trigger Zones | Enter/Exit-Events, Schalter |
| v0.7 | 🔜 | Entity Factory | Prefabs, Spawns, Clones |
| v0.8 | 🔜 | Audio Engine | WebAudio, SFX/Musik, Mixer |
| v0.9 | 🔜 | Save/Load | JSON SaveStates, Flags |
| v0.95 | 🔜 | Steuerung anpassbar & Touch | Key-Rebinding, On-Screen-Controls (Mobile) |
| v1.0 | 🔜 | Demo Game | Showcase „Asteroid Outpost“ |
| v1.1 | 🔜 | UI-System | Fenster, Buttons, Dialoge, Healthbars |
| v1.2 | 🔜 | Inventory-System | Slots, Items, Drag & Drop |
| v1.3 | 🔜 | Design-Vorlagen | Menü-/HUD-Templates |
| v1.4 | 🔜 | Baukastensystem | Visuelle Komponenten-Zusammenstellung |

## Hinweise zur Priorisierung
1. **Tilemap** vor **Demo Game**, damit Content-Produktion effizient ist.  
2. **Input-Rebinding & Touch** noch **vor v1.0**, damit die Demo auf Mobile stabil spielbar ist.  
3. **UI + Inventory** nach v1.0, dann Templates & Baukastensystem.

## Technische Leitplanken
- TypeScript-API-Design (auch für JS nutzbar), ESM, keine Buildpflicht fürs Demo.  
- PIXI-Adapter modular, Canvas-Fallback optional.  
- Keine evals; LocalStorage nur für Saves; Events über Bus / Hooks.
