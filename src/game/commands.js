import { GAMEMODE } from './gamemode.js';
import { MOB } from '../entities/mobTypes.js';
import { BLOCK, BLOCKS } from '../world/blocks.js';
import { ITEM, ITEMS, isBlock } from '../world/items.js';

const SPAWN_MAP = {
  zombie: MOB.ZOMBIE,
  creeper: MOB.CREEPER,
  skeleton: MOB.SKELETON,
  enderman: MOB.ENDERMAN,
  sheep: MOB.SHEEP,
  chicken: MOB.CHICKEN,
  cow: MOB.COW,
};

// Build a name -> id lookup so /give can accept friendly names like
// "stone", "dirt", "gunpowder", "ender_pearl", etc.
const NAME_TO_ID = (() => {
  const map = {};
  const add = (id, def) => {
    if (!def) return;
    const base = def.name.toLowerCase().replace(/\s+/g, '_');
    map[base] = id;
    // Also accept no-separator variant ("enderpearl").
    map[base.replace(/_/g, '')] = id;
  };
  for (const k of Object.keys(BLOCKS)) {
    const id = Number(k);
    if (id === BLOCK.AIR) continue;
    add(id, BLOCKS[id]);
  }
  for (const k of Object.keys(ITEMS)) {
    const id = Number(k);
    add(id, ITEMS[id]);
  }
  return map;
})();

export function listGiveNames() {
  return Object.keys(NAME_TO_ID).filter((n) => n.includes('_') || n.length > 4).slice(0, 24);
}

export function runCommand(line, ctx) {
  const text = line.trim();
  if (!text.startsWith('/')) return 'Commands start with /';

  // Keep the original case for item names so /give Rotten_Flesh works too.
  const lower = text.slice(1).toLowerCase();
  const parts = lower.split(/\s+/);
  const cmd = parts[0];

  if (cmd === 'time' && parts[1] === 'set') {
    const preset = parts[2];
    if (!['day', 'afternoon', 'night', 'midnight'].includes(preset)) {
      return 'Unknown time. Use: day, afternoon, night, midnight';
    }
    ctx.sky.setTimePreset(preset);
    return `Time set to ${preset}`;
  }

  if (cmd === 'spawn') {
    const type = parts[1];
    const mob = SPAWN_MAP[type];
    if (!mob) return `Unknown mob. Try: ${Object.keys(SPAWN_MAP).join(', ')}`;
    ctx.mobs.spawnNearPlayer(ctx.player, mob, ctx.lookDir);
    return `Spawned ${type}`;
  }

  if (cmd === 'gamemode' || cmd === 'gm') {
    const mode = parts[1];
    if (mode === 'creative' || mode === 'c' || mode === '1') {
      ctx.setGamemode(GAMEMODE.CREATIVE);
      return 'Gamemode set to Creative';
    }
    if (mode === 'survival' || mode === 's' || mode === '0') {
      ctx.setGamemode(GAMEMODE.SURVIVAL);
      return 'Gamemode set to Survival';
    }
    return 'Use: /gamemode creative or /gamemode survival';
  }

  if (cmd === 'creative' || cmd === 'c') {
    ctx.setGamemode(GAMEMODE.CREATIVE);
    return 'Gamemode set to Creative';
  }

  if (cmd === 'survival' || cmd === 's') {
    ctx.setGamemode(GAMEMODE.SURVIVAL);
    return 'Gamemode set to Survival';
  }

  if (cmd === 'give') {
    if (!ctx.inventory) return 'Give not available here.';
    const itemName = parts[1];
    if (!itemName) return 'Usage: /give <item> [count]   |   e.g. /give stone 32';
    const id = NAME_TO_ID[itemName];
    if (id === undefined) {
      return `Unknown item: ${itemName}. Try: ${listGiveNames().join(', ')}`;
    }
    let count = 1;
    if (parts[2]) {
      const n = parseInt(parts[2], 10);
      if (!Number.isFinite(n) || n < 1) return 'Count must be a positive number.';
      count = Math.min(64, n);
    }
    const added = ctx.inventory.addItem(id, count);
    ctx.hud?.refresh();
    ctx.hud?.refreshSelectedName?.();
    const defName = isBlock(id) ? BLOCKS[id]?.name : ITEMS[id]?.name;
    if (added < count) {
      return `Inventory full — gave ${added} of ${defName}`;
    }
    return `Gave ${count} ${defName}`;
  }

  if (cmd === 'touch') {
    if (!ctx.settings) return 'Touch controls not available here.';
    const arg = parts[1];
    if (arg === 'on' || arg === 'off' || arg === 'auto') {
      ctx.settings.set('touchMode', arg);
      return `Touch controls: ${arg}`;
    }
    return 'Usage: /touch on|off|auto';
  }

  if (cmd === 'reset') {
    if (!ctx.resetWorld) return 'Reset not available here.';
    if (parts[1] !== 'confirm') return 'This wipes the saved world! Type /reset confirm';
    ctx.resetWorld();
    return 'Resetting world…';
  }

  if (cmd === 'recipes') {
    return (
      'Tools use wood / stone / iron ore (m) + sticks (s) in the 2x2 grid: ' +
      'sword = m over s. pickaxe = m m top, s bottom-left. ' +
      'axe = m m top, m s bottom. shovel = m top-left, s s bottom. ' +
      'Sticks: 2 wood stacked vertically.'
    );
  }

  if (cmd === 'help') {
    return 'Commands: /give <item> [count], /gamemode <mode>, /time set <day|night>, /spawn <mob>, /recipes, /touch on|off|auto, /reset';
  }

  return `Unknown command: /${cmd}. Try /help`;
}
