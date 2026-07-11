import { BLOCK } from '../world/blocks.js';
import { ITEM } from '../world/items.js';

// 2x2 shaped recipes: grid[row][col], 0 = empty
const RECIPES = [
  {
    grid: [
      [BLOCK.WOOD, 0],
      [BLOCK.WOOD, 0],
    ],
    out: { id: ITEM.STICK, count: 4 },
  },
  {
    grid: [
      [ITEM.BONE, 0],
      [ITEM.BONE, 0],
    ],
    out: { id: ITEM.BONE, count: 3 },
  },
  {
    grid: [
      [ITEM.GUNPOWDER, BLOCK.SAND],
      [BLOCK.SAND, ITEM.GUNPOWDER],
    ],
    out: { id: ITEM.GUNPOWDER, count: 2 },
  },
  {
    grid: [
      [BLOCK.COAL_ORE, 0],
      [BLOCK.STONE, 0],
    ],
    out: { id: ITEM.STICK, count: 2 },
  },
];

function matchGrid(craft, recipe) {
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const a = craft[r * 2 + c]?.id ?? 0;
      const b = recipe.grid[r][c] ?? 0;
      if (a !== b) return false;
    }
  }
  return true;
}

export function matchRecipe(craftSlots) {
  for (const recipe of RECIPES) {
    if (matchGrid(craftSlots, recipe)) return recipe.out;
  }
  return null;
}

export function consumeRecipe(craftSlots) {
  for (let i = 0; i < 4; i++) {
    const s = craftSlots[i];
    if (!s) continue;
    s.count -= 1;
    if (s.count <= 0) craftSlots[i] = null;
  }
}
