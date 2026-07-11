import * as THREE from 'three';
import { BLOCK, BLOCKS } from './blocks.js';
import { tileUVRect } from '../render/atlas.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;

export function blockIndex(x, y, z) {
  return (((x << 4) | z) << 6) | y;
}

// Face table: corners are CCW seen from outside; tile 0=top, 1=bottom, 2=side.
// shade is baked into vertex colors for a cheap ambient-occlusion look.
const FACES = [
  { dir: [1, 0, 0],  corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.68, tile: 2 },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.68, tile: 2 },
  { dir: [0, 1, 0],  corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0,  tile: 0 },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5,  tile: 1 },
  { dir: [0, 0, 1],  corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.82, tile: 2 },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.82, tile: 2 },
];
const FACE_UV = [[0, 0], [1, 0], [1, 1], [0, 1]];

export class Chunk {
  constructor(cx, cz, data) {
    this.cx = cx;
    this.cz = cz;
    this.x0 = cx * CHUNK_SIZE;
    this.z0 = cz * CHUNK_SIZE;
    this.data = data;
    this.edited = false;
    this.solidMesh = null;
    this.waterMesh = null;
  }

  get(x, y, z) {
    return this.data[blockIndex(x, y, z)];
  }

  set(x, y, z, id) {
    this.data[blockIndex(x, y, z)] = id;
  }

  // Face-culled meshing: a face is emitted only when the neighboring cell
  // doesn't hide it. Neighbor lookups at chunk borders go through the world,
  // which falls back to deterministic terrain for chunks that aren't loaded,
  // so border faces come out right regardless of chunk load order.
  buildMeshes(world, solidMat, waterMat) {
    const solid = { pos: [], nor: [], uv: [], col: [], idx: [] };
    const water = { pos: [], nor: [], uv: [], col: [], idx: [] };
    const data = this.data;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const id = data[blockIndex(x, y, z)];
          if (id === BLOCK.AIR) continue;
          const isWater = id === BLOCK.WATER;
          const tiles = BLOCKS[id].tiles;

          for (let f = 0; f < 6; f++) {
            const face = FACES[f];
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            let nId;
            if (ny < 0) nId = BLOCK.STONE;
            else if (ny >= CHUNK_HEIGHT) nId = BLOCK.AIR;
            else if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
              nId = data[blockIndex(nx, ny, nz)];
            } else {
              nId = world.getBlock(this.x0 + nx, ny, this.z0 + nz);
            }

            const visible = isWater
              ? nId === BLOCK.AIR
              : nId === BLOCK.AIR || nId === BLOCK.WATER;
            if (!visible) continue;

            const out = isWater ? water : solid;
            const base = out.pos.length / 3;
            const [u0, v0, u1, v1] = tileUVRect(tiles[face.tile]);
            for (let i = 0; i < 4; i++) {
              const c = face.corners[i];
              out.pos.push(x + c[0], y + c[1], z + c[2]);
              out.nor.push(face.dir[0], face.dir[1], face.dir[2]);
              out.uv.push(u0 + (u1 - u0) * FACE_UV[i][0], v0 + (v1 - v0) * FACE_UV[i][1]);
              out.col.push(face.shade, face.shade, face.shade);
            }
            out.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
          }
        }
      }
    }

    this.solidMesh = makeMesh(solid, solidMat, this.x0, this.z0);
    this.waterMesh = makeMesh(water, waterMat, this.x0, this.z0);
  }

  disposeMeshes() {
    if (this.solidMesh) this.solidMesh.geometry.dispose();
    if (this.waterMesh) this.waterMesh.geometry.dispose();
    this.solidMesh = null;
    this.waterMesh = null;
  }
}

function makeMesh(arrs, material, x0, z0) {
  if (arrs.idx.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(arrs.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(arrs.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(arrs.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(arrs.col, 3));
  geo.setIndex(arrs.idx);
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x0, 0, z0);
  return mesh;
}
