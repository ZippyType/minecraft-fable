import * as THREE from 'three';
import { BLOCK, isSolid } from '../world/blocks.js';
import { ITEMS } from '../world/items.js';
import { buildMobMesh } from '../render/mobMeshes.js';

import { MOB } from './mobTypes.js';

export { MOB };

const DEFS = {
  [MOB.SHEEP]: { hp: 8, speed: 2.2, w: 0.9, h: 1.0, passive: true },
  [MOB.CHICKEN]: { hp: 4, speed: 2.5, w: 0.5, h: 0.7, passive: true },
  [MOB.COW]: { hp: 10, speed: 2.0, w: 1.1, h: 1.1, passive: true },
  [MOB.ZOMBIE]: { hp: 20, speed: 2.6, w: 0.6, h: 1.95, dmg: 3, range: 1.6 },
  [MOB.SKELETON]: { hp: 20, speed: 2.4, w: 0.6, h: 1.95, dmg: 4, range: 14 },
  [MOB.CREEPER]: { hp: 20, speed: 2.8, w: 0.6, h: 1.3, dmg: 8, range: 1.8 },
  [MOB.ENDERMAN]: { hp: 40, speed: 3.4, w: 0.6, h: 2.9, dmg: 7, range: 2.2 },
};

const PASSIVE = [MOB.SHEEP, MOB.CHICKEN, MOB.COW];
const HOSTILE = [MOB.ZOMBIE, MOB.SKELETON, MOB.CREEPER, MOB.ENDERMAN];

function makeMesh(type) {
  return buildMobMesh(type);
}

