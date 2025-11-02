# Getting Started

## Lokal testen
1. Repository klonen oder ZIP entpacken.
2. Einen simplen Dev-Server starten (z. B. Python):  
   ```bash
   python -m http.server 8000
   ```  
   und im Browser `http://localhost:8000` öffnen.

## GitHub Pages Deployment
- Der Workflow **.github/workflows/pages.yml** ist enthalten.
- **Settings → Pages → Source: GitHub Actions** aktivieren.
- `index.html` im Repo-Root ist der Einstiegspunkt.
- `.nojekyll` ist vorhanden.

## Projektstruktur (Kurzfassung)
- `engine/` – Engine-Quellcode (ES-Modules).
- `examples/` – Beispiele & Demos.
- `docs/` – Diese Dokumentation.
- `assets/` – (optional) Grafiken/Audio/Fonts.
