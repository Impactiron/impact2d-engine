# Impact2D – Hardenings Paket

Dieses Paket enthält:
- **engine/factory.js** – vollständige, gehärtete Version (drop-in replacement)
- **scripts/apply-hardenings.js** – Patch-Skript für `engine/renderer-pixi.js` (robustes Traversal)

## Verwendung

**Variante A – Manuell (empfohlen, am schnellsten)**
1. Ersetze in deinem Repo die Datei: `engine/factory.js` mit der Version aus diesem Paket.
2. Öffne `engine/renderer-pixi.js`, suche die Zeile:
   ```
   for(const ch of node.children) create(ch);
   ```
   oder:
   ```
   const kids = Array.isArray(node.children) ? node.children : [];
   for (const ch of kids) create(ch);
   ```
   und ersetze durch:
   ```
   const kids = (node && node.children)
     ? (Array.isArray(node.children) ? node.children : Array.from(node.children))
     : [];
   for (const ch of kids) create(ch);
   ```

**Variante B – Automatisch (per Node)**
1. Datei `engine/factory.js` aus diesem Paket in dein Repo kopieren (überschreiben).
2. Lege `scripts/apply-hardenings.js` in dein Repo (wie in diesem Paket).
3. Ausführen:
   ```
   node scripts/apply-hardenings.js
   ```
   Ausgabe sollte sein: `Patched renderer-pixi.js traversal successfully.`

## Warum diese Härtungen?

- `register()` lässt nur noch **Funktionen/Klassen** zu → verhindert Kaskadenfehler beim späteren `new Ctor(props)`.
- Traversal in `renderer-pixi.js` akzeptiert **alle Iterables** und schützt vor `undefined` → keine Crashes, wenn `children` fehlt oder z. B. ein `Set` ist.

Nach dem Ersetzen/Patched:
- Seite neu laden.
- Konsole prüfen: Keine Syntax-/TypeErrors, höchstens Pixi-*Deprecation* Warnungen.
