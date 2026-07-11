import * as THREE from 'three';
import './style.css';
import { createAtlas } from './render/atlas.js';
import { Sky } from './render/sky.js';
import { Terrain } from './world/terrain.js';
import { World, RENDER_DISTANCE } from './world/world.js';
import { BLOCK } from './world/blocks.js';
import { Player, EYE_HEIGHT } from './player/player.js';
import { Input } from './player/input.js';
import { raycast } from './player/raycast.js';
import { HUD } from './ui/hud.js';

// --- Renderer / scene ---
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 24, RENDER_DISTANCE * 16 - 10);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.rotation.order = 'YXZ';

// --- World ---
const atlas = createAtlas();
const solidMat = new THREE.MeshLambertMaterial({ map: atlas.texture, vertexColors: true });
const waterMat = new THREE.MeshLambertMaterial({
  map: atlas.texture,
  vertexColors: true,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const terrain = new Terrain(20260703);
const world = new World(scene, terrain, solidMat, waterMat);
const player = new Player(world.findSpawn());
const sky = new Sky(scene);

// --- UI ---
const HOTBAR = [
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.WOOD,
  BLOCK.LEAVES, BLOCK.COAL_ORE, BLOCK.IRON_ORE, BLOCK.WATER,
];
const hud = new HUD(atlas.canvas, HOTBAR);

const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
  new THREE.LineBasicMaterial({ color: 0x111111 })
);
highlight.visible = false;
scene.add(highlight);

// --- Interaction ---
const lookDir = new THREE.Vector3();

function currentTarget() {
  camera.getWorldDirection(lookDir);
  return raycast(world, camera.position, lookDir, 5);
}

function breakBlock() {
  const t = currentTarget();
  if (t) world.setBlock(t.x, t.y, t.z, BLOCK.AIR);
}

function placeBlock() {
  const t = currentTarget();
  if (!t) return;
  const x = t.x + t.nx;
  const y = t.y + t.ny;
  const z = t.z + t.nz;
  const existing = world.getBlock(x, y, z);
  if (existing !== BLOCK.AIR && existing !== BLOCK.WATER) return;
  const id = hud.selectedBlock();
  if (id !== BLOCK.WATER && player.intersectsBlock(x, y, z)) return;
  world.setBlock(x, y, z, id);
}

const input = new Input(renderer.domElement, {
  selectSlot: (i) => hud.setSelected(i),
  scrollSlot: (d) => hud.setSelected((hud.selected + d + HOTBAR.length) % HOTBAR.length),
  toggleFly: () => { player.fly = !player.fly; },
  breakBlock,
  placeBlock,
  lockChange: (locked) => (locked ? hud.hideOverlay() : hud.showOverlay('Paused')),
});
hud.onStart(() => input.requestLock());

// Preload the spawn area so the first frame already shows terrain.
world.update(player.pos, 30);

// --- Main loop ---
const clock = new THREE.Clock();
let fps = 0, fpsFrames = 0, fpsTime = 0, debugTime = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (input.locked) player.update(dt, input, world);
  camera.position.set(player.pos.x, player.pos.y + EYE_HEIGHT, player.pos.z);
  camera.rotation.set(input.pitch, input.yaw, 0);

  world.update(player.pos);
  sky.update(dt, scene);

  const target = input.locked ? currentTarget() : null;
  highlight.visible = !!target;
  if (target) highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
  }
  debugTime += dt;
  if (debugTime >= 0.25) {
    debugTime = 0;
    const p = player.pos;
    hud.updateDebug(
      `${fps} FPS\n` +
      `XYZ ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}\n` +
      `chunk ${Math.floor(p.x / 16)},${Math.floor(p.z / 16)}  loaded ${world.chunks.size}` +
      (player.fly ? '\nFLY' : '')
    );
  }

  renderer.render(scene, camera);
}
frame();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handy for debugging from the browser console.
window.game = { world, player, input, hud, camera, terrain, sky };
