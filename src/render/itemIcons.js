const TILE = 16;
const COLS = 4;

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

export function createItemIcons() {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE;
  canvas.height = TILE * 2;
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
