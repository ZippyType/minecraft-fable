# Minecraft Fable

A lightweight browser voxel game built with Three.js and Vite.

## Overview

`minecraft-fable` is a small procedural block sandbox inspired by Minecraft. It includes:

- 3D block terrain generated with noise
- An interactive hotbar and inventory UI
- Crafting, survival, and creative mode support
- Item dropping, mobs, and player interaction
- Pixelated block textures drawn procedurally

## Getting Started

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the URL printed by Vite in your browser.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Controls

- `WASD` — move
- `Space` — jump
- `Shift` — sprint
- `Left click` — break / attack
- `Right click` — place / interact
- `E` — open/close inventory
- `T` — open chat
- `1`–`9` — select hotbar slot

## Project Structure

- `src/main.js` — application entry point
- `src/render/` — rendering utilities and atlas generation
- `src/world/` — terrain, block, and world logic
- `src/player/` — player, input, and inventory systems
- `src/ui/` — HUD, chat, settings, and touch controls
- `src/game/` — crafting, save/load, commands, settings, and gamemode logic
- `src/entities/` — drops and mobs

## Notes

- Textures are generated procedurally, so the game does not rely on external image assets.
- The inventory and hotbar UI are fully interactive for both mouse and touch.
- Creative mode fills the inventory with all available blocks and items.

## License

This project is currently private and configured as a local development sandbox.
