import { CHUNK_SIZE, CHUNK_HEIGHT } from '../world/chunk.js';

const WORLDS_KEY = 'voxelcraft.worlds';
const OLD_KEY = 'voxelcraft.world';
const CHUNK_BYTES = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE;
const AUTOSAVE_MS = 5000;

export function rleEncode(data) {
  const out = [];
  let id = data[0];
  let run = 1;
  for (let i = 1; i < CHUNK_BYTES; i++) {
    if (data[i] === id) run++;
    else {
      out.push(id, run);
      id = data[i];
      run = 1;
    }
  }
  out.push(id, run);
  return out;
}

export function rleDecode(rle) {
  const data = new Uint8Array(CHUNK_BYTES);
  let i = 0;
  for (let j = 0; j < rle.length; j += 2) {
    data.fill(rle[j], i, i + rle[j + 1]);
    i += rle[j + 1];
  }
  return data;
}

function migrateOldSave() {
  try {
    const old = localStorage.getItem(OLD_KEY);
    if (!old) return;
    const worlds = JSON.parse(localStorage.getItem(WORLDS_KEY) || '[]');
    if (!worlds.find((w) => w.name === 'World')) {
      worlds.push({ name: 'World', seed: 20260703, mode: 'survival', lastPlayed: Date.now() });
      localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
    }
    localStorage.setItem('voxelcraft.world.World', old);
    localStorage.removeItem(OLD_KEY);
  } catch {}
}

migrateOldSave();

export class SaveManager {
  constructor(worldName) {
    this.worldName = worldName || 'World';
    this.storageKey = 'voxelcraft.world.' + this.worldName;
    this.collect = null;
    this.timer = 0;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  start(collect) {
    this.collect = collect;
    this.timer = setInterval(() => this.save(), AUTOSAVE_MS);
    window.addEventListener('pagehide', () => this.save());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.save();
    });
  }

  save() {
    if (!this.collect) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.collect()));
    } catch {}
  }

  clear() {
    this.collect = null;
    clearInterval(this.timer);
    try {
      localStorage.removeItem(this.storageKey);
    } catch {}
  }

  static getWorlds() {
    try {
      return JSON.parse(localStorage.getItem(WORLDS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  static saveWorldMeta(world) {
    const worlds = SaveManager.getWorlds();
    const idx = worlds.findIndex((w) => w.name === world.name);
    if (idx >= 0) worlds[idx] = world;
    else worlds.push(world);
    try {
      localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
    } catch {}
  }

  static deleteWorld(name) {
    const worlds = SaveManager.getWorlds().filter((w) => w.name !== name);
    try {
      localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
      localStorage.removeItem('voxelcraft.world.' + name);
    } catch {}
  }
}
