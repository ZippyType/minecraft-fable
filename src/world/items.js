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
  ARROW: 120,
  BOW: 121,
  GOLDEN_SWORD: 122,
  GOLDEN_PICKAXE: 123,
  GOLDEN_AXE: 124,
  GOLDEN_SHOVEL: 125,
  DIAMOND_SWORD: 126,
  DIAMOND_PICKAXE: 127,
  DIAMOND_AXE: 128,
  DIAMOND_SHOVEL: 129,
  TNT_ITEM: 130,
  SHIELD: 131,
  LEATHER_HELMET: 132,
  LEATHER_CHEST: 133,
  LEATHER_LEGS: 134,
  LEATHER_BOOTS: 135,
  IRON_HELMET: 136,
  IRON_CHEST: 137,
  IRON_LEGS: 138,
  IRON_BOOTS: 139,
  DIAMOND_HELMET: 140,
  DIAMOND_CHEST: 141,
  DIAMOND_LEGS: 142,
  DIAMOND_BOOTS: 143,
  COOKED_STEAK: 144,
  COOKED_CHICKEN: 145,
  COOKED_LAMB: 146,
  GOLD_ORE_ITEM: 147,
  DIAMOND_ITEM: 148,
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
  [ITEM.ARROW]: { name: 'Arrow', icon: 20, purpose: 'weapon', meleeBonus: 1 },
  [ITEM.BOW]: { name: 'Bow', icon: 21, purpose: 'throw', throw: 'arrow' },
  [ITEM.GOLDEN_SWORD]: { name: 'Golden Sword', icon: 22, purpose: 'weapon', meleeBonus: 5 },
  [ITEM.GOLDEN_PICKAXE]: { name: 'Golden Pickaxe', icon: 23, purpose: 'tool', tool: 'pickaxe', speed: 3, meleeBonus: 2 },
  [ITEM.GOLDEN_AXE]: { name: 'Golden Axe', icon: 24, purpose: 'tool', tool: 'axe', speed: 3, meleeBonus: 4 },
  [ITEM.GOLDEN_SHOVEL]: { name: 'Golden Shovel', icon: 25, purpose: 'tool', tool: 'shovel', speed: 3, meleeBonus: 2 },
  [ITEM.DIAMOND_SWORD]: { name: 'Diamond Sword', icon: 26, purpose: 'weapon', meleeBonus: 10 },
  [ITEM.DIAMOND_PICKAXE]: { name: 'Diamond Pickaxe', icon: 27, purpose: 'tool', tool: 'pickaxe', speed: 8, meleeBonus: 4 },
  [ITEM.DIAMOND_AXE]: { name: 'Diamond Axe', icon: 28, purpose: 'tool', tool: 'axe', speed: 8, meleeBonus: 8 },
  [ITEM.DIAMOND_SHOVEL]: { name: 'Diamond Shovel', icon: 29, purpose: 'tool', tool: 'shovel', speed: 8, meleeBonus: 3 },
  [ITEM.TNT_ITEM]: { name: 'TNT', icon: 30, purpose: 'throw', throw: 'bomb' },
  [ITEM.SHIELD]: { name: 'Shield', icon: 31, purpose: 'weapon', meleeBonus: 3 },
  [ITEM.LEATHER_HELMET]: { name: 'Leather Helmet', icon: 32, purpose: 'armor', armorSlot: 'helmet', armorValue: 1 },
  [ITEM.LEATHER_CHEST]: { name: 'Leather Chestplate', icon: 33, purpose: 'armor', armorSlot: 'chest', armorValue: 3 },
  [ITEM.LEATHER_LEGS]: { name: 'Leather Leggings', icon: 34, purpose: 'armor', armorSlot: 'legs', armorValue: 2 },
  [ITEM.LEATHER_BOOTS]: { name: 'Leather Boots', icon: 35, purpose: 'armor', armorSlot: 'boots', armorValue: 1 },
  [ITEM.IRON_HELMET]: { name: 'Iron Helmet', icon: 36, purpose: 'armor', armorSlot: 'helmet', armorValue: 2 },
  [ITEM.IRON_CHEST]: { name: 'Iron Chestplate', icon: 37, purpose: 'armor', armorSlot: 'chest', armorValue: 6 },
  [ITEM.IRON_LEGS]: { name: 'Iron Leggings', icon: 38, purpose: 'armor', armorSlot: 'legs', armorValue: 5 },
  [ITEM.IRON_BOOTS]: { name: 'Iron Boots', icon: 39, purpose: 'armor', armorSlot: 'boots', armorValue: 2 },
  [ITEM.DIAMOND_HELMET]: { name: 'Diamond Helmet', icon: 40, purpose: 'armor', armorSlot: 'helmet', armorValue: 3 },
  [ITEM.DIAMOND_CHEST]: { name: 'Diamond Chestplate', icon: 41, purpose: 'armor', armorSlot: 'chest', armorValue: 8 },
  [ITEM.DIAMOND_LEGS]: { name: 'Diamond Leggings', icon: 42, purpose: 'armor', armorSlot: 'legs', armorValue: 6 },
  [ITEM.DIAMOND_BOOTS]: { name: 'Diamond Boots', icon: 43, purpose: 'armor', armorSlot: 'boots', armorValue: 3 },
  [ITEM.COOKED_STEAK]: { name: 'Cooked Steak', icon: 44, food: 8, purpose: 'food' },
  [ITEM.COOKED_CHICKEN]: { name: 'Cooked Chicken', icon: 45, food: 6, purpose: 'food' },
  [ITEM.COOKED_LAMB]: { name: 'Cooked Lamb', icon: 46, food: 6, purpose: 'food' },
  [ITEM.GOLD_ORE_ITEM]: { name: 'Raw Gold', icon: 47 },
  [ITEM.DIAMOND_ITEM]: { name: 'Diamond', icon: 48 },
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

export function smeltResult(id) {
  switch (id) {
    case ITEM.RAW_STEAK:
      return ITEM.COOKED_STEAK;
    case ITEM.RAW_CHICKEN:
      return ITEM.COOKED_CHICKEN;
    case ITEM.RAW_LAMB:
      return ITEM.COOKED_LAMB;
    default:
      return null;
  }
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

export function armorValue(id) {
  return ITEMS[id]?.armorValue ?? 0;
}

export function armorSlot(id) {
  return ITEMS[id]?.armorSlot ?? null;
}
