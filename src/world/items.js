export const ITEM = {
  ROTTEN_FLESH: 100,
  GUNPOWDER: 101,
  BONE: 102,
  ENDER_PEARL: 103,
  RAW_STEAK: 104,
  RAW_CHICKEN: 105,
  RAW_LAMB: 106,
  STICK: 107,
  WOODEN_SWORD: 108,
  STONE_SWORD: 109,
  IRON_SWORD: 110,
  WOODEN_PICKAXE: 111,
  STONE_PICKAXE: 112,
  IRON_PICKAXE: 113,
  WOODEN_AXE: 114,
  STONE_AXE: 115,
  IRON_AXE: 116,
  WOODEN_SHOVEL: 117,
  STONE_SHOVEL: 118,
  IRON_SHOVEL: 119,
};

// `purpose` declares what an item does when you right-click while holding it,
// so the rest of the code can branch on a stable string instead of magic IDs.
//   - 'food'    : restores hunger (see `food` field)
//   - 'throw'   : right-click throws a projectile (see `throw` field)
//   - 'weapon'  : passive melee bonus while held (see `meleeBonus` field)
//   - 'tool'    : mines matching blocks faster (see `tool` + `speed` fields);
//                 also grants a passive melee bonus like a weapon
export const ITEMS = {
  [ITEM.ROTTEN_FLESH]: { name: 'Rotten Flesh', icon: 0, food: 4, purpose: 'food' },
  [ITEM.GUNPOWDER]: { name: 'Gunpowder', icon: 1, purpose: 'throw', throw: 'bomb' },
  [ITEM.BONE]: { name: 'Bone', icon: 2, purpose: 'weapon', meleeBonus: 4 },
  [ITEM.ENDER_PEARL]: { name: 'Ender Pearl', icon: 3, purpose: 'throw', throw: 'pearl' },
  [ITEM.RAW_STEAK]: { name: 'Raw Steak', icon: 4, food: 8, purpose: 'food' },
  [ITEM.RAW_CHICKEN]: { name: 'Raw Chicken', icon: 5, food: 2, purpose: 'food' },
  [ITEM.RAW_LAMB]: { name: 'Raw Lamb', icon: 6, food: 6, purpose: 'food' },
  [ITEM.STICK]: { name: 'Stick', icon: 7, purpose: 'weapon', meleeBonus: 2 },

  [ITEM.WOODEN_SWORD]: { name: 'Wooden Sword', icon: 8, purpose: 'weapon', meleeBonus: 4 },
  [ITEM.STONE_SWORD]: { name: 'Stone Sword', icon: 9, purpose: 'weapon', meleeBonus: 6 },
  [ITEM.IRON_SWORD]: { name: 'Iron Sword', icon: 10, purpose: 'weapon', meleeBonus: 8 },
  [ITEM.WOODEN_PICKAXE]: { name: 'Wooden Pickaxe', icon: 11, purpose: 'tool', tool: 'pickaxe', speed: 2, meleeBonus: 1 },
  [ITEM.STONE_PICKAXE]: { name: 'Stone Pickaxe', icon: 12, purpose: 'tool', tool: 'pickaxe', speed: 4, meleeBonus: 2 },
  [ITEM.IRON_PICKAXE]: { name: 'Iron Pickaxe', icon: 13, purpose: 'tool', tool: 'pickaxe', speed: 6, meleeBonus: 3 },
  [ITEM.WOODEN_AXE]: { name: 'Wooden Axe', icon: 14, purpose: 'tool', tool: 'axe', speed: 2, meleeBonus: 3 },
  [ITEM.STONE_AXE]: { name: 'Stone Axe', icon: 15, purpose: 'tool', tool: 'axe', speed: 4, meleeBonus: 5 },
  [ITEM.IRON_AXE]: { name: 'Iron Axe', icon: 16, purpose: 'tool', tool: 'axe', speed: 6, meleeBonus: 7 },
  [ITEM.WOODEN_SHOVEL]: { name: 'Wooden Shovel', icon: 17, purpose: 'tool', tool: 'shovel', speed: 2, meleeBonus: 1 },
  [ITEM.STONE_SHOVEL]: { name: 'Stone Shovel', icon: 18, purpose: 'tool', tool: 'shovel', speed: 4, meleeBonus: 2 },
  [ITEM.IRON_SHOVEL]: { name: 'Iron Shovel', icon: 19, purpose: 'tool', tool: 'shovel', speed: 6, meleeBonus: 3 },
};

export function isBlock(id) {
  return id > 0 && id < 100;
}

export function isItem(id) {
  return id >= 100;
}

export function isFood(id) {
  return ITEMS[id]?.food > 0;
}

export function foodValue(id) {
  return ITEMS[id]?.food ?? 0;
}

export function itemName(id) {
  return ITEMS[id]?.name ?? 'Item';
}

export function itemPurpose(id) {
  return ITEMS[id]?.purpose ?? null;
}

export function meleeBonus(id) {
  return ITEMS[id]?.meleeBonus ?? 0;
}

// Tool class ('pickaxe' | 'axe' | 'shovel') of the item, or null.
export function toolType(id) {
  return ITEMS[id]?.tool ?? null;
}

// Mining speed multiplier when the tool matches the block (1 = bare hands).
export function toolSpeed(id) {
  return ITEMS[id]?.speed ?? 1;
}
