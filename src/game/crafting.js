import { BLOCK } from '../world/blocks.js';
import { ITEM } from '../world/items.js';

// 3x3 shaped recipes: grid[row][col], 0 = empty
const RECIPES = [
  {
    grid: [
      [BLOCK.WOOD, 0, 0],
      [BLOCK.WOOD, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.STICK, count: 4 },
  },
  {
    grid: [
      [ITEM.BONE, 0, 0],
      [ITEM.BONE, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.BONE, count: 3 },
  },
  {
    grid: [
      [ITEM.GUNPOWDER, BLOCK.SAND, 0],
      [BLOCK.SAND, ITEM.GUNPOWDER, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.GUNPOWDER, count: 2 },
  },
  {
    grid: [
      [BLOCK.COAL_ORE, 0, 0],
      [BLOCK.STONE, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.STICK, count: 2 },
  },
  {
    grid: [
      [ITEM.STICK, ITEM.STICK, 0],
      [ITEM.STICK, ITEM.STICK, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.ARROW, count: 4 },
  },
  {
    grid: [
      [ITEM.STICK, ITEM.STICK, 0],
      [ITEM.STICK, ITEM.BONE, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.BOW, count: 1 },
  },
  {
    grid: [
      [ITEM.RAW_STEAK, BLOCK.COAL_ORE, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.COOKED_STEAK, count: 1 },
  },
  {
    grid: [
      [ITEM.RAW_CHICKEN, BLOCK.COAL_ORE, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.COOKED_CHICKEN, count: 1 },
  },
  {
    grid: [
      [ITEM.RAW_LAMB, BLOCK.COAL_ORE, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.COOKED_LAMB, count: 1 },
  },
  {
    grid: [
      [ITEM.LEATHER_HELMET, 0, 0],
      [ITEM.LEATHER_LEGS, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.LEATHER_CHEST, count: 1 },
  },
  {
    grid: [
      [ITEM.IRON_HELMET, 0, 0],
      [ITEM.IRON_LEGS, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.IRON_CHEST, count: 1 },
  },
  {
    grid: [
      [ITEM.DIAMOND_HELMET, 0, 0],
      [ITEM.DIAMOND_LEGS, 0, 0],
      [0, 0, 0],
    ],
    out: { id: ITEM.DIAMOND_CHEST, count: 1 },
  },
  {
    grid: [
      [ITEM.ENDER_PEARL, BLOCK.DIAMOND_ORE, 0],
      [BLOCK.COAL_ORE, ITEM.ENDER_PEARL, 0],
      [0, 0, 0],
    ],
    out: { id: BLOCK.END_PORTAL, count: 1 },
  },
  {
    grid: [
      [BLOCK.STONE, BLOCK.STONE, BLOCK.STONE],
      [BLOCK.STONE, 0, BLOCK.STONE],
      [BLOCK.STONE, BLOCK.STONE, BLOCK.STONE],
    ],
    out: { id: BLOCK.FURNACE, count: 1 },
  },
];

const TOOL_TIERS = [
  { m: BLOCK.WOOD, sword: ITEM.WOODEN_SWORD, pickaxe: ITEM.WOODEN_PICKAXE, axe: ITEM.WOODEN_AXE, shovel: ITEM.WOODEN_SHOVEL },
  { m: BLOCK.STONE, sword: ITEM.STONE_SWORD, pickaxe: ITEM.STONE_PICKAXE, axe: ITEM.STONE_AXE, shovel: ITEM.STONE_SHOVEL },
  { m: BLOCK.IRON_ORE, sword: ITEM.IRON_SWORD, pickaxe: ITEM.IRON_PICKAXE, axe: ITEM.IRON_AXE, shovel: ITEM.IRON_SHOVEL },
  { m: BLOCK.GOLD_ORE, sword: ITEM.GOLDEN_SWORD, pickaxe: ITEM.GOLDEN_PICKAXE, axe: ITEM.GOLDEN_AXE, shovel: ITEM.GOLDEN_SHOVEL },
  { m: BLOCK.DIAMOND_ORE, sword: ITEM.DIAMOND_SWORD, pickaxe: ITEM.DIAMOND_PICKAXE, axe: ITEM.DIAMOND_AXE, shovel: ITEM.DIAMOND_SHOVEL },
];

for (const { m, sword, pickaxe, axe, shovel } of TOOL_TIERS) {
  const s = ITEM.STICK;
  RECIPES.push(
    { grid: [[m, 0], [s, 0]], out: { id: sword, count: 1 } },
    { grid: [[m, m], [s, 0]], out: { id: pickaxe, count: 1 } },
    { grid: [[m, m], [m, s]], out: { id: axe, count: 1 } },
    { grid: [[m, 0], [s, s]], out: { id: shovel, count: 1 } },
  );
}

function createGrid(craftSlots) {
  const grid = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      row.push(craftSlots[r * 3 + c]?.id ?? 0);
    }
    grid.push(row);
  }
  return grid;
}

function matchGrid(craftGrid, recipeGrid, offsetRow, offsetCol) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const recipeValue = recipeGrid[r][c] ?? 0;
      const craftedRow = r + offsetRow;
      const craftedCol = c + offsetCol;
      const craftValue = craftedRow < 0 || craftedRow >= 3 || craftedCol < 0 || craftedCol >= 3
        ? 0
        : craftGrid[craftedRow][craftedCol];
      if (recipeValue !== craftValue) return false;
    }
  }
  return true;
}

function recipeBounds(recipeGrid) {
  let minR = 3, minC = 3, maxR = -1, maxC = -1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if ((recipeGrid[r][c] ?? 0) !== 0) {
        minR = Math.min(minR, r);
        minC = Math.min(minC, c);
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
      }
    }
  }
  return { minR, minC, maxR, maxC };
}

export function matchRecipe(craftSlots) {
  const craftGrid = createGrid(craftSlots);
  for (const recipe of RECIPES) {
    const { minR, minC, maxR, maxC } = recipeBounds(recipe.grid);
    if (maxR < 0) continue;
    const height = maxR - minR + 1;
    const width = maxC - minC + 1;
    for (let offsetR = 0; offsetR <= 3 - height; offsetR++) {
      for (let offsetC = 0; offsetC <= 3 - width; offsetC++) {
        if (matchGrid(craftGrid, recipe.grid, offsetR - minR, offsetC - minC)) {
          return recipe.out;
        }
      }
    }
  }
  return null;
}

export function consumeRecipe(craftSlots) {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const s = craftSlots[i];
    if (!s) continue;
    s.count -= 1;
    if (s.count <= 0) craftSlots[i] = null;
  }
}
