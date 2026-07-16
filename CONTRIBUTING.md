# Contributing

Thanks for your interest in contributing to VoxelCraft.

## What to work on

This is a browser-based voxel sandbox with a working single-player foundation. The most useful contributions are:

- adding new blocks, items, and recipes
- improving block interaction and game systems
- expanding terrain generation and world structures
- making the UI more usable on desktop and mobile
- enhancing mob behavior and loot
- adding quality-of-life systems like better crafting, inventory search, or save/load improvements

## Multiplayer plan

A basic multiplayer server would be a great future addition.

### Why a server would help

- it can keep authoritative world state
- it can synchronize players, chat, and block updates
- it makes cooperative play possible without duplicating game logic in the browser

### What to build first

- a server. (All servers are OK, even with bad specs!)
- a wire protocol for `join`, `leave`, `player_move`, `block_place`, `block_break`, and `chat` messages
- server-side persistence for edited chunks
- client messaging from the browser to the server

## How to contribute

1. Fork the repo and create a feature branch.
2. Make small, focused changes.
3. Open a pull request with a clear description of what changed and why.
4. If you add new items, blocks, or commands, update the relevant docs and tests.

## Notes

Don’t add multiplayer support yet. Focus first on improving the single-player experience and the game systems that multiplayer can later reuse.
