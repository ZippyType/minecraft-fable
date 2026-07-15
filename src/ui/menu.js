import { Settings } from '../game/settings.js';

const SKINS = [
  { name: 'Steve', hair: '#4a2a0a', skin: '#c69c6d', shirt: '#00aadb', pants: '#3b3b98', shoes: '#3b3b98' },
  { name: 'Alex', hair: '#b87820', skin: '#d8a068', shirt: '#58a048', pants: '#3b3b98', shoes: '#6b4a2a' },
  { name: 'Zombie', hair: '#2a5a1a', skin: '#5a8f4a', shirt: '#3a4a5a', pants: '#2a3a6a', shoes: '#2a3a6a' },
  { name: 'Skeleton', hair: '#d8d8c8', skin: '#d8d8c8', shirt: '#c8c8b8', pants: '#d0d0c0', shoes: '#b8b8a8' },
  { name: 'Enderman', hair: '#121018', skin: '#121018', shirt: '#1a1828', pants: '#121018', shoes: '#121018' },
  { name: 'Herobrine', hair: '#4a2a0a', skin: '#c69c6d', shirt: '#00aadb', pants: '#3b3b98', shoes: '#3b3b98' },
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

export class MainMenu {
  constructor(root, onPlay) {
    this.root = root;
    this.onPlay = onPlay;
    this.settings = new Settings();
    this.currentScreen = 'title';
    this.selectedMode = 'survival';
    this.selectedSkin = this.settings.selectedSkin || 0;
    this._build();
    this._bindEvents();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'menu';
    this.el.innerHTML = `
      <div class="menu-title">VoxelCraft</div>
      <div class="menu-subtitle">A Minecraft-like game</div>

      <div class="menu-screen menu-title-screen">
        <button class="menu-btn menu-play">Play</button>
        <button class="menu-btn menu-skins">Skins</button>
        <button class="menu-btn menu-settings-btn">Settings</button>
      </div>

      <div class="menu-screen menu-worlds-screen" style="display:none">
        <h2>Select World</h2>
        <div class="menu-world-list"></div>
        <button class="menu-btn menu-create-world">+ Create New World</button>
        <button class="menu-btn menu-back-1">Back</button>
      </div>

      <div class="menu-screen menu-create-screen" style="display:none">
        <h2>Create New World</h2>
        <div class="menu-form">
          <label>World Name</label>
          <input type="text" class="menu-input menu-world-name" placeholder="My World" maxlength="32">
          <label>Seed (optional)</label>
          <input type="text" class="menu-input menu-seed" placeholder="Random">
          <label>Game Mode</label>
          <div class="menu-mode-toggle">
            <button class="menu-mode active" data-mode="survival">Survival</button>
            <button class="menu-mode" data-mode="creative">Creative</button>
          </div>
        </div>
        <button class="menu-btn menu-play-now">Create &amp; Play</button>
        <button class="menu-btn menu-back-2">Back</button>
      </div>

      <div class="menu-screen menu-skin-screen" style="display:none">
        <h2>Select Skin</h2>
        <div class="menu-skin-grid"></div>
        <button class="menu-btn menu-back-3">Back</button>
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
    this._buildSkinGrid();
  }

  _showScreen(name) {
    for (const [k, s] of Object.entries(this.screens)) {
      s.style.display = k === name ? '' : 'none';
    }
    this.currentScreen = name;
  }

  _bindEvents() {
    this.el.querySelector('.menu-play').addEventListener('click', () => {
      this._showScreen('worlds');
      this.refreshWorldList();
    });
    this.el.querySelector('.menu-skins').addEventListener('click', () => {
      this._showScreen('skins');
    });
    this.el.querySelector('.menu-settings-btn').addEventListener('click', () => {
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
    if (worlds.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'menu-empty';
      empty.textContent = 'No saved worlds yet';
      this.worldList.appendChild(empty);
      return;
    }
    worlds.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
    for (const w of worlds) {
      const item = document.createElement('div');
      item.className = 'menu-world-item';
      const info = document.createElement('div');
      info.className = 'menu-world-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'menu-world-name';
      nameEl.textContent = w.name;
      const meta = document.createElement('div');
      meta.className = 'menu-world-meta';
      const modeLabel = w.mode === 'creative' ? 'Creative' : 'Survival';
      const date = w.lastPlayed ? new Date(w.lastPlayed).toLocaleDateString() : '';
      meta.textContent = modeLabel + (date ? '  ·  ' + date : '');
      info.appendChild(nameEl);
      info.appendChild(meta);
      const del = document.createElement('button');
      del.className = 'menu-world-delete';
      del.textContent = 'Delete';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        MainMenu.deleteWorld(w.name);
        this.refreshWorldList();
      });
      item.appendChild(info);
      item.appendChild(del);
      item.addEventListener('click', () => this.selectWorld(w.name));
      this.worldList.appendChild(item);
    }
  }

  selectWorld(name) {
    const worlds = MainMenu.loadWorlds();
    const w = worlds.find((w) => w.name === name);
    if (w) this.onPlay(w);
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
