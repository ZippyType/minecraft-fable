import * as THREE from 'three';

// Procedurally drawn 8x8 texture atlas of 16px tiles (no image assets needed).
const ATLAS_TILES = 8;
const TILE = 16;
const SIZE = ATLAS_TILES * TILE;

// Tile layout: 0 grass_top, 1 grass_side, 2 dirt, 3 stone, 4 sand, 5 water,
// 6 wood_side, 7 wood_top, 8 leaves, 9 coal_ore, 10 iron_ore,
// 11 gold_ore, 12 diamond_ore, 13 bedrock, 14 gravel, 15 snow,
// 16 cactus_side, 17 cactus_top, 18 tnt_side, 19 tnt_top,
// 20 planks, 21 glass, 22 brick, 23 crafting_table_top,
// 24 crafting_table_side, 25 furnace_front, 26 furnace_side

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
  oreFill(11, [230, 200, 40]); // gold
  oreFill(12, [60, 210, 220]); // diamond

  fill(13, (x, y) => {
    const v = 40 + rnd(18) + (Math.random() < 0.12 ? -20 : 0);
    return [v, v, v];
  }); // bedrock

  fill(14, (x, y) => {
    const v = 120 + rnd(22);
    return [v + 4, v, v - 6];
  }); // gravel

  fill(15, () => [240 + rnd(8), 244 + rnd(8), 255 + rnd(4)]); // snow

  fill(16, (x, y) => {
    const stripe = x % 4 === 0;
    const dark = Math.random() < 0.06;
    return [
      (dark ? 30 : 50) + rnd(10),
      (stripe ? 110 : 140) + rnd(14),
      (dark ? 20 : 36) + rnd(8),
    ];
  }); // cactus side

  fill(17, (x, y) => {
    const dx = x - 7.5, dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 5.5
      ? [50 + rnd(12), 130 + rnd(16), 40 + rnd(10)]
      : [40 + rnd(10), 110 + rnd(12), 30 + rnd(8)];
  }); // cactus top

  fill(18, (x, y) => {
    const stripe = y >= 5 && y <= 10;
    return stripe
      ? [220 + rnd(10), 220 + rnd(10), 220 + rnd(10)]
      : [180 + rnd(16), 40 + rnd(12), 30 + rnd(10)];
  }); // tnt side

  fill(19, (x, y) => {
    const cross = (x >= 6 && x <= 9) || (y >= 6 && y <= 9);
    return cross
      ? [230 + rnd(12), 210 + rnd(12), 40 + rnd(10)]
      : [180 + rnd(14), 42 + rnd(12), 32 + rnd(10)];
  }); // tnt top

  fill(20, (x, y) => {
    const line = y % 4 === 0;
    return line
      ? [140 + rnd(10), 108 + rnd(8), 62 + rnd(6)]
      : [170 + rnd(12), 130 + rnd(10), 72 + rnd(8)];
  }); // planks

  fill(21, (x, y) => {
    const edge = x === 0 || y === 0 || x === 15 || y === 15;
    return edge
      ? [180 + rnd(8), 210 + rnd(8), 225 + rnd(6)]
      : [200 + rnd(6), 228 + rnd(6), 240 + rnd(4)];
  }); // glass

  fill(22, (x, y) => {
    const mx = x % 8, my = y % 4;
    const mortar = mx === 0 || my === 0;
    const offset = Math.floor(y / 4) % 2 === 0 ? 0 : 4;
    const mx2 = (x + offset) % 8;
    const mortar2 = mx2 === 0 || my === 0;
    return mortar2
      ? [160 + rnd(10), 156 + rnd(10), 148 + rnd(8)]
      : [165 + rnd(16), 55 + rnd(12), 42 + rnd(10)];
  }); // brick

  fill(23, (x, y) => {
    const line = x % 4 === 0 || y % 4 === 0;
    return line
      ? [120 + rnd(8), 88 + rnd(6), 52 + rnd(5)]
      : [150 + rnd(10), 112 + rnd(8), 64 + rnd(6)];
  }); // crafting table top

  fill(24, (x, y) => {
    const dark = x % 4 === 0 || (x >= 6 && x <= 9 && y >= 4 && y <= 11);
    return dark
      ? [84 + rnd(8), 62 + rnd(6), 36 + rnd(5)]
      : [108 + rnd(10), 82 + rnd(8), 50 + rnd(6)];
  }); // crafting table side

  fill(25, (x, y) => {
    const opening = x >= 4 && x <= 11 && y >= 5 && y <= 12;
    return opening
      ? [30 + rnd(10), 28 + rnd(10), 26 + rnd(8)]
      : stonePx();
  }); // furnace front

  fill(26, stonePx); // furnace side

  fill(27, (x, y) => {
    const star = Math.random() < 0.06;
    return star
      ? [160 + rnd(50), 120 + rnd(50), 200 + rnd(55)]
      : [12 + rnd(10), 6 + rnd(8), 24 + rnd(14)];
  }); // end portal

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  return { texture, canvas };
}
