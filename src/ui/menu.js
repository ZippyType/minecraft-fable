import { Settings } from '../game/settings.js';

const SKINS = [
  { name: 'Steve', hair: '#4a2a0a', skin: '#c69c6d', shirt: '#00aadb', pants: '#3b3b98', shoes: '#3b3b98' },
  { name: 'Alex', hair: '#b87820', skin: '#d8a068', shirt: '#58a048', pants: '#3b3b98', shoes: '#6b4a2a' },
  { name: 'Zombie', hair: '#2a5a1a', skin: '#5a8f4a', shirt: '#3a4a5a', pants: '#2a3a6a', shoes: '#2a3a6a' },
  { name: 'Skeleton', hair: '#d8d8c8', skin: '#d8d8c8', shirt: '#c8c8b8', pants: '#d0d0c0', shoes: '#b8b8a8' },
  { name: 'Enderman', hair: '#121018', skin: '#121018', shirt: '#1a1828', pants: '#121018', shoes: '#121018' },
  { name: 'Herobrine', hair: '#4a2a0a', skin: '#c69c6d', shirt: '#00aadb', pants: '#3b3b98', shoes: '#3b3b98' },
];

const SPLASHES = [
  'Also try Terraria!',
  '100% pure JavaScript!',
  'Now with more blocks!',
  'Woo, voxel!',
  'Minecraft-ish!',
  'Pixelated!',
  'Breaking blocks since 2024!',
  'As seen on GitHub!',
  'Made with Three.js!',
  'Contains no cows!',
  'Infinite worlds!',
  'Procedural!',
  'Open source!',
  'Touch-friendly!',
  'Free to play!',
  'Not a real Minecraft!',
];

export { SKINS };

function drawSkinPreview(ctx, skin, size) {
  size = size || 48;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = skin.skin;
  ctx.fillRect(size * 0.3, 0, size * 0.4, size * 0.3);
  ctx.fillStyle = skin.hair;
  ctx.fillRect(size * 0.3, 0, size * 0.4, size * 0.08);
  ctx.fillStyle = skin.shirt;
  ctx.fillRect(size * 0.35, size * 0.3, size * 0.3, size * 0.35);
  ctx.fillRect(size * 0.2, size * 0.3, size * 0.12, size * 0.3);
  ctx.fillRect(size * 0.68, size * 0.3, size * 0.12, size * 0.3);
  ctx.fillStyle = skin.pants;
  ctx.fillRect(size * 0.35, size * 0.65, size * 0.13, size * 0.35);
  ctx.fillRect(size * 0.52, size * 0.65, size * 0.13, size * 0.35);
  ctx.fillStyle = '#fff';
  ctx.fillRect(size * 0.38, size * 0.1, size * 0.08, size * 0.06);
  ctx.fillRect(size * 0.54, size * 0.1, size * 0.08, size * 0.06);
  ctx.fillStyle = '#000';
  ctx.fillRect(size * 0.4, size * 0.11, size * 0.04, size * 0.04);
  ctx.fillRect(size * 0.56, size * 0.11, size * 0.04, size * 0.04);
}

function createDirtTexture() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  const imgData = ctx.createImageData(16, 16);
  const d = imgData.data;
  const base = [134, 96, 67];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4;
      const v = (Math.random() * 30 - 15) | 0;
      d[i] = Math.max(0, Math.min(255, base[0] + v + ((y % 4 < 2) ? -5 : 5)));
      d[i + 1] = Math.max(0, Math.min(255, base[1] + v + ((x % 3 === 0) ? -8 : 0)));
      d[i + 2] = Math.max(0, Math.min(255, base[2] + v));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return c.toDataURL();
}

export class MainMenu {
  constructor(root, onPlay) {
    this.root = root;
    this.onPlay = onPlay;
    this.settings = new Settings();
    this.currentScreen = 'title';
    this.selectedMode = 'survival';
    this.selectedSkin = this.settings.selectedSkin || 0;
    this.selectedWorld = null;
    this._build();
    this._bindEvents();
  }

