# !mpact2d – Versionsverlauf

Alle relevanten Releases/Builds mit kurzer Zusammenfassung.

## 2025-10-29 — v0.4 „Physics Lite“
- **Neu:** AABB-Kollision & Slide-Resolver (X- und Y-Achse separat)
- **Neu:** Weltgrenzen (1000×1000) + interne Hindernisse
- **Renderer:** unterstützt `rect:WxH` für Wände
- **HUD:** Build-Tag `PHYS-2025-10-29a`

## 2025-10-29 — v0.3 „Parallax & Camera“
- **Neu:** Parallax-Layer (`sky`, `far`, `mid`, `default`) mit Faktoren 0.2/0.5/0.8/1.0
- **Neu:** Kamera-Follow auf Spieler
- **HUD:** Build-Tag `PARALLAX-2025-10-29b`

## 2025-10-29 — v0.2 „Renderer & Demo“
- **Neu:** PIXI-Renderer (Layer, Sprite-Rendering)
- **Neu:** Zero-Install-Demo via GitHub Pages + Actions
- **Fix:** Sichtbarer Spieler (Rechteck statt externer Bildquelle)
- **HUD:** FPS-Anzeige

## 2025-10-29 — v0.1 „Core Engine“
- **Neu:** SceneGraph + Components, GameLoop (fixed + render), Input (Keyboard)
- **Neu:** Assets-Stubs, Basis-Math, einfache APIs
- **Setup:** Repo `impact2d-engine`, Actions-Workflow für Pages

## 2025-10-29 — v0.6 Trigger Zones
- **Neu:** `engine/triggers.js` – rechteckige Zonen mit **onEnter / onStay / onExit** und `once`
- **Demo:** Vier Beispielzonen (Hint, Slow-Area, Pickup, Lava-Warnung) mit HUD-Text
- **Build:** TRIGGERS-2025-10-29
