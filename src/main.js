import * as THREE from 'three';
import './style.css';
import { createAtlas } from './render/atlas.js';
import { Sky } from './render/sky.js';
import { Terrain } from './world/terrain.js';
import { World, RENDER_DISTANCE } from './world/world.js';
import { BLOCK } from './world/blocks.js';
import { ITEM, isBlock, isFood, foodValue, itemPurpose, meleeBonus } from './world/items.js';
import { createItemIcons } from './render/itemIcons.js';
import { DropManager } from './entities/drops.js';
import { Player, EYE_HEIGHT } from './player/player.js';
import { Input } from './player/input.js';
import { Inventory } from './player/inventory.js';
import { BlockBreaker } from './player/breaking.js';
import { raycast } from './player/raycast.js';
import { HUD } from './ui/hud.js';
import { Chat } from './ui/chat.js';
import { TouchControls } from './ui/touch.js';
import { SettingsMenu } from './ui/settingsMenu.js';
import { Settings } from './game/settings.js';
import { SaveManager, rleEncode, rleDecode } from './game/save.js';
import { MobManager } from './entities/mobs.js';
import { GAMEMODE } from './game/gamemode.js';
import { runCommand } from './game/commands.js';

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 24, RENDER_DISTANCE * 16 - 10);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.rotation.order = 'YXZ';

