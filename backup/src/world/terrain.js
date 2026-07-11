import { Perlin } from './noise.js';
import { BLOCK } from './blocks.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, blockIndex } from './chunk.js';

export const SEA_LEVEL = 28;

// Deterministic terrain: any block can be computed from (x, y, z) alone,
// which lets the world answer queries for chunks that were never generated.
export class Terrain {
  constructor(seed = 1337) {
    this.seed = seed | 0;
    this.noise = new Perlin(seed);
    this.noiseOre = new Perlin(seed ^ 0x9e3779b9);
  }

  fbm2(x, y, octaves) {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.noise.noise2(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  }

  hash2(x, z) {
    let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + this.seed) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  heightAt(x, z) {
    const continents = this.fbm2(x * 0.004, z * 0.004, 4);
    const hills = this.fbm2(x * 0.02 + 537.3, z * 0.02 + 941.7, 3);
    const y = 31 + continents * 20 + hills * 6;
    return Math.max(2, Math.min(CHUNK_HEIGHT - 6, Math.round(y)));
  }

  // Terrain without trees (trees are overlaid per-chunk in genChunkData).
  baseBlockAt(x, y, z, h = this.heightAt(x, z)) {
    if (y > h) return y <= SEA_LEVEL ? BLOCK.WATER : BLOCK.AIR;
    if (y === 0) return BLOCK.STONE;
    const beach = h <= SEA_LEVEL + 1;
    if (y === h) return beach ? BLOCK.SAND : BLOCK.GRASS;
    if (y > h - 4) return beach ? BLOCK.SAND : BLOCK.DIRT;
    const n = this.noiseOre.noise3(x * 0.16, y * 0.16, z * 0.16);
    if (n > 0.52) return BLOCK.COAL_ORE;
    if (y < 24 && n < -0.55) return BLOCK.IRON_ORE;
    return BLOCK.STONE;
  }

  treeAt(x, z) {
    if (this.hash2(x, z) > 0.007) return false;
    const h = this.heightAt(x, z);
    return h > SEA_LEVEL + 1 && h < CHUNK_HEIGHT - 10;
  }

  forEachTreeBlock(x, z, cb) {
    const h = this.heightAt(x, z);
    const trunkH = 4 + Math.floor(this.hash2(x + 131, z + 77) * 3);
    const top = h + trunkH;
    for (let ly = top - 2; ly <= top + 1; ly++) {
      const r = ly >= top ? 1 : 2;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx === 0 && dz === 0 && ly < top) continue; // trunk goes here
          const corner = Math.abs(dx) === r && Math.abs(dz) === r;
          if (corner && (ly === top + 1 || this.hash2(x * 3 + dx + ly * 7, z * 3 + dz - ly * 5) < 0.4)) continue;
          cb(x + dx, ly, z + dz, BLOCK.LEAVES);
        }
      }
    }
    for (let ly = h + 1; ly < top; ly++) cb(x, ly, z, BLOCK.WOOD);
  }

  genChunkData(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const x0 = cx * CHUNK_SIZE;
    const z0 = cz * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const h = this.heightAt(x0 + x, z0 + z);
        const cap = Math.max(h, SEA_LEVEL);
        for (let y = 0; y <= cap; y++) {
          data[blockIndex(x, y, z)] = this.baseBlockAt(x0 + x, y, z0 + z, h);
        }
      }
    }

    // Overlay trees, including ones whose trunk stands up to 2 blocks outside
    // this chunk, so canopies cross chunk borders seamlessly.
    for (let tx = x0 - 2; tx < x0 + CHUNK_SIZE + 2; tx++) {
      for (let tz = z0 - 2; tz < z0 + CHUNK_SIZE + 2; tz++) {
        if (!this.treeAt(tx, tz)) continue;
        this.forEachTreeBlock(tx, tz, (bx, by, bz, id) => {
          const lx = bx - x0;
          const lz = bz - z0;
          if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return;
          if (by < 1 || by >= CHUNK_HEIGHT) return;
          const i = blockIndex(lx, by, lz);
          if (id === BLOCK.WOOD || data[i] === BLOCK.AIR) data[i] = id;
        });
      }
    }

    return data;
  }
}