export class MobManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mobs = [];
    this.arrows = [];
    this.spawnTimer = 0;
    this.onMobDeath = null;
    this.onExplode = null;
    this.arrowGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
    this.arrowMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    this.spawnerTimers = new Map();
  }

  spawn(type, x, y, z) {
    const def = DEFS[type];
    const group = makeMesh(type);
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobs.push({
      type,
      def,
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(),
      hp: def.hp,
      mesh: group,
      attackCd: 0,
      wander: Math.random() * Math.PI * 2,
      aggro: type !== MOB.ENDERMAN,
      stare: 0,
      fuse: 0,
      flash: false,
      onGround: false,
      baby: false,
      age: 0,
      breedTimer: 0,
    });
  }

  spawnNearPlayer(player, type, lookDir) {
    const x = player.pos.x + lookDir.x * 4;
    const z = player.pos.z + lookDir.z * 4;
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    const findGap = (startY) => {
      for (let y = startY; y > 1; y--) {
        const below = this.world.getBlock(bx, y - 1, bz);
        const at = this.world.getBlock(bx, y, bz);
        const above = this.world.getBlock(bx, y + 1, bz);
        if (isSolid(below) && at === BLOCK.AIR && above === BLOCK.AIR) return y;
      }
      return -1;
    };
    // Search near the player's height first (works in caves); if that column
    // is solid rock (e.g. aiming into a hillside), take the surface instead
    // of silently dropping to bedrock.
    let y = findGap(Math.floor(player.pos.y) + 2);
    if (y < 0) y = findGap(70);
    if (y < 0) y = Math.floor(player.pos.y) + 1;
    this.spawn(type, x, y, z);
  }

  // Each mob owns its canvas textures/materials (needed for per-mob hurt
  // flashes), so they must be freed on removal or long sessions leak GPU memory.
  disposeMob(mob) {
    mob.mesh.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry.dispose();
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    });
  }

  removeMob(mob) {
    this.scene.remove(mob.mesh);
    this.disposeMob(mob);
    this.mobs = this.mobs.filter((m) => m !== mob);
  }

  clearHostile() {
    this.mobs = this.mobs.filter((m) => {
      if (!m.def.passive) {
        this.scene.remove(m.mesh);
        this.disposeMob(m);
        return false;
      }
      return true;
    });
  }

  clearAll() {
    for (const m of this.mobs) {
      this.scene.remove(m.mesh);
      this.disposeMob(m);
    }
    this.mobs = [];
    for (const a of this.arrows) this.scene.remove(a.mesh);
    this.arrows = [];
  }

  inSunlight(mob, sky) {
    if (!sky.isDay()) return false;
    const x = Math.floor(mob.pos.x);
    const z = Math.floor(mob.pos.z);
    for (let y = Math.floor(mob.pos.y + mob.def.h); y < 80; y++) {
      if (isSolid(this.world.getBlock(x, y, z))) return false;
    }
    return true;
  }

  trySpawn(dt, playerPos, sky) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = 2.5;

    const isDay = sky.isDay();
    const isNight = sky.isNight();
    const pool = isDay ? PASSIVE : isNight ? HOSTILE : null;
    if (!pool) return;

    const passiveCount = this.mobs.filter((m) => m.def.passive).length;
    const hostileCount = this.mobs.filter((m) => !m.def.passive).length;
    const cap = isDay ? 12 : 10;
    if ((isDay && passiveCount >= cap) || (isNight && hostileCount >= cap)) return;

    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 22;
      const x = playerPos.x + Math.cos(ang) * dist;
      const z = playerPos.z + Math.sin(ang) * dist;
      const bx = Math.floor(x);
      const bz = Math.floor(z);
      let y = 72;
      for (; y > 0; y--) {
        const below = this.world.getBlock(bx, y - 1, bz);
        const at = this.world.getBlock(bx, y, bz);
        const above = this.world.getBlock(bx, y + 1, bz);
        if (isSolid(below) && at === BLOCK.AIR && above === BLOCK.AIR) break;
      }
      if (y < 2) continue;
      const type = pool[Math.floor(Math.random() * pool.length)];
      this.spawn(type, x, y, z);
      break;
    }
  }

  updateSpawners(dt, playerPos) {
    const pcx = Math.floor(playerPos.x / 16);
    const pcz = Math.floor(playerPos.z / 16);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const spawner = this.world.terrain.getDungeonSpawner(cx, cz);
        if (!spawner) continue;

        const key = `${cx},${cz}`;
        let entry = this.spawnerTimers.get(key);
        if (!entry) {
          entry = { timer: 10 + Math.random() * 10, pos: spawner };
          this.spawnerTimers.set(key, entry);
        }

        entry.timer -= dt;
        if (entry.timer <= 0) {
          entry.timer = 10 + Math.random() * 10;
          const sp = entry.pos;
          const nearby = this.mobs.filter(m => {
            if (m.def.passive) return false;
            const ddx = m.pos.x - sp.x;
            const ddy = m.pos.y - sp.y;
            const ddz = m.pos.z - sp.z;
            return ddx * ddx + ddy * ddy + ddz * ddz < 64;
          });
          if (nearby.length < 2) {
            const type = HOSTILE[Math.floor(Math.random() * HOSTILE.length)];
            this.spawn(type, sp.x + 0.5, sp.y + 1, sp.z + 0.5);
          }
        }
      }
    }
  }

  shootArrow(from, dir) {
    const mesh = new THREE.Mesh(this.arrowGeo, this.arrowMat);
    mesh.position.copy(from);
    mesh.lookAt(from.x + dir.x, from.y + dir.y, from.z + dir.z);
    this.scene.add(mesh);
    this.arrows.push({
      pos: from.clone(),
      vel: dir.clone().multiplyScalar(16),
      mesh,
      life: 4,
    });
  }

  playerLookingAt(mob, cameraPos, lookDir) {
    const center = mob.pos.clone().add(new THREE.Vector3(0, mob.def.h * 0.85, 0));
    const to = center.clone().sub(cameraPos);
    const dist = to.length();
    if (dist > 32 || dist < 0.5) return false;
    to.normalize();
    if (lookDir.dot(to) < 0.92) return false;
    const t = (center.clone().sub(cameraPos)).dot(lookDir);
    if (t < 0) return false;
    const closest = cameraPos.clone().addScaledVector(lookDir, t);
    return closest.distanceTo(center) < mob.def.w * 0.8;
  }

  raycastMob(cameraPos, lookDir, maxDist = 4.5) {
    let best = null;
    let bestT = Infinity;
    for (const mob of this.mobs) {
      const center = mob.pos.clone().add(new THREE.Vector3(0, mob.def.h * 0.5, 0));
      const t = center.clone().sub(cameraPos).dot(lookDir);
      if (t < 0.3 || t > maxDist) continue;
      const closest = cameraPos.clone().addScaledVector(lookDir, t);
      const hw = mob.def.w * 0.65;
      if (
        Math.abs(closest.x - center.x) < hw &&
        Math.abs(closest.y - center.y) < mob.def.h * 0.55 &&
        Math.abs(closest.z - center.z) < hw &&
        t < bestT
      ) {
        best = mob;
        bestT = t;
      }
    }
    return best;
  }

  killMob(mob) {
    const type = mob.type;
    const pos = mob.pos.clone();
    this.removeMob(mob);
    this.onMobDeath?.(type, pos);
  }

  breedAnimals(player, inventory) {
    const id = inventory.selectedId();
    if (!id) return false;
    const itemDef = ITEMS[id];
    if (!itemDef || itemDef.purpose !== 'food') return false;

    const candidates = this.mobs.filter(
      (m) => m.def.passive && !m.baby && m.breedTimer <= 0
    );

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];
        if (a.type !== b.type) continue;
        const dist = a.pos.distanceTo(b.pos);
        if (dist > 4) continue;
        const playerDist = player.pos.distanceTo(a.pos.clone().add(b.pos).multiplyScalar(0.5));
        if (playerDist > 4) continue;

        const mid = a.pos.clone().add(b.pos).multiplyScalar(0.5);
        this.spawn(a.type, mid.x, mid.y, mid.z);
        const baby = this.mobs[this.mobs.length - 1];
        baby.baby = true;
        baby.age = 0;
        baby.mesh.scale.set(0.6, 0.6, 0.6);

        a.breedTimer = 60;
        b.breedTimer = 60;
        inventory.removeFromSelected(1);
        return true;
      }
    }
    return false;
  }

  damageMob(mob, amount, fromPos) {
    mob.hp -= amount;
    mob.hurtTime = 0.2;
    const knock = mob.pos.clone().sub(fromPos);
    knock.y = 0;
    if (knock.lengthSq() > 0.01) {
      knock.normalize().multiplyScalar(4);
      mob.vel.add(knock);
    }
    if (mob.hp <= 0) {
      this.killMob(mob);
      return true;
    }
    return false;
  }

  update(dt, player, sky, cameraPos, lookDir, paused, creative = false) {
    if (paused) return;

    this.trySpawn(dt, player.pos, sky);
    this.updateSpawners(dt, player.pos);

    for (const mob of [...this.mobs]) {
      if (mob.hurtTime > 0) mob.hurtTime -= dt;
      if (mob.breedTimer > 0) mob.breedTimer -= dt;
      if (mob.baby) {
        mob.age += dt;
        const scale = 0.6 + 0.4 * (mob.age / 20);
        mob.mesh.scale.set(scale, scale, scale);
        if (mob.age >= 20) mob.baby = false;
      }
      const tint = mob.hurtTime > 0 ? 0x552222 : mob.flash ? 0x999999 : 0x000000;
      mob.mesh.traverse((child) => {
        if (child.isMesh && child.material?.emissive) {
          child.material.emissive.setHex(tint);
        }
      });

      if (!mob.def.passive && this.inSunlight(mob, sky)) {
        mob.hp -= dt * 6;
        if (mob.hp <= 0) {
          this.killMob(mob);
          continue;
        }
      }

      mob.attackCd = Math.max(0, mob.attackCd - dt);

      if (mob.type === MOB.ENDERMAN) {
        if (this.playerLookingAt(mob, cameraPos, lookDir)) mob.stare += dt;
        else mob.stare = Math.max(0, mob.stare - dt * 2);
        mob.aggro = mob.stare > 0.6;
      }

      const toPlayer = player.pos.clone().sub(mob.pos);
      const flat = new THREE.Vector3(toPlayer.x, 0, toPlayer.z);
      const dist = flat.length();
      const chase = !mob.def.passive && mob.aggro && dist < 28;
      const wander = mob.def.passive || !mob.aggro;

      // Creepers don't melee: close to the player they stop, hiss (flash),
      // and blow up unless the player backs away in time.
      if (mob.type === MOB.CREEPER) {
        const arming = chase && dist < 2.6 && !player.dead && !creative;
        if (arming) {
          mob.fuse += dt;
          mob.flash = Math.sin(mob.fuse * 22) > 0;
          if (mob.fuse >= 1.3) {
            const at = mob.pos.clone().add(new THREE.Vector3(0, mob.def.h * 0.5, 0));
            this.removeMob(mob); // explodes — no drops
            this.onExplode?.(at);
            continue;
          }
        } else {
          mob.fuse = Math.max(0, mob.fuse - dt * 1.5);
          mob.flash = false;
        }
      }

      let mx = 0;
      let mz = 0;
      if (chase) {
        flat.normalize();
        mx = flat.x;
        mz = flat.z;
      } else if (wander) {
        mob.wander += dt * (mob.def.passive ? 0.8 : 0.3);
        mx = Math.cos(mob.wander);
        mz = Math.sin(mob.wander);
      }

      if (mob.type === MOB.CREEPER && mob.fuse > 0) {
        mx = 0;
        mz = 0;
      }

      const speed = mob.def.speed * (chase ? 1.15 : 0.45);
      mob.vel.x += (mx * speed - mob.vel.x) * (1 - Math.exp(-dt * 8));
      mob.vel.z += (mz * speed - mob.vel.z) * (1 - Math.exp(-dt * 8));
      mob.vel.y -= 24 * dt;

      let before = mob.pos.x;
      mob.pos.x += mob.vel.x * dt;
      this.resolveAxis(mob, 'x', before);
      before = mob.pos.z;
      mob.pos.z += mob.vel.z * dt;
      this.resolveAxis(mob, 'z', before);
      before = mob.pos.y;
      mob.pos.y += mob.vel.y * dt;
      mob.onGround = false;
      this.resolveAxis(mob, 'y', before);
      if (mob.onGround) mob.vel.y = 0;

      mob.mesh.position.copy(mob.pos);
      if (chase) mob.mesh.rotation.y = Math.atan2(-flat.x, -flat.z);

      if (!player.dead && !creative && chase) {
        const reach = mob.def.range ?? 1.6;
        const yDiff = Math.abs(player.pos.y + 1 - (mob.pos.y + mob.def.h * 0.5));
        if (mob.type !== MOB.CREEPER && dist < reach && yDiff < 2.5 && mob.attackCd <= 0) {
          if (mob.type === MOB.SKELETON && dist > 2.5) {
            const aim = player.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
            const from = mob.pos.clone().add(new THREE.Vector3(0, mob.def.h * 0.75, 0));
            const dir = aim.sub(from).normalize();
            this.shootArrow(from, dir);
            mob.attackCd = 1.8;
          } else if (mob.type !== MOB.SKELETON || dist <= 2.5) {
            player.damage(mob.def.dmg ?? 3);
            mob.attackCd = 1.1;
          }
        }
      }
    }

    for (const arrow of [...this.arrows]) {
      arrow.life -= dt;
      arrow.pos.addScaledVector(arrow.vel, dt);
      arrow.mesh.position.copy(arrow.pos);
      const hitBlock = isSolid(this.world.getBlock(
        Math.floor(arrow.pos.x),
        Math.floor(arrow.pos.y),
        Math.floor(arrow.pos.z)
      ));
      if (arrow.life <= 0 || hitBlock) {
        this.scene.remove(arrow.mesh);
        this.arrows = this.arrows.filter((a) => a !== arrow);
        continue;
      }
      const p = player.pos;
      if (
        !player.dead &&
        !creative &&
        Math.abs(arrow.pos.x - p.x) < 0.45 &&
        Math.abs(arrow.pos.z - p.z) < 0.45 &&
        arrow.pos.y > p.y &&
        arrow.pos.y < p.y + 1.8
      ) {
        player.damage(4);
        this.scene.remove(arrow.mesh);
        this.arrows = this.arrows.filter((a) => a !== arrow);
      }
    }
  }

  resolveAxis(mob, axis, before) {
    const hw = mob.def.w / 2;
    const minX = Math.floor(mob.pos.x - hw);
    const maxX = Math.floor(mob.pos.x + hw);
    const minY = Math.floor(mob.pos.y);
    const maxY = Math.floor(mob.pos.y + mob.def.h);
    const minZ = Math.floor(mob.pos.z - hw);
    const maxZ = Math.floor(mob.pos.z + hw);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (!isSolid(this.world.getBlock(bx, by, bz))) continue;
          // Skip blocks that already overlapped before this move (see
          // Player.moveAxis) — resolving them teleports the mob upward.
          if (axis === 'x' && bx + 1 > before - hw && bx < before + hw) continue;
          if (axis === 'z' && bz + 1 > before - hw && bz < before + hw) continue;
          if (axis === 'y' && by + 1 > before && by < before + mob.def.h) continue;
          if (axis === 'x') {
            mob.pos.x = mob.vel.x > 0 ? bx - hw - 0.01 : bx + 1 + hw + 0.01;
            mob.vel.x = 0;
          } else if (axis === 'z') {
            mob.pos.z = mob.vel.z > 0 ? bz - hw - 0.01 : bz + 1 + hw + 0.01;
            mob.vel.z = 0;
          } else {
            if (mob.vel.y > 0) mob.pos.y = by - mob.def.h - 0.01;
            else {
              mob.pos.y = by + 1;
              mob.onGround = true;
            }
            mob.vel.y = 0;
          }
        }
      }
    }
  }
}
