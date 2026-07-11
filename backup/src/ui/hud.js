import { BLOCKS } from '../world/blocks.js';

function el(tag, className) {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

export class HUD {
  constructor(atlasCanvas, hotbarIds) {
    this.hotbarIds = hotbarIds;
    this.selected = 0;

    const root = el('div', 'hud');
    this.crosshair = el('div', 'crosshair');
    this.debug = el('div', 'debug');

    this.hotbar = el('div', 'hotbar');
    this.slots = hotbarIds.map((id, i) => {
      const slot = el('div', 'slot');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 40;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const icon = BLOCKS[id].icon;
      ctx.drawImage(atlasCanvas, (icon % 4) * 16, Math.floor(icon / 4) * 16, 16, 16, 0, 0, 40, 40);
      slot.appendChild(canvas);
      const num = el('span', 'num');
      num.textContent = i + 1;
      slot.appendChild(num);
      slot.title = BLOCKS[id].name;
      this.hotbar.appendChild(slot);
      return slot;
    });

    this.overlay = el('div', 'overlay');
    this.overlay.innerHTML = `
      <div class="panel">
        <h1>VoxelCraft</h1>
        <p class="sub">A tiny Minecraft-style world</p>
        <ul>
          <li><b>WASD</b> move &nbsp; <b>Space</b> jump / swim &nbsp; <b>Shift</b> sprint</li>
          <li><b>Left click</b> break &nbsp; <b>Right click</b> place</li>
          <li><b>1–9 / wheel</b> select block &nbsp; <b>F</b> toggle fly</li>
          <li><b>Esc</b> release the mouse</li>
        </ul>
        <p class="cta">Click to play</p>
      </div>`;

    root.append(this.crosshair, this.hotbar, this.debug, this.overlay);
    document.body.appendChild(root);
    this.setSelected(0);
  }

  onStart(cb) {
    this.overlay.addEventListener('click', cb);
  }

  showOverlay(title) {
    this.overlay.querySelector('h1').textContent = title;
    this.overlay.querySelector('.cta').textContent = 'Click to resume';
    this.overlay.style.display = 'flex';
  }

  hideOverlay() {
    this.overlay.style.display = 'none';
  }

  setSelected(i) {
    this.selected = i;
    this.slots.forEach((slot, j) => slot.classList.toggle('selected', i === j));
  }

  selectedBlock() {
    return this.hotbarIds[this.selected];
  }

  updateDebug(text) {
    this.debug.textContent = text;
  }
}
