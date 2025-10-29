# Changelog

Alle nennenswerten Änderungen an **!mpact2d** werden in diesem Dokument festgehalten.
Dieses Projekt folgt semantischer Versionierung, soweit sinnvoll.
Format angelehnt an „Keep a Changelog“.

## [Unreleased]
### Geplant (Roadmap)
- v0.5 – Tilemap System (Grid-Welt, Block-Kollision)
- v0.6 – Trigger Zones (Enter/Exit-Events, Schalter)
- v0.7 – Entity Factory (Prefabs, Spawns, Clones)
- v0.8 – Audio Engine (WebAudio, SFX/Musik, Mixer)
- v0.9 – Save/Load (JSON SaveStates, Flags)
- v0.95 – Steuerung anpassbar & Touch (Key-Rebinding, On-Screen-Controls)
- v1.0 – Demo Game (Showcase „Asteroid Outpost“)
- v1.1 – UI-System (Fenster, Buttons, Dialoge, Healthbars)
- v1.2 – Inventory-System (Slots, Items, Drag & Drop)
- v1.3 – Design-Vorlagen (Menü-/HUD-Templates)
- v1.4 – Baukastensystem (visuelle Komponenten-Zusammenstellung)

## [0.4.0] - 2025-10-29
### Added
- **AABB-Kollision & Slide-Resolver** (X-/Y-achsenweise Korrektur)
- **Weltgrenzen** (1000×1000) und **innere Hindernisse**
- Renderer: Unterstützung für **`rect:WxH`** (rechteckige Sprites in beliebiger Größe)
- HUD: Build-Tag `PHYS-2025-10-29a`

## [0.3.0] - 2025-10-29
### Added
- **Parallax-Layer**: `sky` (0.2), `far` (0.5), `mid` (0.8), `default` (1.0)
- **Kamera-Follow** auf Spieler
- HUD: Build-Tag `PARALLAX-2025-10-29b`

## [0.2.0] - 2025-10-29
### Added
- **PIXI-Renderer** (Layer, Sprite-Rendering)
- **Zero-Install-Demo** via GitHub Pages + Actions
- HUD: FPS-Anzeige
### Changed
- Spieler-Sprite als **Rechteck** (statt externer Bildquelle) für Zuverlässigkeit

## [0.1.0] - 2025-10-29
### Added
- **Core Engine**: SceneGraph + Components, GameLoop (fixed+render), Input (Keyboard)
- **Assets-Stubs**, Basis-Math
- **Repo `impact2d-engine`** inkl. GitHub Actions für Pages-Deploy
