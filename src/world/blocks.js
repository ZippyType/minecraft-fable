export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  WOOD: 6,
  LEAVES: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
};

// tiles: atlas tile index per face group [top, bottom, side]
// icon: atlas tile used for the hotbar icon
export const BLOCKS = {
  [BLOCK.GRASS]: { name: 'Grass', tiles: [0, 2, 1], icon: 1 },
  [BLOCK.DIRT]: { name: 'Dirt', tiles: [2, 2, 2], icon: 2 },
  [BLOCK.STONE]: { name: 'Stone', tiles: [3, 3, 3], icon: 3 },
  [BLOCK.SAND]: { name: 'Sand', tiles: [4, 4, 4], icon: 4 },
  [BLOCK.WATER]: { name: 'Water', tiles: [5, 5, 5], icon: 5 },
  [BLOCK.WOOD]: { name: 'Wood', tiles: [7, 7, 6], icon: 6 },
  [BLOCK.LEAVES]: { name: 'Leaves', tiles: [8, 8, 8], icon: 8 },
  [BLOCK.COAL_ORE]: { name: 'Coal Ore', tiles: [9, 9, 9], icon: 9 },
  [BLOCK.IRON_ORE]: { name: 'Iron Ore', tiles: [10, 10, 10], icon: 10 },
};

// Seconds to break by hand (survival).
export const BLOCK_HARDNESS = {
  [BLOCK.GRASS]: 1.5,
  [BLOCK.DIRT]: 1.5,
  [BLOCK.SAND]: 1.2,
  [BLOCK.LEAVES]: 0.4,
  [BLOCK.WOOD]: 2.0,
  [BLOCK.STONE]: 3.0,
  [BLOCK.COAL_ORE]: 3.0,
  [BLOCK.IRON_ORE]: 3.0,
};

// Which tool class (see world/items.js) mines each block faster.
// Blocks not listed here break at hand speed no matter what is held.
const EFFECTIVE_TOOL = {
  [BLOCK.GRASS]: 'shovel',
  [BLOCK.DIRT]: 'shovel',
  [BLOCK.SAND]: 'shovel',
  [BLOCK.WOOD]: 'axe',
  [BLOCK.LEAVES]: 'axe',
  [BLOCK.STONE]: 'pickaxe',
  [BLOCK.COAL_ORE]: 'pickaxe',
  [BLOCK.IRON_ORE]: 'pickaxe',
};

export function effectiveTool(id) {
  return EFFECTIVE_TOOL[id] ?? null;
}

// Solid = collides with the player and blocks the targeting raycast.
export function isSolid(id) {
  return id !== BLOCK.AIR && id !== BLOCK.WATER;
}

export function isBreakable(id) {
  return id !== BLOCK.AIR && id !== BLOCK.WATER;
}
