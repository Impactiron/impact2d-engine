# !mpact2d Engine – CHANGELOG

## 🧠 v0.7e – Behavior System (Unreleased)
**Date:** 2025-10-31  
**Build Tag:** BEHAVIOR-2025-10-31

### Added
- `BehaviorManager` (attach/detach/update, pause/resume)
- Behaviors: `pickup`, `patrol`
- Demo: `demos/demo_behaviors.html`

### Changed
- `EntityFactory`: `behaviors: []`-Support
- `HUD`: `increment(key, by)` + optionaler Toast

### Fixed
- Cleanup von Behaviors bei Scene-Wechsel (kein Update nach Despawn)
