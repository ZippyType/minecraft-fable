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

  riverAt(x, z) {
    const n = this.noise.noise2(x * 0.002, z * 0.002);
    return Math.abs(n) < 0.02;
  }

  biomeAt(x, z) {
    const n = this.noise.noise2(x * 0.003, z * 0.003);
    if (n > 0.35) return 'desert';
    if (n < -0.35) return 'snow';
    const forest = this.noise.noise2(x * 0.008 + 100, z * 0.008 + 100);
    if (forest > 0.2) return 'forest';
    return 'plains';
  }

  heightAt(x, z) {
    const biome = this.biomeAt(x, z);
    const continents = this.fbm2(x * 0.004, z * 0.004, 4);
    const hills = this.fbm2(x * 0.02 + 537.3, z * 0.02 + 941.7, 3);
    let hillAmp = 6;
    if (biome === 'desert') hillAmp = 2;
    else if (biome === 'snow') hillAmp = 8;
    else if (biome === 'forest') hillAmp = 9;
    const y = 31 + continents * 20 + hills * hillAmp;
    const adjusted = this.riverAt(x, z) ? Math.min(y, SEA_LEVEL - 1) : y;
    return Math.max(2, Math.min(CHUNK_HEIGHT - 6, Math.round(adjusted)));
  }

  // Terrain without trees (trees are overlaid per-chunk in genChunkData).
  baseBlockAt(x, y, z, h = this.heightAt(x, z)) {
    if (this.riverAt(x, z)) {
      if (y > h && y <= SEA_LEVEL) return BLOCK.WATER;
      if (y === h) return BLOCK.GRAVEL;
      if (y > h - 3) return this.hash2(x, z) < 0.5 ? BLOCK.GRAVEL : BLOCK.SAND;
    }
    if (y > h) return y <= SEA_LEVEL ? BLOCK.WATER : BLOCK.AIR;
    if (y === 0) return BLOCK.BEDROCK;
    if (y === 1) return this.hash2(x, z) < 0.5 ? BLOCK.BEDROCK : BLOCK.STONE;

    const caveNoise = this.noiseOre.noise3(x * 0.03, y * 0.05, z * 0.03);
    const caveNoise2 = this.noiseOre.noise3(x * 0.06 + 500, y * 0.08 + 500, z * 0.06 + 500);
    if (y > 1 && y < h - 1 && Math.abs(caveNoise) < 0.04 && Math.abs(caveNoise2) < 0.06) {
      return BLOCK.AIR;
    }
    const roomNoise = this.noise.noise3(x * 0.01, y * 0.015, z * 0.01);
    if (y > 2 && y < h - 2 && roomNoise > 0.7) {
      return BLOCK.AIR;
    }

    const biome = this.biomeAt(x, z);
    const beach = h <= SEA_LEVEL + 1;
    if (y === h) {
      if (beach) return BLOCK.SAND;
      if (biome === 'desert') return BLOCK.SAND;
      if (biome === 'snow') return BLOCK.SNOW;
      return BLOCK.GRASS;
    }
    if (y > h - 4) {
      if (beach || biome === 'desert') return BLOCK.SAND;
      if (biome === 'snow') return BLOCK.SNOW;
      return BLOCK.DIRT;
    }
    const n = this.noiseOre.noise3(x * 0.16, y * 0.16, z * 0.16);
    if (n > 0.52) return BLOCK.COAL_ORE;
    if (y < 24 && n < -0.55) return BLOCK.IRON_ORE;
    if (y < 20 && n > 0.58) return BLOCK.GOLD_ORE;
    if (y < 12 && n < -0.60) return BLOCK.DIAMOND_ORE;
    const gn = this.noiseOre.noise3(x * 0.1 + 500, y * 0.1 + 500, z * 0.1 + 500);
    if (y <= SEA_LEVEL + 2 && Math.abs(y - SEA_LEVEL) <= 2 && gn > 0.45) return BLOCK.GRAVEL;
    return BLOCK.STONE;
  }

  dungeonAt(x, z) {
    const dx = Math.floor(x / 16);
    const dz = Math.floor(z / 16);
    const h = this.hash2(dx * 7 + 1234, dz * 13 + 5678);
    if (h > 0.03) return null;

    const lx = x - dx * 16;
    const lz = z - dz * 16;

    const cx = 8, cz = 8;
    const dist = Math.max(Math.abs(lx - cx), Math.abs(lz - cz));

    if (dist <= 3) return 'room';
    if (dist === 4) return 'wall';
    return null;
  }

  getDungeonSpawner(cx, cz) {
    const h = this.hash2(cx * 7 + 1234, cz * 13 + 5678);
    if (h > 0.03) return null;
    return { x: cx * 16 + 8, y: 11, z: cz * 16 + 8 };
  }

  treeAt(x, z) {
    const biome = this.biomeAt(x, z);
    let threshold = 0.007;
    if (biome === 'desert') return false;
    if (biome === 'forest') threshold = 0.015;
    else if (biome === 'snow') threshold = 0.004;
    if (this.hash2(x, z) > threshold) return false;
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

    const dcx = Math.floor(x0 / 16);
    const dcz = Math.floor(z0 / 16);
    const dh = this.hash2(dcx * 7 + 1234, dcz * 13 + 5678);
    if (dh <= 0.03) {
      const centerH = this.heightAt(x0 + 8, z0 + 8);
      if (centerH >= 16) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const lx = x - 8;
            const lz = z - 8;
            const dist = Math.max(Math.abs(lx), Math.abs(lz));
            if (dist <= 3) {
              for (let y = 10; y <= 13; y++) data[blockIndex(x, y, z)] = BLOCK.AIR;
              data[blockIndex(x, 9, z)] = BLOCK.STONE;
              data[blockIndex(x, 14, z)] = BLOCK.STONE;
            } else if (dist === 4) {
              for (let y = 10; y <= 13; y++) data[blockIndex(x, y, z)] = BLOCK.STONE;
              data[blockIndex(x, 9, z)] = BLOCK.STONE;
              data[blockIndex(x, 14, z)] = BLOCK.STONE;
            }
          }
        }
        data[blockIndex(8, 11, 8)] = BLOCK.FURNACE;
      }
    }

    return data;
  }
}
