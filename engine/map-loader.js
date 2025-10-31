// !mpact2d — Map Loader (v0.8a hotfix)
export async function loadMap(nameOrUrl) {
  // Robust path handling: support bare name ("demo"), relative path ("maps/demo.json") or absolute ("/.../demo.json")
  const isExplicitPath = /\\//.test(nameOrUrl||'') || (nameOrUrl||'').endsWith('.json');
  const url = isExplicitPath ? (nameOrUrl || 'maps/demo.json') : `maps/${nameOrUrl||'demo'}.json`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`MapLoader: failed to load ${url} (${res.status})`);
  const map = await res.json();

  map.tileSize = map.tileSize || 32;
  map.width = map.width || (map.tiles?.[0]?.length ?? 0);
  map.height = map.height || (map.tiles?.length ?? 0);
  map.name = map.name || 'Unnamed Map';
  map.palette = map.palette || {};
  map.entities = map.entities || [];
  map.triggers = map.triggers || [];
  return map;
}

export function queryMapName() {
  const q = new URLSearchParams(location.search);
  return q.get('map') || 'demo';
}