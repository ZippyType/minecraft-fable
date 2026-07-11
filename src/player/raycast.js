import { isSolid } from '../world/blocks.js';

// Voxel DDA traversal (Amanatides & Woo). Returns the first solid block hit
// and the normal of the face that was entered, or null. Water is ignored so
// you can target blocks through/under it.
export function raycast(world, origin, dir, maxDist) {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = dir.x > 0 ? 1 : -1;
  const stepY = dir.y > 0 ? 1 : -1;
  const stepZ = dir.z > 0 ? 1 : -1;

  const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

  let tMaxX = tDeltaX === Infinity ? Infinity : (dir.x > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX;
  let tMaxY = tDeltaY === Infinity ? Infinity : (dir.y > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY;
  let tMaxZ = tDeltaZ === Infinity ? Infinity : (dir.z > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ;

  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < 256; i++) {
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      if (tMaxX > maxDist) return null;
      x += stepX;
      tMaxX += tDeltaX;
      nx = -stepX; ny = 0; nz = 0;
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > maxDist) return null;
      y += stepY;
      tMaxY += tDeltaY;
      nx = 0; ny = -stepY; nz = 0;
    } else {
      if (tMaxZ > maxDist) return null;
      z += stepZ;
      tMaxZ += tDeltaZ;
      nx = 0; ny = 0; nz = -stepZ;
    }
    const id = world.getBlock(x, y, z);
    if (isSolid(id)) return { x, y, z, nx, ny, nz, id };
  }
  return null;
}
