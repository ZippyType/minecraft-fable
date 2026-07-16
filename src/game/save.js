import { CHUNK_SIZE, CHUNK_HEIGHT } from '../world/chunk.js';

const STORAGE_KEY = 'voxelcraft.world';
const CHUNK_BYTES = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE;
const AUTOSAVE_MS = 5000;

// Chunks are mostly long runs of the same block, so run-length encoding
// ([id, count, id, count, …]) shrinks the 16 KB block array enough to keep
// many edited chunks inside the localStorage quota.
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

// Persists the world to localStorage: edited chunks (RLE), player state,
// inventory, game mode, and time of day. Autosaves every few seconds and
// when the tab is hidden/closed.
export class SaveManager {
  constructor() {
    this.collect = null;
    this.timer = 0;
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collect()));
    } catch {
      // Quota exceeded or storage unavailable — the game keeps running,
      // the world just won't persist.
    }
  }

  // Wipe the save and stop autosaving (used by /reset before a reload).
  clear() {
    this.collect = null;
    clearInterval(this.timer);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}
