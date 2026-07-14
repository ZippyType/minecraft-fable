import * as THREE from 'three';
import { ITEM } from '../world/items.js';
import { MOB } from './mobTypes.js';
import { BLOCK, BLOCKS, isSolid } from '../world/blocks.js';
import { isBlock } from '../world/items.js';
import { tileUVRect } from '../render/atlas.js';

// Primary drops always roll at least 1 so players reliably get loot.
const MOB_DROPS = {
  [MOB.ZOMBIE]: [{ id: ITEM.ROTTEN_FLESH, min: 1, max: 2 }],
  [MOB.CREEPER]: [{ id: ITEM.GUNPOWDER, min: 1, max: 2 }],
  [MOB.SKELETON]: [{ id: ITEM.BONE, min: 1, max: 2 }],
  [MOB.ENDERMAN]: [{ id: ITEM.ENDER_PEARL, min: 1, max: 1 }],
  [MOB.COW]: [{ id: ITEM.RAW_STEAK, min: 1, max: 3 }],
  [MOB.CHICKEN]: [{ id: ITEM.RAW_CHICKEN, min: 1, max: 2 }],
  [MOB.SHEEP]: [{ id: ITEM.RAW_LAMB, min: 1, max: 2 }],
};

const BURST_COLORS = {
  [MOB.ZOMBIE]: 0x4a7a3a,
  [MOB.CREEPER]: 0x4a9a3a,
  [MOB.SKELETON]: 0xd8d8c8,
  [MOB.ENDERMAN]: 0x2a1838,
  [MOB.COW]: 0x6b4226,
  [MOB.CHICKEN]: 0xf0e050,
  [MOB.SHEEP]: 0xe8e8e8,
};

function rollDrops(type) {
  const table = MOB_DROPS[type];
  if (!table) return [];
  const out = [];
  for (const e of table) {
    const count = e.min + Math.floor(Math.random() * (e.max - e.min + 1));
    if (count > 0) out.push({ id: e.id, count });
  }
  return out;
}

export class DropManager {
  constructor(scene, world, inventory, itemCanvas, atlasTexture) {
    this.scene = scene;
    this.world = world;
    this.inventory = inventory;
    this.itemCanvas = itemCanvas;
    this.atlasTexture = atlasTexture;
    this.particles = [];
    this.drops = [];
    this.pearls = [];
    this.bombs = [];
    this.playerArrows = [];
    this.particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.arrowGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
    this.arrowMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    this.blockMat = new THREE.MeshLambertMaterial({ map: atlasTexture });
    this.blockGeoCache = new Map();
  }

  // Build (and cache) a small textured cube whose faces use the same atlas
  // tiles as the real block, so a dropped stone block actually looks like
  // a tiny stone block.
  getBlockGeo(blockId) {
    if (this.blockGeoCache.has(blockId)) return this.blockGeoCache.get(blockId);
    const def = BLOCKS[blockId];
    if (!def) return null;
    const size = 0.42;
    const geo = new THREE.BoxGeometry(size, size, size);
    const uv = geo.attributes.uv;
    // BoxGeometry face order: 0=+x, 1=-x, 2=+y, 3=-y, 4=+z, 5=-z
    // tiles layout is [top, bottom, side] — apply side to all four sides.
    const faceTiles = [
      def.tiles[2], def.tiles[2], def.tiles[0], def.tiles[1], def.tiles[2], def.tiles[2],
    ];
    for (let f = 0; f < 6; f++) {
      const [u0, v0, u1, v1] = tileUVRect(faceTiles[f]);
      const base = f * 4;
      // BoxGeometry default per-face UVs are (0,1),(1,1),(0,0),(1,0) — remap
      // each corner to the matching tile rect so the right texture shows up.
      uv.setXY(base + 0, u0, v1);
      uv.setXY(base + 1, u1, v1);
      uv.setXY(base + 2, u0, v0);
      uv.setXY(base + 3, u1, v0);
    }
    uv.needsUpdate = true;
    this.blockGeoCache.set(blockId, geo);
    return geo;
  }

