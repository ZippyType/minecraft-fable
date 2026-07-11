import * as THREE from 'three';
import { BLOCK } from './blocks.js';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT, blockIndex } from './chunk.js';
import { SEA_LEVEL } from './terrain.js';

export const RENDER_DISTANCE = 7; // chunks
const UNLOAD_DISTANCE = RENDER_DISTANCE + 2;

export class World {
  constructor(scene, terrain, solidMat, waterMat) {
    this.scene = scene;
    this.terrain = terrain;
    this.solidMat = solidMat;
    this.waterMat = waterMat;
    this.chunks = new Map(); // loaded chunks (with meshes)
    this.saved = new Map(); // data of edited chunks that were unloaded
    this.queue = [];
    this.lastCx = null;
    this.lastCz = null;
  }

  key(cx, cz) {
    return cx + ',' + cz;
  }

  getBlock(x, y, z) {
    if (y < 0) return BLOCK.STONE;
    if (y >= CHUNK_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const k = this.key(cx, cz);
    const chunk = this.chunks.get(k);
    if (chunk) return chunk.get(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE);
    const saved = this.saved.get(k);
    if (saved) return saved[blockIndex(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE)];
    return this.terrain.baseBlockAt(x, y, z);
  }

  setBlock(x, y, z, id) {
    if (y <= 0 || y >= CHUNK_HEIGHT) return false; // y=0 is unbreakable floor
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.key(cx, cz));
    if (!chunk) return false;
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    chunk.set(lx, y, lz, id);
    chunk.edited = true;
    this.remesh(chunk);
    // Edits on a chunk border change face visibility in the adjacent chunk.
    if (lx === 0) this.remeshAt(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.remeshAt(cx + 1, cz);
    if (lz === 0) this.remeshAt(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.remeshAt(cx, cz + 1);
    return true;
  }

  update(playerPos, budget = 3) {
    const pcx = Math.floor(playerPos.x / CHUNK_SIZE);
    const pcz = Math.floor(playerPos.z / CHUNK_SIZE);
    if (pcx !== this.lastCx || pcz !== this.lastCz) {
      this.lastCx = pcx;
      this.lastCz = pcz;
      this.rebuildQueue(pcx, pcz);
      this.unloadFar(pcx, pcz);
    }
    for (let n = 0; n < budget && this.queue.length > 0; ) {
      const { cx, cz } = this.queue.shift();
      if (this.chunks.has(this.key(cx, cz))) continue;
      this.loadChunk(cx, cz);
      n++;
    }
  }

  rebuildQueue(pcx, pcz) {
    this.queue.length = 0;
    const R = RENDER_DISTANCE;
    for (let dx = -R; dx <= R; dx++) {
      for (let dz = -R; dz <= R; dz++) {
        const d = dx * dx + dz * dz;
        if (d > R * R + 1) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (!this.chunks.has(this.key(cx, cz))) this.queue.push({ cx, cz, d });
      }
    }
    this.queue.sort((a, b) => a.d - b.d);
  }

  loadChunk(cx, cz) {
    const k = this.key(cx, cz);
    const savedData = this.saved.get(k);
    const chunk = new Chunk(cx, cz, savedData ?? this.terrain.genChunkData(cx, cz));
    if (savedData) {
      this.saved.delete(k);
      chunk.edited = true;
    }
    this.chunks.set(k, chunk);
    this.remesh(chunk);
    // Neighbors were meshed against pristine terrain; if this chunk carries
    // edits, their border faces may be stale.
    if (savedData) {
      this.remeshAt(cx - 1, cz);
      this.remeshAt(cx + 1, cz);
      this.remeshAt(cx, cz - 1);
      this.remeshAt(cx, cz + 1);
    }
  }

  unloadFar(pcx, pcz) {
    for (const [k, chunk] of this.chunks) {
      const dx = chunk.cx - pcx;
      const dz = chunk.cz - pcz;
      if (dx * dx + dz * dz <= UNLOAD_DISTANCE * UNLOAD_DISTANCE) continue;
      this.removeMeshes(chunk);
      chunk.disposeMeshes();
      if (chunk.edited) this.saved.set(k, chunk.data);
      this.chunks.delete(k);
    }
  }

  remesh(chunk) {
    this.removeMeshes(chunk);
    chunk.disposeMeshes();
    chunk.buildMeshes(this, this.solidMat, this.waterMat);
    if (chunk.solidMesh) this.scene.add(chunk.solidMesh);
    if (chunk.waterMesh) this.scene.add(chunk.waterMesh);
  }

  remeshAt(cx, cz) {
    const chunk = this.chunks.get(this.key(cx, cz));
    if (chunk) this.remesh(chunk);
  }

  removeMeshes(chunk) {
    if (chunk.solidMesh) this.scene.remove(chunk.solidMesh);
    if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);
  }

  findSpawn() {
    for (let i = 0; i < 2000; i++) {
      const x = (i % 45) * 3 - 66;
      const z = Math.floor(i / 45) * 3 - 66;
      const h = this.terrain.heightAt(x, z);
      if (h >= SEA_LEVEL + 2 && !this.terrain.treeAt(x, z)) {
        return new THREE.Vector3(x + 0.5, h + 2, z + 0.5);
      }
    }
    return new THREE.Vector3(0.5, CHUNK_HEIGHT - 8, 0.5);
  }
}
