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
    this.pos = spawn.clone();
    this.spawnPoint = spawn.clone();
    this.vel = new THREE.Vector3();
    this.onGround = false;
    this.fly = false;
    this.maxHealth = 20;
    this.health = 20;
    this.maxHunger = 20;
    this.hunger = 20;
    this.hungerTimer = 0;
    this.starveTimer = 0;
    this.airborneY = null;
    this.invuln = 0;
    this.hurtFlash = 0;
    this.dead = false;
    this.creative = false;
  }

  damage(amount) {
    if (this.dead || this.invuln > 0 || this.creative) return;
    this.health = Math.max(0, this.health - amount);
    this.invuln = 0.6;
    this.hurtFlash = 0.35;
    if (this.health <= 0) this.dead = true;
  }

  eat(amount) {
    if (this.creative) return;
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
    if (this.hunger > 6) this.starveTimer = 0;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  respawn() {
    this.pos.copy(this.spawnPoint);
    this.vel.set(0, 0, 0);
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.dead = false;
    this.invuln = 2;
    this.airborneY = null;
    this.hungerTimer = 0;
    this.starveTimer = 0;
  }

  update(dt, input, world) {
    if (this.dead) return;
    dt = Math.min(dt, 0.05);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;

    const yaw = input.yaw;
    // Keyboard is digital, the touch joystick analog — combine both and cap
    // the magnitude at 1 so partial stick tilt walks slower.
    const f = (input.isAction('forward') ? 1 : 0) - (input.isAction('back') ? 1 : 0) + input.touchF;
    const s = (input.isAction('right') ? 1 : 0) - (input.isAction('left') ? 1 : 0) + input.touchS;
    let mx = -Math.sin(yaw) * f + Math.cos(yaw) * s;
    let mz = -Math.cos(yaw) * f - Math.sin(yaw) * s;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const moving = len > 0.1;
    const inWater =
      world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y + 1), Math.floor(this.pos.z)) === BLOCK.WATER;
    const shift = input.isAction('sprint');
    const space = input.isAction('jump');

    let speed = this.fly ? 14 : shift || input.touchSprint ? 7 : 4.5;
    if (inWater && !this.fly) speed *= 0.5;
    const k = 1 - Math.exp(-dt * (this.onGround || this.fly ? 12 : 6));
    this.vel.x += (mx * speed - this.vel.x) * k;
    this.vel.z += (mz * speed - this.vel.z) * k;

    if (this.fly) {
      const vy = (space ? 1 : 0) - (shift ? 1 : 0);
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

    const dx = this.vel.x * dt;
    const dy = this.vel.y * dt;
    const dz = this.vel.z * dt;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) / 0.4));
    const wasGrounded = this.onGround;
    this.onGround = false;
    for (let i = 0; i < steps; i++) {
      this.moveAxis(world, 'y', dy / steps);
      this.moveAxis(world, 'x', dx / steps);
      this.moveAxis(world, 'z', dz / steps);
    }

    // Fall damage — track highest Y while airborne.
    if (!this.onGround && !this.fly) {
      this.airborneY = this.airborneY === null ? this.pos.y : Math.max(this.airborneY, this.pos.y);
    } else if (this.onGround && this.airborneY !== null && !this.fly) {
      const fall = this.airborneY - this.pos.y;
      if (fall > 3) {
        const dmg = Math.floor(fall - 3);
        if (dmg > 0) this.damage(dmg);
      }
      this.airborneY = null;
    }
    if (this.onGround && wasGrounded && this.vel.y === 0) {
      this.airborneY = null;
    }

    if (!this.creative) {
      if (moving && !this.fly) {
        this.hungerTimer += dt * (shift ? 2 : 1);
        if (this.hungerTimer >= 5) {
          this.hungerTimer = 0;
          this.hunger = Math.max(0, this.hunger - 1);
        }
      }
      if (this.hunger <= 0) {
        this.starveTimer += dt;
        if (this.starveTimer >= 4) {
          this.starveTimer = 0;
          this.damage(1);
        }
      } else {
        this.starveTimer = 0;
      }
    }

    if (this.pos.y < -16) {
      this.damage(20);
      if (!this.dead) this.respawn();
    }
  }

  moveAxis(world, axis, amt) {
    if (amt === 0) return;
    const before = this.pos[axis];
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
          // Only resolve against blocks this move newly entered. Blocks that
          // already overlapped the box before the move (e.g. spawning with
          // your head inside leaves) must not snap the player — that
          // teleports them on top of the block instead of stopping a move.
          if (axis === 'x' && bx + 1 > before - HALF_W && bx < before + HALF_W) continue;
          if (axis === 'z' && bz + 1 > before - HALF_W && bz < before + HALF_W) continue;
          if (axis === 'y' && by + 1 > before && by < before + HEIGHT) continue;
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
