import { BLOCK, BLOCKS } from '../world/blocks.js';
import { ITEM, ITEMS } from '../world/items.js';

export const MAX_STACK = 64;
export const HOTBAR_SIZE = 9;
export const INVENTORY_SIZE = 36;

const PLACEABLE = Object.keys(BLOCKS).map(Number).filter((id) => id !== BLOCK.AIR);
const ALL_IDS = [...PLACEABLE, ...Object.keys(ITEMS).map(Number)];

function cloneStack(s) {
  return s ? { id: s.id, count: s.count, infinite: !!s.infinite } : null;
}

export class Inventory {
  constructor() {
    this.slots = Array(INVENTORY_SIZE).fill(null);
    this.selected = 0;
    this.creative = false;
    this.craftSlots = [null, null, null, null];
  }

  getSlot(i) {
    return this.slots[i] ?? null;
  }

  setSlot(i, stack) {
    this.slots[i] = stack;
  }

  selectedStack() {
    return this.getSlot(this.selected);
  }

  selectedId() {
    const s = this.selectedStack();
    return s && (s.infinite || s.count > 0) ? s.id : null;
  }

  selectedBlockId() {
    const id = this.selectedId();
    return id && id < 100 ? id : null;
  }

  setCreative(on) {
    this.creative = on;
    if (on) this.fillCreative();
    else this.clear();
  }

  clear() {
    this.slots = Array(INVENTORY_SIZE).fill(null);
    this.craftSlots = [null, null, null, null];
  }

  fillCreative() {
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const id = ALL_IDS[i % ALL_IDS.length];
      this.slots[i] = { id, count: MAX_STACK, infinite: true };
    }
    // Ensure every unique block + item appears at least once in the first slots.
    ALL_IDS.forEach((id, i) => {
      if (i < INVENTORY_SIZE) this.slots[i] = { id, count: MAX_STACK, infinite: true };
    });
  }

  addItem(id, count = 1) {
    if (this.creative) return count;
    let left = count;
    for (let i = 0; i < INVENTORY_SIZE && left > 0; i++) {
      const s = this.slots[i];
      if (!s || s.id !== id) continue;
      const room = MAX_STACK - s.count;
      if (room <= 0) continue;
      const add = Math.min(room, left);
      s.count += add;
      left -= add;
    }
    for (let i = 0; i < INVENTORY_SIZE && left > 0; i++) {
      if (this.slots[i]) continue;
      const add = Math.min(MAX_STACK, left);
      this.slots[i] = { id, count: add };
      left -= add;
    }
    return count - left;
  }

  removeFromSlot(i, count = 1) {
    const s = this.slots[i];
    if (!s || s.infinite) return true;
    s.count -= count;
    if (s.count <= 0) this.slots[i] = null;
    return true;
  }

  removeFromSelected(count = 1) {
    return this.removeFromSlot(this.selected, count);
  }

  quickMove(i) {
    const stack = this.slots[i];
    if (!stack) return;
    const toHotbar = i >= HOTBAR_SIZE;
    const start = toHotbar ? 0 : HOTBAR_SIZE;
    const end = toHotbar ? HOTBAR_SIZE : INVENTORY_SIZE;
    for (let j = start; j < end; j++) {
      const dst = this.slots[j];
      if (!dst) {
        if (stack.infinite) this.slots[j] = cloneStack(stack);
        else {
          this.slots[j] = stack;
          this.slots[i] = null;
        }
        return;
      }
      if (dst.infinite || stack.infinite) continue;
      if (dst.id === stack.id) {
        const room = MAX_STACK - dst.count;
        const move = Math.min(room, stack.count);
        if (move <= 0) continue;
        dst.count += move;
        stack.count -= move;
        if (stack.count <= 0) this.slots[i] = null;
        return;
      }
    }
  }

  moveSlotClick(i, held) {
    const slot = this.slots[i];
    if (!held) {
      if (!slot) return null;
      if (slot.infinite) return cloneStack(slot);
      this.slots[i] = null;
      return cloneStack(slot);
    }
    if (!slot) {
      this.slots[i] = held.infinite ? cloneStack(held) : held;
      return null;
    }
    if (slot.infinite && held.infinite) {
      this.slots[i] = cloneStack(held);
      return cloneStack(slot);
    }
    if (slot.infinite) {
      this.slots[i] = held.infinite ? cloneStack(held) : held;
      return cloneStack(slot);
    }
    if (held.infinite) {
      this.slots[i] = cloneStack(held);
      return cloneStack(slot);
    }
    if (slot.id === held.id) {
      const room = MAX_STACK - slot.count;
      const move = Math.min(room, held.count);
      if (move > 0) {
        slot.count += move;
        held.count -= move;
        return held.count > 0 ? held : null;
      }
    }
    this.slots[i] = held;
    return cloneStack(slot);
  }

  moveCraftClick(i, held) {
    const slot = this.craftSlots[i];
    if (!held) {
      if (!slot) return null;
      this.craftSlots[i] = null;
      return cloneStack(slot);
    }
    if (!slot) {
      // Drop a single item from the held stack into the empty craft slot.
      this.craftSlots[i] = { id: held.id, count: 1 };
      if (!held.infinite) {
        held.count -= 1;
        return held.count > 0 ? held : null;
      }
      return held;
    }
    if (slot.id === held.id) {
      if (slot.count >= MAX_STACK) return held;
      slot.count += 1;
      if (!held.infinite) {
        held.count -= 1;
        return held.count > 0 ? held : null;
      }
      return held;
    }
    // Different item: swap the whole stacks so nothing is destroyed.
    this.craftSlots[i] = held.infinite ? { id: held.id, count: 1 } : held;
    return cloneStack(slot);
  }
}
