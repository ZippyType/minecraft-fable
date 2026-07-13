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
  {
    grid: [
      [ITEM.STICK, ITEM.STICK],
      [ITEM.STICK, ITEM.STICK],
    ],
    out: { id: ITEM.ARROW, count: 4 },
  },
  {
    grid: [
      [ITEM.STICK, ITEM.STICK],
      [ITEM.STICK, ITEM.BONE],
    ],
    out: { id: ITEM.BOW, count: 1 },
  },
  {
    grid: [
      [ITEM.RAW_STEAK, BLOCK.COAL_ORE],
      [0, 0],
    ],
    out: { id: ITEM.COOKED_STEAK, count: 1 },
  },
  {
    grid: [
      [ITEM.RAW_CHICKEN, BLOCK.COAL_ORE],
      [0, 0],
    ],
    out: { id: ITEM.COOKED_CHICKEN, count: 1 },
  },
  {
    grid: [
      [ITEM.RAW_LAMB, BLOCK.COAL_ORE],
      [0, 0],
    ],
    out: { id: ITEM.COOKED_LAMB, count: 1 },
  },
  {
    grid: [
      [ITEM.LEATHER_HELMET, 0],
      [ITEM.LEATHER_LEGS, 0],
    ],
    out: { id: ITEM.LEATHER_CHEST, count: 1 },
  },
  {
    grid: [
      [ITEM.IRON_HELMET, 0],
      [ITEM.IRON_LEGS, 0],
    ],
    out: { id: ITEM.IRON_CHEST, count: 1 },
  },
  {
    grid: [
      [ITEM.DIAMOND_HELMET, 0],
      [ITEM.DIAMOND_LEGS, 0],
    ],
    out: { id: ITEM.DIAMOND_CHEST, count: 1 },
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
