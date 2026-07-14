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
  GOLD_ORE: 11,
  DIAMOND_ORE: 12,
  BEDROCK: 13,
  GRAVEL: 14,
  SNOW: 15,
  CACTUS: 16,
  TNT: 17,
  PLANKS: 18,
  GLASS: 19,
  BRICK: 20,
  CRAFTING_TABLE: 21,
  FURNACE: 22,
  END_PORTAL: 23,
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
  [BLOCK.GOLD_ORE]: { name: 'Gold Ore', tiles: [11, 11, 11], icon: 11 },
  [BLOCK.DIAMOND_ORE]: { name: 'Diamond Ore', tiles: [12, 12, 12], icon: 12 },
  [BLOCK.BEDROCK]: { name: 'Bedrock', tiles: [13, 13, 13], icon: 13 },
  [BLOCK.GRAVEL]: { name: 'Gravel', tiles: [14, 14, 14], icon: 14 },
  [BLOCK.SNOW]: { name: 'Snow', tiles: [15, 15, 15], icon: 15 },
  [BLOCK.CACTUS]: { name: 'Cactus', tiles: [17, 17, 16], icon: 16 },
  [BLOCK.TNT]: { name: 'TNT', tiles: [19, 19, 18], icon: 18 },
  [BLOCK.PLANKS]: { name: 'Planks', tiles: [20, 20, 20], icon: 20 },
  [BLOCK.GLASS]: { name: 'Glass', tiles: [21, 21, 21], icon: 21 },
  [BLOCK.BRICK]: { name: 'Brick', tiles: [22, 22, 22], icon: 22 },
  [BLOCK.CRAFTING_TABLE]: { name: 'Crafting Table', tiles: [23, 23, 24], icon: 23 },
  [BLOCK.FURNACE]: { name: 'Furnace', tiles: [25, 25, 26], icon: 26 },
  [BLOCK.END_PORTAL]: { name: 'End Portal', tiles: [27, 27, 27], icon: 27 },
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
  [BLOCK.GOLD_ORE]: 3.0,
  [BLOCK.DIAMOND_ORE]: 3.0,
  [BLOCK.BEDROCK]: 999,
  [BLOCK.GRAVEL]: 0.6,
  [BLOCK.SNOW]: 0.2,
  [BLOCK.CACTUS]: 0.4,
  [BLOCK.TNT]: 0.0,
  [BLOCK.PLANKS]: 2.0,
  [BLOCK.GLASS]: 0.3,
  [BLOCK.BRICK]: 2.0,
  [BLOCK.CRAFTING_TABLE]: 2.0,
  [BLOCK.FURNACE]: 3.5,
  [BLOCK.END_PORTAL]: 999,
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
  [BLOCK.GOLD_ORE]: 'pickaxe',
  [BLOCK.DIAMOND_ORE]: 'pickaxe',
  [BLOCK.GRAVEL]: 'shovel',
  [BLOCK.SNOW]: 'shovel',
};

export function effectiveTool(id) {
  return EFFECTIVE_TOOL[id] ?? null;
}

// Solid = collides with the player and blocks the targeting raycast.
export function isSolid(id) {
  return id !== BLOCK.AIR && id !== BLOCK.WATER;
}

export function isBreakable(id) {
  return id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.BEDROCK && id !== BLOCK.END_PORTAL;
}

export function isTransparent(id) {
  return id === BLOCK.AIR || id === BLOCK.WATER || id === BLOCK.GLASS || id === BLOCK.LEAVES;
}
