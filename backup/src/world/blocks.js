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

// Solid = collides with the player and blocks the targeting raycast.
export function isSolid(id) {
  return id !== BLOCK.AIR && id !== BLOCK.WATER;
}