  _build() {
    const splash = SPLASHES[(Math.random() * SPLASHES.length) | 0];
    const dirtUrl = createDirtTexture();

    this.el = document.createElement('div');
    this.el.className = 'menu';
    this.el.style.backgroundImage = `url(${dirtUrl})`;
    this.el.style.backgroundRepeat = 'repeat';
    this.el.innerHTML = `
      <div class="menu-bg-overlay"></div>
      <div class="menu-content">
        <div class="menu-logo-area">
          <div class="menu-title">VoxelCraft</div>
          <div class="menu-splash">${splash}</div>
        </div>

        <div class="menu-screen menu-title-screen">
          <button class="menu-btn">Singleplayer</button>
        </div>

        <div class="menu-screen menu-worlds-screen" style="display:none">
          <div class="menu-panel">
            <div class="menu-panel-title">Select World</div>
            <div class="menu-world-list"></div>
          </div>
          <div class="menu-btn-row">
            <button class="menu-btn menu-btn-half menu-play-selected" disabled>Play Selected World</button>
            <button class="menu-btn menu-btn-half menu-world-delete" disabled>Delete</button>
          </div>
          <div class="menu-btn-row">
            <button class="menu-btn menu-btn-half menu-create-world">Create New World</button>
            <button class="menu-btn menu-btn-half menu-back-1">Cancel</button>
          </div>
        </div>

        <div class="menu-screen menu-create-screen" style="display:none">
          <div class="menu-panel">
            <div class="menu-panel-title">Create New World</div>
            <div class="menu-form">
              <div class="menu-form-row">
                <label>World Name</label>
                <input type="text" class="menu-input menu-world-name" placeholder="New World" maxlength="32">
              </div>
              <div class="menu-form-row">
                <label>Seed (optional)</label>
                <input type="text" class="menu-input menu-seed" placeholder="Leave blank for random">
              </div>
              <div class="menu-form-row">
                <label>Game Mode</label>
                <div class="menu-mode-toggle">
                  <button class="menu-mode active" data-mode="survival">Survival</button>
                  <button class="menu-mode" data-mode="creative">Creative</button>
                </div>
              </div>
            </div>
          </div>
          <div class="menu-btn-row">
            <button class="menu-btn menu-btn-half menu-play-now">Create New World</button>
            <button class="menu-btn menu-btn-half menu-back-2">Cancel</button>
          </div>
        </div>

        <div class="menu-screen menu-skin-screen" style="display:none">
          <div class="menu-panel">
            <div class="menu-panel-title">Select Skin</div>
            <div class="menu-skin-grid"></div>
          </div>
          <div class="menu-btn-row">
            <button class="menu-btn menu-btn-half menu-back-3">Done</button>
          </div>
        </div>

        <div class="menu-bottom-row">
          <button class="menu-btn menu-btn-small menu-skins-btn">Skins</button>
          <button class="menu-btn menu-btn-small menu-settings-btn">Settings</button>
        </div>
      </div>
    `;
    this.root.appendChild(this.el);

    this.screens = {
      title: this.el.querySelector('.menu-title-screen'),
      worlds: this.el.querySelector('.menu-worlds-screen'),
      create: this.el.querySelector('.menu-create-screen'),
      skins: this.el.querySelector('.menu-skin-screen'),
    };

    this.worldList = this.el.querySelector('.menu-world-list');
    this.skinGrid = this.el.querySelector('.menu-skin-grid');
    this.playSelectedBtn = this.el.querySelector('.menu-play-selected');
    this.deleteSelectedBtn = this.el.querySelector('.menu-world-delete');
    this._buildSkinGrid();
  }

  _showScreen(name) {
    for (const [k, s] of Object.entries(this.screens)) {
      s.style.display = k === name ? '' : 'none';
    }
    this.currentScreen = name;
    const logoArea = this.el.querySelector('.menu-logo-area');
    const bottomRow = this.el.querySelector('.menu-bottom-row');
    if (name === 'title') {
      logoArea.style.display = '';
      bottomRow.style.display = '';
    } else {
      logoArea.style.display = 'none';
      bottomRow.style.display = 'none';
    }
    if (name === 'worlds') {
      this.selectedWorld = null;
      this._updateWorldButtons();
    }
  }

  _updateWorldButtons() {
    const hasSelection = this.selectedWorld !== null;
    this.playSelectedBtn.disabled = !hasSelection;
    this.deleteSelectedBtn.disabled = !hasSelection;
  }

