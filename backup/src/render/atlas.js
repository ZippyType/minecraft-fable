import * as THREE from 'three';

// Procedurally drawn 4x4 texture atlas of 16px tiles (no image assets needed).
const ATLAS_TILES = 4;
const TILE = 16;
const SIZE = ATLAS_TILES * TILE;

// Tile layout: 0 grass_top, 1 grass_side, 2 dirt, 3 stone, 4 sand, 5 water,
// 6 wood_side, 7 wood_top, 8 leaves, 9 coal_ore, 10 iron_ore

// UV rect [u0, v0, u1, v1] for a tile; v1 is the top of the tile image.
// Slight inset avoids sampling bleed from neighboring tiles.
export function tileUVRect(t) {
  const c = t % ATLAS_TILES;
  const r = Math.floor(t / ATLAS_TILES);
  const e = 0.25 / SIZE;
  return [
    c / ATLAS_TILES + e,
    1 - (r + 1) / ATLAS_TILES + e,
    (c + 1) / ATLAS_TILES - e,
    1 - r / ATLAS_TILES - e,
  ];
}

export function createAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const rnd = (n) => (Math.random() * 2 - 1) * n;
  const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

  function fill(t, fn) {
    const ox = (t % ATLAS_TILES) * TILE;
    const oy = Math.floor(t / ATLAS_TILES) * TILE;
    const img = ctx.createImageData(TILE, TILE);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const [r, g, b] = fn(x, y);
        const i = (y * TILE + x) * 4;
        img.data[i] = clamp255(r);
        img.data[i + 1] = clamp255(g);
        img.data[i + 2] = clamp255(b);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, ox, oy);
  }

  const stonePx = () => {
    const v = 122 + rnd(10) + (Math.random() < 0.08 ? -24 : 0);
    return [v, v, v + rnd(4)];
  };

  function oreFill(t, [or, og, ob]) {
    const spots = Array.from({ length: 5 }, () => [2 + Math.random() * 12, 2 + Math.random() * 12]);
    fill(t, (x, y) => {
      for (const [sx, sy] of spots) {
        if (Math.abs(x - sx) + Math.abs(y - sy) < 2.2) return [or + rnd(14), og + rnd(14), ob + rnd(14)];
      }
      return stonePx();
    });
  }

  fill(0, () => [95 + rnd(14), 165 + rnd(18), 65 + rnd(12)]); // grass top
  fill(1, (x, y) => {
    if (y < 3 || (y === 3 && Math.random() < 0.5)) return [95 + rnd(14), 160 + rnd(18), 62 + rnd(12)];
    return [134 + rnd(12), 96 + rnd(10), 67 + rnd(8)];
  }); // grass side
  fill(2, () => [134 + rnd(14), 96 + rnd(12), 67 + rnd(10)]); // dirt
  fill(3, stonePx); // stone
  fill(4, () => [218 + rnd(10), 203 + rnd(10), 158 + rnd(10)]); // sand
  fill(5, (x, y) => [
    40 + rnd(8),
    106 + rnd(10) + Math.sin(y * 1.3) * 8,
    196 + rnd(12) + Math.sin(y * 1.3) * 10,
  ]); // water
  fill(6, (x) => {
    const dark = x % 4 === 0;
    return [(dark ? 84 : 108) + rnd(7), (dark ? 60 : 82) + rnd(6), (dark ? 36 : 50) + rnd(5)];
  }); // wood side (bark stripes)
  fill(7, (x, y) => {
    const ring = Math.floor(Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5))) % 2 === 0;
    return [(ring ? 152 : 110) + rnd(6), (ring ? 120 : 84) + rnd(6), (ring ? 72 : 52) + rnd(5)];
  }); // wood top (rings)
  fill(8, () =>
    Math.random() < 0.14
      ? [38 + rnd(8), 88 + rnd(10), 30 + rnd(8)]
      : [58 + rnd(12), 122 + rnd(16), 42 + rnd(10)]
  ); // leaves
  oreFill(9, [42, 42, 46]); // coal
  oreFill(10, [214, 168, 128]); // iron

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  return { texture, canvas };
}
