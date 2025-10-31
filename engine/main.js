const BUILD = "MAP-LOADER-2025-10-30b";

import { Scene, Node } from './node.js';
import { Component, Transform } from './component.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { PixiRenderer } from './renderer-pixi.js';
import { Sprite } from './sprite.js';
import { Graphics } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';
import { TileTypes, moveWithTileCollisions } from './tilemap-physics.js';
import { TriggerSystem } from './triggers.js';
import { EntityFactory } from './factory.js';
import { getColliders } from './collider.js';
import { PickupBehavior, PatrolBehavior } from './behaviors.js';
import { loadMap, queryMapName } from './map-loader.js';

const scene = new Scene('Root');
const PLAYER_SIZE = 24;

const playerNode = new Node('Player');
const t = playerNode.addComponent(new Transform());
t.position.x = 32 * 3;
t.position.y = 32 * 3;
const playerSprite = playerNode.addComponent(new Sprite('rect:'+PLAYER_SIZE));
playerSprite.layer = 'default';
scene.add(playerNode);

class MoveScript extends Component {
  constructor(input, getSpeedMul){ super(); this.input = input; this.baseSpeed = 0.25; this.getSpeedMul = getSpeedMul; this.dx=0; this.dy=0; }
  onUpdate(dt){
    const tr = this.owner.getComponent(Transform);
    if(!tr) return;
    const mul = this.getSpeedMul ? this.getSpeedMul() : 1.0;
    const s = this.baseSpeed * dt * mul;
    this.dx = 0; this.dy = 0;
    if(this.input.get('ArrowLeft').down || this.input.get('KeyA').down) this.dx -= s;
    if(this.input.get('ArrowRight').down || this.input.get('KeyD').down) this.dx += s;
    if(this.input.get('ArrowUp').down || this.input.get('KeyW').down) this.dy -= s;
    if(this.input.get('ArrowDown').down || this.input.get('KeyS').down) this.dy += s;
  }
}

class CameraFollow extends Component {
  constructor(renderer){ super(); this.r = renderer; }
  onUpdate(){
    const tr = this.owner.getComponent(Transform);
    if(tr) this.r.setCamera(tr.position.x, tr.position.y);
  }
}

const game = new Game();
const renderer = new PixiRenderer();

