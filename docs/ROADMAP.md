# !mpact2d Engine – ROADMAP
(Chronological milestones & development status)

## 🔄 In Progress

### v0.7e – Behavior System
- ✅ Architektur: `BehaviorManager` (Lifecycle: attach/detach/update, pause/resume)
- ✅ Behavior **`pickup`**: Entity despawn + HUD-Counter (`HUD.increment(key, by)`)
- ✅ Behavior **`patrol`**: Waypoints, `loop`/`pingpong`, Kollision-respektierend
- ✅ Demo: `demos/demo_behaviors.html` (Pickup + Patrol + HUD-Counter)
- 🧪 Tests: Lifecycle bei Scene-Wechsel, Mehrfach-Behaviors, Kollision an Ecken
- 📄 Doku: CHANGELOG/README aktualisieren

_Status: In Umsetzung am 2025-10-31 (Build Tag: BEHAVIOR-2025-10-31)_
