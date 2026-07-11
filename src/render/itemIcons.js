const TILE = 16;
const COLS = 4;
const ROWS = 5;

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

// Head colors per tool tier; handles are always wood.
const TIER = {
  wood: { face: '#b8862d', edge: '#8b6914' },
  stone: { face: '#9a9a9a', edge: '#6e6e6e' },
  iron: { face: '#e8e8e8', edge: '#a8a8a8' },
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

  // Tools: icons 8-19, one row of tiers (wood, stone, iron) per tool kind.
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