  _bindEvents() {
    this.el.querySelector('.menu-title-screen .menu-btn').addEventListener('click', () => {
      this._showScreen('worlds');
      this.refreshWorldList();
    });
    this.el.querySelector('.menu-skins-btn').addEventListener('click', () => {
      this._showScreen('skins');
    });
    this.el.querySelector('.menu-back-1').addEventListener('click', () => {
      this._showScreen('title');
    });
    this.el.querySelector('.menu-back-2').addEventListener('click', () => {
      this._showScreen('worlds');
    });
    this.el.querySelector('.menu-back-3').addEventListener('click', () => {
      this._showScreen('title');
    });
    this.el.querySelector('.menu-create-world').addEventListener('click', () => {
      this._showScreen('create');
      const nameInput = this.el.querySelector('.menu-world-name');
      nameInput.value = '';
      this.el.querySelector('.menu-seed').value = '';
      this.selectedMode = 'survival';
      this._refreshModeToggle();
      nameInput.focus();
    });
    this.el.querySelector('.menu-play-now').addEventListener('click', () => {
      this._createAndPlay();
    });
    this.playSelectedBtn.addEventListener('click', () => {
      if (this.selectedWorld) this.onPlay(this.selectedWorld);
    });
    this.deleteSelectedBtn.addEventListener('click', () => {
      if (!this.selectedWorld) return;
      MainMenu.deleteWorld(this.selectedWorld.name);
      this.selectedWorld = null;
      this.refreshWorldList();
    });
    this.el.querySelectorAll('.menu-mode').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedMode = btn.dataset.mode;
        this._refreshModeToggle();
      });
    });
  }

  _refreshModeToggle() {
    this.el.querySelectorAll('.menu-mode').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === this.selectedMode);
    });
  }

  _buildSkinGrid() {
    this.skinGrid.innerHTML = '';
    SKINS.forEach((skin, i) => {
      const item = document.createElement('div');
      item.className = 'menu-skin-item' + (i === this.selectedSkin ? ' selected' : '');
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      drawSkinPreview(ctx, skin, 48);
      const label = document.createElement('div');
      label.className = 'menu-skin-name';
      label.textContent = skin.name;
      item.appendChild(canvas);
      item.appendChild(label);
      item.addEventListener('click', () => {
        this.selectedSkin = i;
        this.settings.set('selectedSkin', i);
        this.skinGrid.querySelectorAll('.menu-skin-item').forEach((el, j) => {
          el.classList.toggle('selected', j === i);
        });
      });
      this.skinGrid.appendChild(item);
    });
  }

  _createAndPlay() {
    const name = (this.el.querySelector('.menu-world-name').value || '').trim() || 'World';
    const seedStr = (this.el.querySelector('.menu-seed').value || '').trim();
    let seed = 0;
    if (seedStr) {
      for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
      }
    } else {
      seed = Math.floor(Math.random() * 2147483647);
    }
    const config = { name, seed, mode: this.selectedMode, lastPlayed: Date.now() };
    this._saveWorldMeta(config);
    this.onPlay(config);
  }

  refreshWorldList() {
    const worlds = MainMenu.loadWorlds();
    this.worldList.innerHTML = '';
    this.selectedWorld = null;
    this._updateWorldButtons();
    if (worlds.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'menu-empty';
      empty.textContent = 'No saved worlds';
      this.worldList.appendChild(empty);
      return;
    }
    worlds.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    for (const w of worlds) {
      const item = document.createElement('div');
      item.className = 'menu-world-item';
      const icon = document.createElement('div');
      icon.className = 'menu-world-icon';
      const grass = document.createElement('div');
      grass.className = 'menu-world-icon-grass';
      const dirt = document.createElement('div');
      dirt.className = 'menu-world-icon-dirt';
      icon.appendChild(grass);
      icon.appendChild(dirt);
      const info = document.createElement('div');
      info.className = 'menu-world-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'menu-world-name';
      nameEl.textContent = w.name;
      const meta = document.createElement('div');
      meta.className = 'menu-world-meta';
      const modeLabel = w.mode === 'creative' ? 'Creative' : 'Survival';
      meta.textContent = modeLabel;
      info.appendChild(nameEl);
      info.appendChild(meta);
      item.appendChild(icon);
      item.appendChild(info);
      item.addEventListener('click', () => {
        this.selectedWorld = w;
        this.worldList.querySelectorAll('.menu-world-item').forEach((el) => el.classList.remove('selected'));
        item.classList.add('selected');
        this._updateWorldButtons();
      });
      item.addEventListener('dblclick', () => {
        this.onPlay(w);
      });
      this.worldList.appendChild(item);
    }
  }

  show() {
    this.el.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
  }

  static loadWorlds() {
    try {
      return JSON.parse(localStorage.getItem('voxelcraft.worlds') || '[]');
    } catch {
      return [];
    }
  }

  _saveWorldMeta(world) {
    const worlds = MainMenu.loadWorlds();
    const idx = worlds.findIndex((w) => w.name === world.name);
    if (idx >= 0) worlds[idx] = world;
    else worlds.push(world);
    try {
      localStorage.setItem('voxelcraft.worlds', JSON.stringify(worlds));
    } catch {}
  }

  static deleteWorld(name) {
    const worlds = MainMenu.loadWorlds().filter((w) => w.name !== name);
    try {
      localStorage.setItem('voxelcraft.worlds', JSON.stringify(worlds));
      localStorage.removeItem('voxelcraft.world.' + name);
    } catch {}
  }

  createWorld(name, seed, mode) {
    const config = { name, seed, mode: mode || 'survival', lastPlayed: Date.now() };
    this._saveWorldMeta(config);
    return config;
  }

  static deleteWorldStatic(name) {
    MainMenu.deleteWorld(name);
  }
}
