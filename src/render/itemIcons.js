const TILE = 16;
const COLS = 8;
const ROWS = 7;

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

const TIER = {
  wood: { face: '#b8862d', edge: '#8b6914' },
  stone: { face: '#9a9a9a', edge: '#6e6e6e' },
  iron: { face: '#e8e8e8', edge: '#a8a8a8' },
  gold: { face: '#ffd700', edge: '#daa520' },
  diamond: { face: '#40e0d0', edge: '#20b2aa' },
};
const HANDLE = '#8b5a2b';

function sword(c, t) {
  px(c, 7, 1, 2, 9, t.face);
  px(c, 8, 1, 1, 9, t.edge);
  px(c, 5, 10, 6, 2, '#4a3520');
  px(c, 7, 12, 2, 3, HANDLE);
}

function pickaxe(c, t) {
  px(c, 3, 2, 10, 2, t.face);
  px(c, 3, 4, 2, 3, t.edge);
  px(c, 11, 4, 2, 3, t.edge);
  px(c, 7, 4, 2, 10, HANDLE);
}

function axe(c, t) {
  px(c, 4, 1, 6, 3, t.face);
  px(c, 4, 4, 4, 3, t.edge);
  px(c, 8, 4, 2, 11, HANDLE);
}

function shovel(c, t) {
  px(c, 7, 1, 2, 8, HANDLE);
  px(c, 5, 9, 6, 4, t.face);
  px(c, 6, 13, 4, 2, t.edge);
}

function helmet(c, base, trim) {
  px(c, 4, 5, 8, 6, base);
  px(c, 5, 4, 6, 2, base);
  px(c, 3, 6, 10, 3, trim);
  px(c, 6, 8, 4, 2, trim);
}

function chestplate(c, base, trim) {
  px(c, 4, 3, 8, 10, base);
  px(c, 3, 4, 2, 8, trim);
  px(c, 11, 4, 2, 8, trim);
  px(c, 5, 5, 6, 2, trim);
  px(c, 6, 7, 4, 4, base);
}

function leggings(c, base, trim) {
  px(c, 4, 2, 8, 4, base);
  px(c, 4, 6, 3, 8, base);
  px(c, 9, 6, 3, 8, base);
  px(c, 3, 2, 10, 2, trim);
  px(c, 4, 6, 1, 2, trim);
  px(c, 11, 6, 1, 2, trim);
}

function boots(c, base, trim) {
  px(c, 4, 5, 8, 4, base);
  px(c, 3, 9, 10, 4, trim);
  px(c, 3, 11, 2, 2, base);
  px(c, 11, 11, 2, 2, base);
}

