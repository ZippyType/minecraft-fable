export const ITEM = {
  ROTTEN_FLESH: 100,
  GUNPOWDER: 101,
  BONE: 102,
  ENDER_PEARL: 103,
  RAW_STEAK: 104,
  RAW_CHICKEN: 105,
  RAW_LAMB: 106,
  STICK: 107,
};

// `purpose` declares what an item does when you right-click while holding it,
// so the rest of the code can branch on a stable string instead of magic IDs.
//   - 'food'    : restores hunger (see `food` field)
//   - 'throw'   : right-click throws a projectile (see `throw` field)
//   - 'weapon'  : passive melee bonus while held (see `meleeBonus` field)
export const ITEMS = {
  [ITEM.ROTTEN_FLESH]: { name: 'Rotten Flesh', icon: 0, food: 4, purpose: 'food' },
  [ITEM.GUNPOWDER]: { name: 'Gunpowder', icon: 1, purpose: 'throw', throw: 'bomb' },
  [ITEM.BONE]: { name: 'Bone', icon: 2, purpose: 'weapon', meleeBonus: 4 },
  [ITEM.ENDER_PEARL]: { name: 'Ender Pearl', icon: 3, purpose: 'throw', throw: 'pearl' },
  [ITEM.RAW_STEAK]: { name: 'Raw Steak', icon: 4, food: 8, purpose: 'food' },
  [ITEM.RAW_CHICKEN]: { name: 'Raw Chicken', icon: 5, food: 2, purpose: 'food' },
  [ITEM.RAW_LAMB]: { name: 'Raw Lamb', icon: 6, food: 6, purpose: 'food' },
  [ITEM.STICK]: { name: 'Stick', icon: 7, purpose: 'weapon', meleeBonus: 2 },
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
