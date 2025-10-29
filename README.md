# !mpact2d — GitHub Pages Package (No Install)

Dies ist eine **Zero‑Install** Variante von **!mpact2d** für **GitHub Pages** / **Netlify**.
Alles sind **ES‑Module** im Browser. Keine Builds, kein Node.

## Deploy (GitHub Pages)
1. Neues Repo erstellen (z. B. `impact2d-ghpages`).
2. Inhalte dieses ZIPs an die **Repo‑Wurzel** hochladen und committen.
3. In den **Repository Settings → Pages**: Deploy from **Branch: main / root**.
4. Öffne die angezeigte Page‑URL (z. B. `https://<user>.github.io/impact2d-ghpages/`).

## Struktur
- `index.html` – Demo-Einstieg
- `engine/` – Minimal-Engine (SceneGraph + Components + Loop)
- `assets/` – Platzhalter für Bilder/JSON

## Hinweis
- PIXI wird per CDN geladen.
- Diese Variante ist auf **Option B (SceneGraph + Components)** ausgelegt und bewusst minimal gehalten.
