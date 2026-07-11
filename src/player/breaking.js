import { BLOCK_HARDNESS, isBreakable, effectiveTool } from '../world/blocks.js';
import { toolType, toolSpeed } from '../world/items.js';

export class BlockBreaker {
  constructor(world, inventory, drops) {
    this.world = world;
    this.inventory = inventory;
    this.drops = drops;
    this.target = null;
    this.progress = 0;
    this.active = false;
    this.instant = false;
  }

  sameTarget(t) {
    return (
      t &&
      this.target &&
      t.x === this.target.x &&
      t.y === this.target.y &&
      t.z === this.target.z
    );
  }

  start(target) {
    if (!target || !isBreakable(target.id)) {
      this.stop();
      return;
    }
    if (!this.sameTarget(target)) {
      this.target = { x: target.x, y: target.y, z: target.z, id: target.id };
      this.progress = 0;
    }
    this.active = true;
  }

  stop() {
    this.active = false;
    this.target = null;
    this.progress = 0;
  }

  update(dt, target) {
    if (!this.active || !target || !this.sameTarget(target)) {
      if (this.active) this.stop();
      return null;
    }
    if (this.instant) {
      const id = target.id;
      this.world.setBlock(target.x, target.y, target.z, 0);
      // Creative mode does not produce drops — the player has infinite
      // blocks already and breaking shouldn't clutter the world.
      this.stop();
      return 'broken';
    }
    const hardness = BLOCK_HARDNESS[target.id] ?? 2;
    // Holding the right tool class (pickaxe on stone, axe on wood, shovel
    // on dirt/sand) multiplies mining speed; anything else digs at hand speed.
    const held = this.inventory.selectedId();
    const heldTool = toolType(held);
    const speed = heldTool && heldTool === effectiveTool(target.id) ? toolSpeed(held) : 1;
    this.progress += (dt * speed) / hardness;
    if (this.progress < 1) return this.progress;

    const id = target.id;
    this.world.setBlock(target.x, target.y, target.z, 0);
    // Spawn a floating, spinning 3D mini block that the player picks up
    // by walking within ~1 block — instead of dumping it straight into
    // the inventory like before.
    if (!this.inventory.creative && this.drops) {
      this.drops.spawnBlockDrop(target.x, target.y, target.z, id, 1);
    }
    this.stop();
    return 'broken';
  }

  getProgress() {
    return this.progress;
  }
}
