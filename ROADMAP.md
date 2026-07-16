# Roadmap

This repository is a lightweight browser voxel sandbox with core terrain, inventory, crafting, mobs, and world persistence. The next phase is to expand the game with deeper survival, richer content, better systems, and a multiplayer plan.

## Current state

- Procedural 3D terrain and chunks
- Block placing, breaking, and world editing
- Inventory, hotbar, crafting, and survival mode
- Basic mobs, drops, and combat
- Save/load with chunk persistence
- Touch-friendly controls and browser-compatible rendering

## Planned game features

### Survival and progression
- Furnace / smelting system for cooking food and refining ores
- Wider food and cooking recipes
- Tool durability or tier balance for better progression
- Armor stats and equipment UI that affect damage reduction
- Weather effects, temperature, and improved hunger management
- Spawn/home / respawn mechanics with checkpoints

### Crafting and building
- Full 3x3 crafting grid and recipe book
- Functional blocks such as chests, doors, ladders, torches, and beds
- Decorative blocks like stairs, fences, windows, and colored blocks
- Mechanisms like buttons, pressure plates, and basic wiring
- Block interaction rules for furnaces, crafting tables, and other stations

### World and exploration
- Biomes with distinct terrain, plants, and resources
- Cave generation, underground structures, and dungeons
- Strongholds, temples, ruins, and other points of interest
- Water flow, falling blocks, and environmental hazard mechanics
- End portal / dimension transition mechanics

### Mobs and interactions
- Smarter mob AI with pathfinding and day/night behavior
- Passive animal breeding, taming, and utility mobs
- Boss fights or special enemies
- Better item drops, loot tables, and mob-specific rewards
- NPCs and simple quests over time

### UI / quality of life
- Recipe hints, searchable inventory, and better crafting UX
- Settings and control remapping
- Accessibility improvements for keyboard and touch
- Improved sound effects, ambient audio, and music

## Multiplayer plan

Multiplayer is a planned future expansion. It is not implemented yet.

### Goals

- Keep the client lightweight and browser-friendly
- Use a simple authoritative server model for world state
- Sync player movement, inventory, block updates, and chat
- Avoid duplicate physics/logic between client and server where possible
- Add multiplayer after the single-player foundation is stable

### Proposed architecture

1. `server/` process that maintains authoritative world state and persists changes
2. `src/network/` client-side sync layer for block updates, player state, and chat
3. Message types:
   - `join`, `leave`
   - `player_move`, `player_action`
   - `block_place`, `block_break`
   - `chat_message`
   - `inventory_update`, `health_update`
4. Server validation of block changes and combat events
5. Basic save/load on the server side

### Development approach

- Start with a minimal host/server prototype
- Keep networking separate from rendering/gameplay code
- Add multiplayer support only after core gameplay, world persistence, and input systems are stable
- Preserve the browser-based gameplay loop while syncing state through the server

## Notes

This roadmap is intentionally broad to keep future expansion flexible. The next contribution priorities are:

- richer gameplay systems
- world content and exploration
- better UX
- then multiplayer support via a basic authoritative server
