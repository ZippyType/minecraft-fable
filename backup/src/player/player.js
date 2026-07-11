import * as THREE from 'three';
import { BLOCK, isSolid } from '../world/blocks.js';

const HALF_W = 0.3;
const HEIGHT = 1.8;
export const EYE_HEIGHT = 1.62;
const EPS = 0.001;
const GRAVITY = 28;
const JUMP_SPEED = 8.8;

export class Player {
  constructor(spawn) {
    this.pos = spawn.clone(); // feet position (center of footprint)
    this.spawnPoint = spawn.clone();
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.fly = false;
  }

  update(dt, input, world) {
    dt = Math.min(dt, 0.05);

    // Camera-relative movement direction on the XZ plane.
    const yaw = input.yaw;
    const f = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const s = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    let mx = -Math.sin(yaw) * f + Math.cos(yaw) * s;
    let mz = -Math.cos(yaw) * f - Math.sin(yaw) * s;
    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len;
      mz /= len;
    }

    const inWater =
      world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y + 1), Math.floor(this.pos.z)) === BLOCK.WATER;
    const shift = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const space = input.isDown('Space');

    let speed = this.fly ? 14 : shift ? 7 : 4.5;
    if (inWater && !this.fly) speed *= 0.5;
    const k = 1 - Math.exp(-dt * (this.onGround || this.fly ? 12 : 6));
    this.vel.x += (mx * speed - this.vel.x) * k;
    this.vel.z += (mz * speed - this.vel.z) * k;

    if (this.fly) {
      const vy = (space ? 1 : 0) - (shift ? 1 : 0); // in fly mode Shift descends
      this.vel.y += (vy * 10 - this.vel.y) * (1 - Math.exp(-dt * 12));
    } else if (inWater) {
      this.vel.y -= 14 * dt;
      if (space) this.vel.y += 42 * dt;
      this.vel.y = Math.max(-4.5, Math.min(4.5, this.vel.y));
    } else {
      this.vel.y -= GRAVITY * dt;
      this.vel.y = Math.max(this.vel.y, -55);
      if (space && this.onGround) {
        this.vel.y = JUMP_SPEED;
        this.onGround = false;
      }
    }

    // Sub-step the move so a fast fall can never skip past a block face.
    const dx = this.vel.x * dt;
    const dy = this.vel.y * dt;
    const dz = this.vel.z * dt;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) / 0.4));
    this.onGround = false;
    for (let i = 0; i < steps; i++) {
      this.moveAxis(world, 'y', dy / steps);
      this.moveAxis(world, 'x', dx / steps);
      this.moveAxis(world, 'z', dz / steps);
    }

    if (this.pos.y < -16) {
      this.pos.copy(this.spawnPoint);
      this.vel.set(0, 0, 0);
    }
  }

  moveAxis(world, axis, amt) {
    if (amt === 0) return;
    this.pos[axis] += amt;
    const minX = Math.floor(this.pos.x - HALF_W);
    const maxX = Math.floor(this.pos.x + HALF_W);
    const minY = Math.floor(this.pos.y);
    const maxY = Math.floor(this.pos.y + HEIGHT);
    const minZ = Math.floor(this.pos.z - HALF_W);
    const maxZ = Math.floor(this.pos.z + HALF_W);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (!isSolid(world.getBlock(bx, by, bz))) continue;
          if (axis === 'x') {
            this.pos.x = amt > 0
              ? Math.min(this.pos.x, bx - HALF_W - EPS)
              : Math.max(this.pos.x, bx + 1 + HALF_W + EPS);
            this.vel.x = 0;
          } else if (axis === 'z') {
            this.pos.z = amt > 0
              ? Math.min(this.pos.z, bz - HALF_W - EPS)
              : Math.max(this.pos.z, bz + 1 + HALF_W + EPS);
            this.vel.z = 0;
          } else {
            if (amt > 0) {
              this.pos.y = Math.min(this.pos.y, by - HEIGHT - EPS);
            } else {
              this.pos.y = Math.max(this.pos.y, by + 1);
              this.onGround = true;
            }
            this.vel.y = 0;
          }
        }
      }
    }
  }

  intersectsBlock(bx, by, bz) {
    return (
      bx + 1 > this.pos.x - HALF_W && bx < this.pos.x + HALF_W &&
      by + 1 > this.pos.y && by < this.pos.y + HEIGHT &&
      bz + 1 > this.pos.z - HALF_W && bz < this.pos.z + HALF_W
    );
  }
}
