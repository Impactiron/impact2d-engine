// !mpact2d — Map Loader (v0.8b ESR hotfix)
export async function loadMap(nameOrUrl) {
  var name = nameOrUrl || 'demo';

  // Bereits Pfad oder .json? ? direkt verwenden, sonst maps/<name>.json
  var isExplicit = (name.indexOf('/') !== -1) || /\.json$/i.test(name);
  var rel = isExplicit ? name : ('maps/' + name + '.json');

  // Immer relativ zur aktuellen Seite auflösen (funktioniert auch in Unterordnern)
  var url = (new URL(rel, window.location.href)).toString();

  var res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('MapLoader: failed to load ' + url + ' (' + res.status + ')');
  }
  var map = await res.json();

  map.tileSize = map.tileSize || 32;
  map.width    = map.width    || ((map.tiles && map.tiles[0]) ? map.tiles[0].length : 0);
  map.height   = map.height   || (map.tiles ? map.tiles.length : 0);
  map.name     = map.name     || 'Unnamed Map';
  map.palette  = map.palette  || {};
  map.entities = map.entities || [];
  map.triggers = map.triggers || [];
  return map;
}

export function queryMapName() {
  var q = new URLSearchParams(window.location.search);
  return q.get('map') || 'demo';
}