const atlas = createAtlas();
const itemIcons = createItemIcons();
const solidMat = new THREE.MeshLambertMaterial({ map: atlas.texture, vertexColors: true });
const waterMat = new THREE.MeshLambertMaterial({
  map: atlas.texture,
  vertexColors: true,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const settings = new Settings();
const terrain = new Terrain(20260703);
const world = new World(scene, terrain, solidMat, waterMat);

// Restore the saved world before any chunk loads: edited chunks dropped
// into world.saved are picked up by loadChunk exactly like chunks that
// were unloaded mid-session.
const save = new SaveManager();
const savedGame = save.load();
if (savedGame?.chunks) {
  for (const [k, rle] of Object.entries(savedGame.chunks)) {
    world.saved.set(k, rleDecode(rle));
  }
}

const player = new Player(world.findSpawn());
if (savedGame?.player) {
  const p = savedGame.player;
  player.pos.set(p.pos[0], p.pos[1], p.pos[2]);
  if (p.spawn) player.spawnPoint.set(p.spawn[0], p.spawn[1], p.spawn[2]);
  if (typeof p.health === 'number') player.health = p.health;
  if (typeof p.hunger === 'number') player.hunger = p.hunger;
}
const sky = new Sky(scene);
const inventory = new Inventory();
const hud = new HUD(atlas.canvas, itemIcons, inventory);
const chat = new Chat();
const mobs = new MobManager(scene, world);
const drops = new DropManager(scene, world, inventory, itemIcons, atlas.texture);
const breaker = new BlockBreaker(world, inventory, drops);

mobs.onMobDeath = (type, pos) => drops.mobDeath(type, pos);
mobs.onExplode = (pos) => {
  drops.explode(pos);
  const dist = pos.distanceTo(camera.position);
  if (dist < 6 && !isCreative()) player.damage(Math.max(2, Math.round(12 * (1 - dist / 6))));
};

let gameMode = GAMEMODE.SURVIVAL;

chat.mount(document.querySelector('.hud') ?? document.body);

const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
  new THREE.LineBasicMaterial({ color: 0x111111 })
);
highlight.visible = false;
scene.add(highlight);

const lookDir = new THREE.Vector3();

function currentTarget() {
  camera.getWorldDirection(lookDir);
  return raycast(world, camera.position, lookDir, 5);
}

function isCreative() {
  return gameMode === GAMEMODE.CREATIVE;
}

function setGamemode(mode) {
  gameMode = mode;
  const creative = mode === GAMEMODE.CREATIVE;
  inventory.setCreative(creative);
  player.creative = creative;
  player.fly = creative;
  breaker.instant = creative;
  hud.setCreative(creative);
  if (creative) {
    player.health = player.maxHealth;
    player.hunger = player.maxHunger;
    player.dead = false;
  }
  hud.refresh();
  hud.refreshSelectedName();
}

function placeBlock() {
  const id = hud.selectedBlock();
  if (!id || !isBlock(id)) return;
  const t = currentTarget();
  if (!t) return;
  const x = t.x + t.nx;
  const y = t.y + t.ny;
  const z = t.z + t.nz;
  const existing = world.getBlock(x, y, z);
  if (existing !== BLOCK.AIR && existing !== BLOCK.WATER) return;
  if (id !== BLOCK.WATER && player.intersectsBlock(x, y, z)) return;
  if (world.setBlock(x, y, z, id)) {
    inventory.removeFromSelected(1);
    hud.refresh();
    hud.refreshSelectedName();
  }
}

function useItem() {
  const id = inventory.selectedId();
  if (!id) return;
  if (isBlock(id)) {
    placeBlock();
    return;
  }
  const purpose = itemPurpose(id);
  if (purpose === 'food' && !isCreative()) {
    player.eat(foodValue(id));
    inventory.removeFromSelected(1);
    hud.refresh();
    hud.refreshSelectedName();
    return;
  }
  if (purpose === 'throw') {
    camera.getWorldDirection(lookDir);
    const from = camera.position.clone().add(lookDir.clone().multiplyScalar(0.4));
    if (id === ITEM.ENDER_PEARL) {
      drops.throwPearl(from, lookDir, player);
      inventory.removeFromSelected(1);
    } else if (id === ITEM.GUNPOWDER) {
      drops.throwBomb(from, lookDir);
      inventory.removeFromSelected(1);
    }
    hud.refresh();
    hud.refreshSelectedName();
  }
}

function setPaused(paused) {
  input.setPaused(paused);
  if (paused) {
    breaker.stop();
    hud.setBreakProgress(0);
  }
}

function uiBlocking() {
  return hud.inventoryOpen || chat.open || settingsMenu.open;
}

// Returns the damage dealt by a single melee hit, factoring in the held item
// (Bones and Sticks give a bonus on top of bare fists).
function meleeDamage() {
  if (isCreative()) return 999;
  const id = inventory.selectedId();
  return 5 + meleeBonus(id);
}

const input = new Input(renderer.domElement, {
  selectSlot: (i) => hud.setSelected(i),
  scrollSlot: (d) => hud.setSelected((inventory.selected + d + 9) % 9),
  toggleFly: () => { if (isCreative()) player.fly = !player.fly; },
  toggleInventory: () => {
    if (chat.open || settingsMenu.open) return;
    hud.toggleInventory();
  },
  toggleChat: () => {
    if (hud.inventoryOpen || settingsMenu.open) return;
    chat.toggle();
    setPaused(chat.open);
  },
  startBreak: () => {},
  stopBreak: () => breaker.stop(),
  useItem,
  lockChange: (locked) => {
    if (player.dead) return;
    if (locked && !uiBlocking()) hud.hideOverlay();
    else if (!locked && !uiBlocking()) hud.showOverlay('Paused');
  },
}, settings);

chat.onSubmit = (msg) => {
  const result = runCommand(msg, {
    sky,
    mobs,
    player,
    lookDir,
    setGamemode,
    inventory,
    hud,
    settings,
    resetWorld: () => {
      save.clear();
      location.reload();
    },
  });
  chat.logMessage(result);
};

chat.onToggle = (open) => {
  setPaused(open);
  if (!open) requestAnimationFrame(() => input.requestLock());
};

const touch = new TouchControls(document.querySelector('.hud'), input, {
  useItem,
  stopBreak: () => breaker.stop(),
  toggleInventory: () => {
    if (!chat.open) hud.toggleInventory();
  },
  toggleChat: () => {
    // focusNow: focusing inside the touch gesture is what makes iOS
    // bring up the on-screen keyboard.
    if (!hud.inventoryOpen) chat.toggle(true);
  },
  pause: () => input.releaseLock(),
}, settings);

const settingsMenu = new SettingsMenu(document.querySelector('.hud'), settings);
hud.onSettingsOpen = () => settingsMenu.openMenu();
settings.onChange((field) => {
  if (field === 'touchMode') touch.setMode(settings.touchMode);
});

hud.onResume = () => input.requestLock();
hud.onStart(() => {
  if (player.dead) player.respawn();
  // In fallback pointer-lock mode `locked` never toggles, so no lockChange
  // event will fire to hide the overlay — do it explicitly.
  if (input.locked) hud.hideOverlay();
  else input.requestLock();
});
hud.onInventoryToggle = (open) => setPaused(open);

// Apply the rest of the saved game now that HUD/inventory/sky exist.
if (savedGame) {
  if (savedGame.mode === GAMEMODE.CREATIVE) setGamemode(GAMEMODE.CREATIVE);
  else if (savedGame.inventory?.slots) {
    savedGame.inventory.slots.forEach((s, i) => {
      if (s && i < inventory.slots.length) inventory.slots[i] = { id: s.id, count: s.count };
    });
  }
  if (Number.isInteger(savedGame.inventory?.selected)) {
    inventory.selected = Math.max(0, Math.min(8, savedGame.inventory.selected));
  }
  if (typeof savedGame.time === 'number') sky.time = savedGame.time;
  if (savedGame.look) {
    input.yaw = savedGame.look[0];
    input.pitch = savedGame.look[1];
  }
  hud.refresh();
  hud.refreshSelectedName();
}

save.start(() => {
  const chunks = {};
  for (const [k, data] of world.saved) chunks[k] = rleEncode(data);
  for (const [k, chunk] of world.chunks) {
    if (chunk.edited) chunks[k] = rleEncode(chunk.data);
  }
  return {
    chunks,
    player: {
      pos: [player.pos.x, player.pos.y, player.pos.z],
      spawn: [player.spawnPoint.x, player.spawnPoint.y, player.spawnPoint.z],
      health: player.health,
      hunger: player.hunger,
    },
    mode: gameMode,
    inventory: {
      selected: inventory.selected,
      // Creative slots are infinite and refilled by setGamemode on load.
      slots: isCreative()
        ? null
        : inventory.slots.map((s) => (s && !s.infinite ? { id: s.id, count: s.count } : null)),
    },
    time: sky.time,
    look: [input.yaw, input.pitch],
  };
});

world.update(player.pos, 30);

const clock = new THREE.Clock();
let fps = 0, fpsFrames = 0, fpsTime = 0, debugTime = 0;
let attackCd = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1);
  const playing = input.locked && !uiBlocking() && !player.dead;

  if (playing) {
    player.update(dt, input, world);
    if (attackCd > 0) attackCd -= dt;

    if (input.breaking) {
      camera.getWorldDirection(lookDir);
      const mob = mobs.raycastMob(camera.position, lookDir, 4.5);
      if (mob) {
        breaker.stop();
        hud.setBreakProgress(0);
        if (attackCd <= 0) {
          const killed = mobs.damageMob(mob, meleeDamage(), player.pos);
          if (killed) hud.refresh();
          attackCd = isCreative() ? 0.15 : 0.45;
        }
      } else if (isCreative()) {
        const t = currentTarget();
        if (t) world.setBlock(t.x, t.y, t.z, BLOCK.AIR);
        hud.setBreakProgress(0);
      } else {
        const t = currentTarget();
        if (t) breaker.start(t);
        const result = breaker.update(dt, t);
        hud.setBreakProgress(breaker.getProgress());
        if (result === 'broken') hud.refresh();
      }
    } else {
      hud.setBreakProgress(0);
    }
    mobs.update(dt, player, sky, camera.position, lookDir, false, isCreative());
  } else if (!uiBlocking()) {
    mobs.update(dt, player, sky, camera.position, lookDir, true, isCreative());
  }

  if (player.dead && !isCreative()) {
    hud.showOverlay('You died — click to respawn');
    breaker.stop();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  camera.position.set(player.pos.x, player.pos.y + EYE_HEIGHT, player.pos.z);
  camera.rotation.set(input.pitch, input.yaw, 0);

  world.update(player.pos);
  sky.update(dt, scene);
  drops.update(dt, player.pos, () => hud.refresh());

  const target = playing ? currentTarget() : null;
  highlight.visible = !!target;
  if (target) highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);

  hud.tick(dt);

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
    if (!isCreative()) {
      hud.updateHearts(player.health, player.maxHealth, player.hurtFlash);
      hud.updateHunger(player.hunger, player.maxHunger);
    }
    hud.updateDebug(
      `${fps} FPS  ${gameMode}\n` +
      (isCreative() ? '' : `HP ${player.health}/${player.maxHealth}  Food ${player.hunger}/${player.maxHunger}\n`) +
      `XYZ ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}\n` +
      `${sky.isDay() ? 'Day' : sky.isNight() ? 'Night' : 'Dusk'}  mobs ${mobs.mobs.length}`
    );
  }

  if (player.hurtFlash > 0 && !isCreative()) {
    renderer.domElement.style.filter = 'sepia(0.4) saturate(2) hue-rotate(-30deg)';
  } else {
    renderer.domElement.style.filter = '';
  }

  renderer.render(scene, camera);
}
frame();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.game = { world, player, input, hud, inventory, mobs, camera, terrain, sky, chat, drops, breaker, touch, settings, settingsMenu, save, setGamemode };