renderer.init().then(async ()=>{
  renderer.defineLayer('world', 1.0);
  renderer.defineLayer('default', 1.0);
  const input = new Input();

  const mapName = queryMapName();
  let map;
  try {
    // Bare name, Loader hängt maps/<name>.json an
    map = await loadMap(mapName);
  } catch(e){
    console.error('MapLoader failed, fallback map used', e);
    map = { name:'Fallback', tileSize:32, width:20, height:15,
      palette: { 0:0x202733,1:0x586174,2:0xb24b36,3:0x2f6aa5,4:0xa68a5b },
      tiles: Array.from({ length:15 }, function(_,y){ return Array.from({ length:20 }, function(_,x){ return (x===0||y===0||x===19||y===14)?1:0; }); }),
      entities:[{type:'gem',x:15*32,y:9*32},{type:'crate',x:12*32,y:9*32},{type:'bot',x:10*32,y:9*32}],
      triggers:[]
    };
  }

  const TS = map.tileSize|0, W = map.width|0, H = map.height|0;

  // Tiles rendern
  const cont = renderer.getLayerContainer('world');
  cont.removeChildren();
  for(var y=0;y<H;y++){ for(var x=0;x<W;x++){
    var row = map.tiles[y] || [];
    var v = row[x]; if (v === undefined || v === null) v = 0;
    var pal = map.palette || {};
    var col = pal[String(v)]; if (col === undefined) col = pal[v];
    if (col === undefined) col = 0x333333;
    var g = new Graphics(); g.rect(0,0,TS,TS).fill(col); g.x=x*TS; g.y=y*TS; cont.addChild(g);
  }} 

  // Movement & Physics
  const mover = playerNode.addComponent(new MoveScript(input, function(){
    var cx = Math.floor((t.position.x + PLAYER_SIZE/2)/TS);
    var cy = Math.floor((t.position.y + PLAYER_SIZE/2)/TS);
    var id = ((map.tiles[cy] || [])[cx]);
    if (id === undefined || id === null) id = 0;
    var tt = TileTypes[id];
    return tt && tt.speedMul ? tt.speedMul : 1.0;
  }));

  function resolveEntityCollisions(rect) {
    var rx = rect.x, ry = rect.y; var rw = rect.w, rh = rect.h;
    var colls = getColliders();
    for (var i=0;i<colls.length;i++){
      var c = colls[i]; if (!c.solid) continue; if (c.owner === playerNode) continue;
      var b = c.getAABB();
      var overlapX = Math.min(rx+rw, b.x+b.w) - Math.max(rx, b.x);
      var overlapY = Math.min(ry+rh, b.y+b.h) - Math.max(ry, b.y);
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) { rx += (rx < b.x ? -overlapX : overlapX); }
        else { ry += (ry < b.y ? -overlapY : overlapY); }
      }
    }
    return { x: rx, y: ry };
  }

  class TileAndEntityCollisionResolver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      const rectProvider = function(){ return { x: tr.position.x, y: tr.position.y, w: PLAYER_SIZE, h: PLAYER_SIZE }; };
      var res = moveWithTileCollisions(playerNode, mover.dx||0, mover.dy||0, map.tiles, TS, rectProvider);
      res = resolveEntityCollisions({ x: res.x, y: res.y, w: PLAYER_SIZE, h: PLAYER_SIZE });
      tr.position.x = res.x; tr.position.y = res.y;
      const spr = playerNode.getComponent(Sprite);
      if(spr && spr._pixi){ spr._pixi.x = tr.position.x; spr._pixi.y = tr.position.y; }
    }
  }
  playerNode.addComponent(new TileAndEntityCollisionResolver());

  // Entities
  const factory = new EntityFactory();
  factory.register('crate', { sprite:'rect:18', layer:'default', props:{ loot:1 }, collider:{ size:18, solid:true } });
  factory.register('gem',   { sprite:'rect:24', layer:'default', props:{ value:10 }, collider:null });
  factory.register('bot',   { sprite:'rect:16', layer:'default', props:{ hp:5 }, collider:{ size:16, solid:true } });

  var gemCountLocal = 0;
  for (var i=0;i<map.entities.length;i++) {
    var e = map.entities[i];
    var n = factory.spawn(e.type, { x: e.x|0, y: e.y|0 }); if(!n) continue;
    scene.add(n);
    if (e.behavior && e.behavior.patrol) {
      var p = e.behavior.patrol;
      n.addComponent(new PatrolBehavior({ axis:p.axis||'x', from:(p.from||0)|0, to:(p.to||0)|0, speed:p.speed||0.10, pauseMs:p.pauseMs||300 }));
    }
    if (e.type === 'gem') {
      n.addComponent(new PickupBehavior(playerNode, { size:24, playerSize:PLAYER_SIZE, onPickup:function(){ gemCountLocal+=1; lastEvent='Item collected (+1)'; } }));
    }
  }

  // Triggers
  const triggers = new TriggerSystem();
  var trg = map.triggers || [];
  for (var j=0;j<trg.length;j++) {
    var tr = trg[j];
    var r = tr.rect || [0,0,0,0];
    triggers.add({
      x:r[0]|0,y:r[1]|0,w:r[2]|0,h:r[3]|0, once:!!tr.once,
      onEnter: tr.onEnter ? (function(msg){ return function(){ lastEvent = msg; }; })(tr.onEnter) : undefined,
      onExit:  tr.onExit  ? (function(msg){ return function(){ lastEvent = msg; }; })(tr.onExit)  : undefined,
      onStay:  tr.onStay  ? (function(msg){ return function(){ lastEvent = msg; }; })(tr.onStay)  : undefined
    });
  }
  class TriggerDriver extends Component {
    onUpdate(){
      const tr = playerNode.getComponent(Transform);
      const rect = {x:tr.position.x,y:tr.position.y,w:PLAYER_SIZE,h:PLAYER_SIZE};
      triggers.tick(rect, { time: performance.now() });
    }
  }
  playerNode.addComponent(new TriggerDriver());

  // Start
  renderer.attach(scene);
  playerNode.addComponent(new CameraFollow(renderer));
  game.start(scene);

  // HUD
  const hud = document.getElementById('hud');
  var last = performance.now(), frames=0, fps=0; var lastEvent = '';
  function meter(){
    var now = performance.now(); frames++; if(now-last>=1000){ fps=frames; frames=0; last=now; }
    var mapNameText = (map && map.name) ? map.name : 'n/a';
    var base = '!mpact2d • ' + BUILD + ' • Map: ' + mapNameText + ' • FPS: ' + fps + ' • Gems: ' + gemCountLocal;
    hud.textContent = lastEvent ? (base + ' • ' + lastEvent) : base;
    requestAnimationFrame(meter);
  }
  meter();
});