export function createItemIcons() {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  const ctx = canvas.getContext('2d');

  const draw = (icon, fn) => {
    const ox = (icon % COLS) * TILE;
    const oy = Math.floor(icon / COLS) * TILE;
    ctx.save();
    ctx.translate(ox, oy);
    fn(ctx);
    ctx.restore();
  };

  draw(0, (c) => {
    px(c, 4, 5, 8, 7, '#6b4a3a');
    px(c, 5, 6, 6, 5, '#8a5a4a');
    px(c, 6, 8, 2, 2, '#5a3828');
  });
  draw(1, (c) => {
    px(c, 5, 4, 6, 8, '#3a3a3a');
    px(c, 6, 5, 4, 6, '#4a4a4a');
    px(c, 7, 10, 2, 2, '#2a2a2a');
  });
  draw(2, (c) => {
    px(c, 7, 3, 2, 10, '#e8e0d0');
    px(c, 5, 6, 2, 2, '#e8e0d0');
    px(c, 9, 8, 2, 2, '#e8e0d0');
  });
  draw(3, (c) => {
    px(c, 5, 5, 6, 6, '#3ad4c0');
    px(c, 6, 6, 4, 4, '#5ce8d8');
    px(c, 7, 7, 2, 2, '#9ffff0');
  });
  draw(4, (c) => {
    px(c, 4, 7, 8, 4, '#8b3030');
    px(c, 5, 5, 6, 3, '#a04040');
    px(c, 6, 6, 4, 2, '#c05050');
  });
  draw(5, (c) => {
    px(c, 5, 6, 6, 5, '#f0e8d8');
    px(c, 6, 4, 4, 3, '#f0e8d8');
    px(c, 7, 5, 2, 1, '#e8a020');
  });
  draw(6, (c) => {
    px(c, 4, 6, 8, 5, '#e8e8e8');
    px(c, 5, 5, 6, 2, '#d8d8d8');
    px(c, 6, 7, 4, 3, '#f0f0f0');
  });
  draw(7, (c) => {
    px(c, 7, 3, 2, 12, '#8b6914');
    px(c, 6, 4, 4, 10, '#a08020');
  });

  draw(8, (c) => sword(c, TIER.wood));
  draw(9, (c) => sword(c, TIER.stone));
  draw(10, (c) => sword(c, TIER.iron));
  draw(11, (c) => pickaxe(c, TIER.wood));
  draw(12, (c) => pickaxe(c, TIER.stone));
  draw(13, (c) => pickaxe(c, TIER.iron));
  draw(14, (c) => axe(c, TIER.wood));
  draw(15, (c) => axe(c, TIER.stone));
  draw(16, (c) => axe(c, TIER.iron));
  draw(17, (c) => shovel(c, TIER.wood));
  draw(18, (c) => shovel(c, TIER.stone));
  draw(19, (c) => shovel(c, TIER.iron));

  draw(20, (c) => {
    px(c, 7, 2, 2, 11, '#8b6914');
    px(c, 6, 3, 4, 9, '#a08020');
    px(c, 6, 1, 4, 3, '#b0b0b0');
    px(c, 7, 0, 2, 2, '#8a8a8a');
  });
  draw(21, (c) => {
    px(c, 5, 2, 2, 12, '#8b6914');
    px(c, 4, 3, 2, 10, '#a08020');
    px(c, 3, 5, 1, 6, '#a08020');
    px(c, 7, 2, 1, 12, '#d8d0c0');
  });

  draw(22, (c) => sword(c, TIER.gold));
  draw(23, (c) => pickaxe(c, TIER.gold));
  draw(24, (c) => axe(c, TIER.gold));
  draw(25, (c) => shovel(c, TIER.gold));
  draw(26, (c) => sword(c, TIER.diamond));
  draw(27, (c) => pickaxe(c, TIER.diamond));
  draw(28, (c) => axe(c, TIER.diamond));
  draw(29, (c) => shovel(c, TIER.diamond));

  draw(30, (c) => {
    px(c, 4, 4, 8, 9, '#cc2222');
    px(c, 5, 5, 6, 7, '#ee3333');
    px(c, 4, 7, 8, 2, '#f0f0f0');
    px(c, 5, 11, 6, 2, '#aa1111');
  });
  draw(31, (c) => {
    px(c, 5, 3, 6, 10, '#a8a8a8');
    px(c, 4, 4, 8, 8, '#c0c0c0');
    px(c, 6, 4, 4, 2, '#d8d8d8');
    px(c, 5, 12, 6, 2, '#8b6914');
    px(c, 7, 2, 2, 2, '#8b6914');
  });

  const LEATHER = { base: '#8b5a2b', trim: '#6b4a1b' };
  const IRON_ARMOR = { base: '#d8d8d8', trim: '#a8a8a8' };
  const DIAMOND_ARMOR = { base: '#40e0d0', trim: '#20b2aa' };

  draw(32, (c) => helmet(c, LEATHER.base, LEATHER.trim));
  draw(33, (c) => chestplate(c, LEATHER.base, LEATHER.trim));
  draw(34, (c) => leggings(c, LEATHER.base, LEATHER.trim));
  draw(35, (c) => boots(c, LEATHER.base, LEATHER.trim));
  draw(36, (c) => helmet(c, IRON_ARMOR.base, IRON_ARMOR.trim));
  draw(37, (c) => chestplate(c, IRON_ARMOR.base, IRON_ARMOR.trim));
  draw(38, (c) => leggings(c, IRON_ARMOR.base, IRON_ARMOR.trim));
  draw(39, (c) => boots(c, IRON_ARMOR.base, IRON_ARMOR.trim));
  draw(40, (c) => helmet(c, DIAMOND_ARMOR.base, DIAMOND_ARMOR.trim));
  draw(41, (c) => chestplate(c, DIAMOND_ARMOR.base, DIAMOND_ARMOR.trim));
  draw(42, (c) => leggings(c, DIAMOND_ARMOR.base, DIAMOND_ARMOR.trim));
  draw(43, (c) => boots(c, DIAMOND_ARMOR.base, DIAMOND_ARMOR.trim));

  draw(44, (c) => {
    px(c, 4, 6, 8, 5, '#6b3030');
    px(c, 5, 4, 6, 3, '#7a3838');
    px(c, 6, 5, 4, 2, '#8a4545');
  });
  draw(45, (c) => {
    px(c, 5, 6, 6, 5, '#d8c8a8');
    px(c, 6, 4, 4, 3, '#d8c8a8');
    px(c, 7, 5, 2, 1, '#c8a020');
  });
  draw(46, (c) => {
    px(c, 4, 6, 8, 5, '#b0a8a0');
    px(c, 5, 5, 6, 2, '#a0a0a0');
    px(c, 6, 7, 4, 3, '#c0b8b0');
  });

  draw(47, (c) => {
    px(c, 5, 5, 6, 6, '#ffd700');
    px(c, 6, 6, 4, 4, '#ffe44d');
    px(c, 7, 7, 2, 2, '#fff580');
  });
  draw(48, (c) => {
    px(c, 5, 5, 6, 6, '#40e0d0');
    px(c, 6, 6, 4, 4, '#5ce8d8');
    px(c, 7, 7, 2, 2, '#9ffff0');
  });

  return canvas;
}

export function drawItemIcon(destCtx, itemCanvas, icon, size = 40) {
  destCtx.imageSmoothingEnabled = false;
  destCtx.drawImage(
    itemCanvas,
    (icon % COLS) * TILE,
    Math.floor(icon / COLS) * TILE,
    TILE,
    TILE,
    0,
    0,
    size,
    size
  );
}