  spawnBlockParticles(x, y, z, blockId) {
    const colors = {
      1: [0x5a9a3a, 0x8b6914],
      2: [0x8b6914],
      3: [0x808080],
      4: [0xd4c89a],
      5: [0x3a6ab0],
      6: [0x6b4226],
      7: [0x3a7a2a],
      8: [0x505050, 0x888888],
      9: [0xc8a070, 0x808080],
      11: [0xe8c840, 0x808080],
      12: [0x40d8e8, 0x808080],
      13: [0x404040],
      14: [0x8a8070],
      15: [0xf0f0ff],
      16: [0x30a030],
      17: [0xcc3030, 0xf0e040],
      18: [0xb8944a],
      19: [0xc8e0f0],
      20: [0xb04030],
      21: [0x8a6220, 0xb09060],
      22: [0x707070],
    };
    const cols = colors[blockId] ?? [0x808080];
    const center = new THREE.Vector3(x, y, z);
    for (let i = 0; i < 10; i++) {
      const color = cols[Math.floor(Math.random() * cols.length)];
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.copy(center);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 4
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.3 + Math.random() * 0.3 });
    }
  }

  mobDeath(type, pos) {
    const color = BURST_COLORS[type] ?? 0xffffff;
    const center = pos.clone().add(new THREE.Vector3(0, 0.8, 0));
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.copy(center);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.5 + Math.random() * 0.4 });
    }
    for (const { id, count } of rollDrops(type)) {
      this.spawnDrop(center, id, count);
    }
  }

  spawnDrop(pos, itemId, count) {
    const isBlk = isBlock(itemId) && BLOCKS[itemId];
    let mesh;
    if (isBlk) {
      // Mini 3D block model with the proper texture on every face.
      mesh = new THREE.Mesh(this.getBlockGeo(itemId), this.blockMat);
    } else {
      // Fallback for non-block items (mob loot): a small white cube.
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.28, 0.28),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
    }
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 0.6;
    mesh.position.z += (Math.random() - 0.5) * 0.6;
    this.scene.add(mesh);
    this.drops.push({
      itemId,
      count,
      mesh,
      // Use a separate base position so the visual bob doesn't drift the
      // physics position over time (this was the "drops sometimes get stuck"
      // symptom: the bob accumulated into the y position).
      pos: mesh.position.clone(),
      vel: new THREE.Vector3((Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2),
      bob: Math.random() * Math.PI * 2,
      spin: 1.5 + Math.random() * 1.5,
      grounded: false,
      isBlock: isBlk,
    });
  }

  // Spawn a 3D mini block at the given block-cell corner (integer coords).
  spawnBlockDrop(blockX, blockY, blockZ, blockId, count = 1) {
    if (!BLOCKS[blockId]) return;
    const mesh = new THREE.Mesh(this.getBlockGeo(blockId), this.blockMat);
    mesh.position.set(blockX + 0.5, blockY + 0.35, blockZ + 0.5);
    this.scene.add(mesh);
    this.drops.push({
      itemId: blockId,
      count,
      mesh,
      pos: mesh.position.clone(),
      vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 2.4, (Math.random() - 0.5) * 1.5),
      bob: Math.random() * Math.PI * 2,
      spin: 1.8 + Math.random() * 1.6,
      grounded: false,
      isBlock: true,
    });
  }

  throwPearl(from, dir, player) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x3ad4c0, emissive: 0x1a6058 })
    );
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.pearls.push({
      mesh,
      pos: from.clone(),
      vel: dir.clone().multiplyScalar(18),
      life: 3,
      player,
    });
  }

  throwBomb(from, dir) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a, emissive: 0x661111 })
    );
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.bombs.push({
      mesh,
      pos: from.clone(),
      vel: dir.clone().multiplyScalar(14).add(new THREE.Vector3(0, 1.5, 0)),
      life: 2.5,
    });
  }

  shootPlayerArrow(from, dir, mobs) {
    const mesh = new THREE.Mesh(this.arrowGeo, this.arrowMat);
    mesh.position.copy(from);
    mesh.lookAt(from.x + dir.x, from.y + dir.y, from.z + dir.z);
    this.scene.add(mesh);
    this.playerArrows.push({
      pos: from.clone(),
      vel: dir.clone().multiplyScalar(22),
      mesh,
      life: 3,
      mobs,
    });
  }

  explode(pos) {
    const r = 2;
    const cx = Math.floor(pos.x);
    const cy = Math.floor(pos.y);
    const cz = Math.floor(pos.z);
    const removed = [];
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx * dx + dy * dy + dz * dz > r * r + 0.5) continue;
          const x = cx + dx, y = cy + dy, z = cz + dz;
          if (y <= 0) continue;
          const id = this.world.getBlock(x, y, z);
          if (id === BLOCK.AIR || id === BLOCK.WATER) continue;
          removed.push({ x, y, z, id });
          this.world.setBlock(x, y, z, BLOCK.AIR);
        }
      }
    }
    // Scatter a few of the destroyed blocks as pickups so the explosion
    // doesn't simply delete everything.
    for (const cell of removed) {
      if (Math.random() < 0.35) {
        this.spawnBlockDrop(cell.x, cell.y, cell.z, cell.id, 1);
      }
    }
    // Burst of orange/red sparks.
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0xff6622 : 0xffaa33,
      });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 7 + 1,
        (Math.random() - 0.5) * 10
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.6 + Math.random() * 0.4 });
    }
  }

  update(dt, playerPos, onPickup) {
    for (const p of [...this.particles]) {
      p.life -= dt;
      p.vel.y -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.multiplyScalar(0.96);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles = this.particles.filter((x) => x !== p);
      }
    }

    for (const d of [...this.drops]) {
      if (!d.grounded) {
        d.vel.y -= 20 * dt;
        d.pos.addScaledVector(d.vel, dt);
        const bx = Math.floor(d.pos.x);
        const by = Math.floor(d.pos.y - 0.25);
        const bz = Math.floor(d.pos.z);
        if (isSolid(this.world.getBlock(bx, by, bz))) {
          d.pos.y = by + 1 + (d.isBlock ? 0.21 : 0.14);
          d.vel.set(0, 0, 0);
          d.grounded = true;
        }
      }
      d.bob += dt * 3.5;
      // Apply physics position, then layer the bob on top of the *visual*
      // position only — the base position stays clean.
      d.mesh.position.copy(d.pos);
      d.mesh.position.y += Math.sin(d.bob) * 0.08;
      // Spin on both Y and a slight X tilt so 3D mini-blocks really look
      // like floating, rotating models rather than flat sprites.
      d.mesh.rotation.y += dt * d.spin;
      d.mesh.rotation.x = Math.sin(d.bob * 0.7) * 0.15;

      // Pick up within ~1 block (center-to-center), as requested.
      const dx = d.pos.x - playerPos.x;
      const dz = d.pos.z - playerPos.z;
      const dy = d.pos.y - (playerPos.y + 0.9);
      if (dx * dx + dy * dy + dz * dz < 1.6) {
        const added = this.inventory.addItem(d.itemId, d.count);
        if (added > 0) {
          this.scene.remove(d.mesh);
          this.drops = this.drops.filter((x) => x !== d);
          onPickup?.();
        }
      }
    }

    for (const pearl of [...this.pearls]) {
      pearl.life -= dt;
      pearl.vel.y -= 12 * dt;
      pearl.pos.addScaledVector(pearl.vel, dt);
      pearl.mesh.position.copy(pearl.pos);

      const bx = Math.floor(pearl.pos.x);
      const by = Math.floor(pearl.pos.y);
      const bz = Math.floor(pearl.pos.z);
      const hit = isSolid(this.world.getBlock(bx, by, bz)) || pearl.life <= 0 || pearl.pos.y < 0;

      if (hit) {
        let ty = by;
        for (let y = by; y < by + 40; y++) {
          if (!isSolid(this.world.getBlock(bx, y, bz)) && !isSolid(this.world.getBlock(bx, y + 1, bz))) {
            ty = y;
            break;
          }
        }
        pearl.player.pos.set(bx + 0.5, ty, bz + 0.5);
        pearl.player.vel.set(0, 0, 0);
        this.scene.remove(pearl.mesh);
        this.pearls = this.pearls.filter((p) => p !== pearl);
      }
    }

    for (const bomb of [...this.bombs]) {
      bomb.life -= dt;
      bomb.vel.y -= 16 * dt;
      bomb.pos.addScaledVector(bomb.vel, dt);
      bomb.mesh.position.copy(bomb.pos);
      bomb.mesh.rotation.x += dt * 4;
      bomb.mesh.rotation.y += dt * 3;

      const bx = Math.floor(bomb.pos.x);
      const by = Math.floor(bomb.pos.y);
      const bz = Math.floor(bomb.pos.z);
      const hit = isSolid(this.world.getBlock(bx, by, bz)) || bomb.life <= 0 || bomb.pos.y < 0;
      if (hit) {
        this.explode(bomb.pos.clone());
        this.scene.remove(bomb.mesh);
        this.bombs = this.bombs.filter((b) => b !== bomb);
      }
    }

    for (const arrow of [...this.playerArrows]) {
      arrow.life -= dt;
      arrow.vel.y -= 8 * dt;
      arrow.pos.addScaledVector(arrow.vel, dt);
      arrow.mesh.position.copy(arrow.pos);
      const bx = Math.floor(arrow.pos.x);
      const by = Math.floor(arrow.pos.y);
      const bz = Math.floor(arrow.pos.z);
      const hitBlock = isSolid(this.world.getBlock(bx, by, bz));
      if (arrow.life <= 0 || hitBlock || arrow.pos.y < 0) {
        this.scene.remove(arrow.mesh);
        this.playerArrows = this.playerArrows.filter((a) => a !== arrow);
        continue;
      }
      if (arrow.mobs) {
        for (const mob of arrow.mobs.mobs) {
          const dx = Math.abs(arrow.pos.x - mob.pos.x);
          const dz = Math.abs(arrow.pos.z - mob.pos.z);
          if (dx < 0.5 && dz < 0.5 && arrow.pos.y > mob.pos.y && arrow.pos.y < mob.pos.y + mob.def.h) {
            arrow.mobs.damageMob(mob, 8, arrow.pos.clone());
            this.scene.remove(arrow.mesh);
            this.playerArrows = this.playerArrows.filter((a) => a !== arrow);
            break;
          }
        }
      }
    }
  }
}
