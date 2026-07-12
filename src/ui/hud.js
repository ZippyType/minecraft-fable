import { BLOCKS } from '../world/blocks.js';
import { ITEMS, isBlock, itemName } from '../world/items.js';
import { drawItemIcon } from '../render/itemIcons.js';
import { HOTBAR_SIZE, INVENTORY_SIZE } from '../player/inventory.js';
import { matchRecipe, consumeRecipe } from '../game/crafting.js';

function blockName(id) {
  return BLOCKS[id]?.name ?? 'Block';
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

export class HUD {
  constructor(atlasCanvas, itemCanvas, inventory) {
    this.atlasCanvas = atlasCanvas;
    this.itemCanvas = itemCanvas;
    this.inventory = inventory;
    this.held = null;
    this.craftOutput = null;
    this.inventoryOpen = false;
    this.creative = false;
    this.onInventoryToggle = null;
    this.onResume = null;

    const root = el('div', 'hud');
    this.hearts = el('div', 'hearts');
    this.hunger = el('div', 'hunger');
    this.crosshair = el('div', 'crosshair');
    this.breakOverlay = el('div', 'break-overlay');
    this.modeBadge = el('div', 'mode-badge');
    this.modeBadge.textContent = 'Survival';
    this.debug = el('div', 'debug');

    // Floating label above the hotbar that announces the currently selected
    // item whenever the selection changes (mouse wheel, number keys, click).
    this.selectedName = el('div', 'selected-name');
    this.selectedName.style.opacity = '0';
    this.selectedNameTimer = 0;

    this.hotbar = el('div', 'hotbar');
    this.hotbarSlots = [];
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.makeSlot(i, true, 'hotbar');
      this.hotbar.appendChild(slot.el);
      this.hotbarSlots.push(slot);
    }

    this.invPanel = el('div', 'inv-panel');
    this.invPanel.innerHTML = '<h2>Inventory</h2><p class="inv-hint">Click to move · Shift-click to quick-move · Craft on the left</p>';
    // Touch devices have no E/Escape key, so the panel needs its own way out.
    const invClose = el('div', 'panel-close');
    invClose.textContent = '✕';
    invClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleInventory();
    });
    this.invPanel.appendChild(invClose);

    const body = el('div', 'inv-body');
    this.craftArea = el('div', 'craft-area');
    this.craftArea.innerHTML = '<span class="craft-label">Crafting</span>';
    this.craftGrid = el('div', 'craft-grid');
    this.craftSlots = [];
    for (let i = 0; i < 4; i++) {
      const slot = this.makeSlot(i, false, 'craft');
      this.craftGrid.appendChild(slot.el);
      this.craftSlots.push(slot);
    }
    this.craftOutSlot = this.makeSlot(0, false, 'craft-out');
    this.craftOutSlot.el.classList.add('craft-out');
    this.craftArea.append(this.craftGrid, this.craftOutSlot.el);

    this.invGrid = el('div', 'inv-grid');
    this.invSlots = [];
    for (let i = HOTBAR_SIZE; i < INVENTORY_SIZE; i++) {
      const slot = this.makeSlot(i, false, 'inv');
      this.invGrid.appendChild(slot.el);
      this.invSlots.push(slot);
    }
    this.invHotbar = el('div', 'inv-hotbar');
    this.invHotbarSlots = [];
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.makeSlot(i, false, 'inv');
      this.invHotbar.appendChild(slot.el);
      this.invHotbarSlots.push(slot);
    }
    body.append(this.craftArea, el('div', 'inv-right'));
    body.lastChild.append(this.invGrid, this.invHotbar);
    this.invPanel.append(body);

    this.heldCursor = el('div', 'held-cursor');
    this.heldCursorCanvas = document.createElement('canvas');
    this.heldCursorCanvas.width = this.heldCursorCanvas.height = 40;
    this.heldCount = el('span', 'count');
    this.heldCursor.append(this.heldCursorCanvas, this.heldCount);
    this.invPanel.appendChild(this.heldCursor);

    this.onSettingsOpen = null;
    this.overlay = el('div', 'overlay');
    this.overlay.innerHTML = `
      <div class="panel">
        <h1>VoxelCraft</h1>
        <p class="sub">Survival mode</p>
        <ul>
          <li><b>WASD</b> move &nbsp; <b>Space</b> jump &nbsp; <b>Shift</b> sprint</li>
          <li><b>Left click</b> attack / break &nbsp; <b>Right click</b> place / eat</li>
          <li><b>E</b> inventory + crafting &nbsp; <b>T</b> chat · <b>/creative</b></li>
        </ul>
        <p class="cta">Click to play</p>
        <div class="overlay-settings">⚙ Settings</div>
      </div>`;
    const settingsBtn = this.overlay.querySelector('.overlay-settings');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't let the overlay's resume-click fire
      this.onSettingsOpen?.();
    });
    settingsBtn.addEventListener('touchend', (e) => {
      e.preventDefault(); // suppress the synthetic click
      e.stopPropagation();
      this.onSettingsOpen?.();
    }, { passive: false });

    root.append(this.hearts, this.hunger, this.crosshair, this.breakOverlay, this.modeBadge, this.selectedName, this.hotbar, this.debug, this.invPanel, this.overlay);
    document.body.appendChild(root);
    this.invPanel.addEventListener('mousemove', (e) => {
      if (!this.held) {
        this.heldCursor.style.display = 'none';
        return;
      }
      this.heldCursor.style.display = 'flex';
      this.heldCursor.style.left = `${e.clientX + 12}px`;
      this.heldCursor.style.top = `${e.clientY + 12}px`;
    });
    this.bindTouch();
    this.refresh();
  }

  // Touch support for the inventory. The slots' click handlers are not
  // enough on touch: a drag never synthesizes a click, and iOS Safari is
  // unreliable about synthesizing them on plain divs at all. Taps are
  // handled on touchend (pick up / place, like a click), and moving the
  // finger past a small slop lifts the stack so it can be dragged and
  // dropped PE-style.
  bindTouch() {
    const SLOP = 12;
    const slotAt = (t) => {
      const el = document.elementFromPoint(t.clientX, t.clientY)?.closest('.slot');
      if (!el || !this.invPanel.contains(el)) return null;
      return { kind: el.dataset.kind, index: Number(el.dataset.index) };
    };

    this.touchDrag = null;

    this.invPanel.addEventListener('touchstart', (e) => {
      if (e.target.closest('.panel-close')) return; // let its click fire
      e.preventDefault(); // no synthetic mouse events — touch owns the panel
      if (this.touchDrag) return; // one finger drives the inventory
      const t = e.changedTouches[0];
      const startEl = e.target.closest('.slot');
      this.touchDrag = {
        id: t.identifier,
        start: startEl ? { kind: startEl.dataset.kind, index: Number(startEl.dataset.index) } : null,
        x: t.clientX,
        y: t.clientY,
        moved: 0,
        picked: false,
      };
    }, { passive: false });

    this.invPanel.addEventListener('touchmove', (e) => {
      const drag = this.touchDrag;
      if (!drag) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== drag.id) continue;
        e.preventDefault();
        drag.moved += Math.abs(t.clientX - drag.x) + Math.abs(t.clientY - drag.y);
        drag.x = t.clientX;
        drag.y = t.clientY;
        if (!drag.picked && !this.held && drag.moved > SLOP && drag.start && drag.start.kind !== 'craft-out') {
          const kind = drag.start.kind === 'craft' ? 'craft' : 'inv';
          this.held = kind === 'craft'
            ? this.inventory.moveCraftClick(drag.start.index, null)
            : this.inventory.moveSlotClick(drag.start.index, null);
          drag.picked = !!this.held;
          this.updateCraftOutput();
          this.refresh();
        }
        if (this.held) this.positionHeldCursor(t.clientX, t.clientY);
      }
    }, { passive: false });

    const endDrag = (e) => {
      const drag = this.touchDrag;
      if (!drag) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== drag.id) continue;
        e.preventDefault();
        this.touchDrag = null;
        if (drag.picked || (this.held && drag.moved > SLOP)) {
          // Drop onto the slot under the finger; anywhere else keeps the
          // stack held so a later tap can still place it.
          const target = slotAt(t);
          if (target) this.dropHeld(target.kind, target.index);
        } else if (drag.moved <= SLOP && drag.start) {
          this.slotClick(drag.start.kind, drag.start.index, false);
          if (this.held) this.positionHeldCursor(t.clientX, t.clientY);
        }
        if (!this.held) this.heldCursor.style.display = 'none';
      }
    };
    this.invPanel.addEventListener('touchend', endDrag, { passive: false });
    this.invPanel.addEventListener('touchcancel', endDrag, { passive: false });

    // In-game hotbar: tap selects the slot without relying on a synthetic click.
    this.hotbar.addEventListener('touchend', (e) => {
      const slotEl = e.target.closest('.slot');
      if (!slotEl || this.inventoryOpen) return;
      e.preventDefault();
      this.slotClick('hotbar', Number(slotEl.dataset.index), false);
    }, { passive: false });
  }

  dropHeld(kind, index) {
    if (!this.held || kind === 'craft-out') return;
    if (kind === 'hotbar') kind = 'inv';
    this.held = kind === 'craft'
      ? this.inventory.moveCraftClick(index, this.held)
      : this.inventory.moveSlotClick(index, this.held);
    this.updateCraftOutput();
    this.refresh();
  }

  positionHeldCursor(x, y) {
    // Above the finger so the stack isn't hidden underneath it.
    this.heldCursor.style.display = 'flex';
    this.heldCursor.style.left = `${x - 20}px`;
    this.heldCursor.style.top = `${y - 56}px`;
  }

  makeSlot(index, showKey, kind) {
    const elSlot = el('div', 'slot');
    elSlot.dataset.index = index;
    elSlot.dataset.kind = kind;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 40;
    const count = el('span', 'count');
    const key = el('span', 'num');
    if (showKey) key.textContent = index + 1;
    elSlot.append(canvas, count, key);
    elSlot.addEventListener('click', (e) => {
      e.stopPropagation();
      this.slotClick(kind, index, e.shiftKey);
    });
    return { el: elSlot, canvas, count, key, kind, index };
  }

  slotClick(kind, index, shift) {
    // The in-game hotbar: tapping/clicking selects the slot. Only when the
    // inventory panel is open does it act like a regular inventory slot.
    if (kind === 'hotbar') {
      if (!this.inventoryOpen) {
        this.setSelected(index);
        return;
      }
      kind = 'inv';
    }
    if (kind === 'craft-out') {
      if (!this.craftOutput) return;
      const out = this.craftOutput;
      if (!this.held) {
        this.held = { id: out.id, count: out.count };
        if (!this.inventory.creative) consumeRecipe(this.inventory.craftSlots);
        this.updateCraftOutput();
        this.refresh();
        return;
      }
      if (this.held.id === out.id) {
        const room = 64 - this.held.count;
        const take = Math.min(room, out.count);
        if (take > 0) {
          this.held.count += take;
          if (!this.inventory.creative) consumeRecipe(this.inventory.craftSlots);
          this.updateCraftOutput();
          this.refresh();
        }
      }
      return;
    }

    if (shift && kind === 'inv') {
      this.inventory.quickMove(index);
      this.refresh();
      return;
    }

    if (kind === 'craft') {
      this.held = this.inventory.moveCraftClick(index, this.held);
    } else {
      this.held = this.inventory.moveSlotClick(index, this.held);
    }
    this.updateCraftOutput();
    this.refresh();
  }

  updateCraftOutput() {
    this.craftOutput = matchRecipe(this.inventory.craftSlots);
  }

  onStart(cb) {
    this.onResume = cb;
    this.overlay.addEventListener('click', () => {
      if (!this.inventoryOpen) cb();
    });
  }

  setCreative(on) {
    this.creative = on;
    this.modeBadge.textContent = on ? 'Creative' : 'Survival';
    this.modeBadge.classList.toggle('creative', on);
    this.hearts.style.display = on ? 'none' : 'flex';
    this.hunger.style.display = on ? 'none' : 'flex';
    this.invPanel.querySelector('h2').textContent = on ? 'Creative Inventory' : 'Inventory';
  }

  toggleInventory() {
    const opening = !this.inventoryOpen;
    this.inventoryOpen = opening;
    this.invPanel.style.display = opening ? 'flex' : 'none';
    this.onInventoryToggle?.(opening);
    if (opening) {
      document.exitPointerLock();
      this.held = null;
      this.heldCursor.style.display = 'none';
    } else {
      this.held = null;
      requestAnimationFrame(() => this.onResume?.());
    }
    this.updateCraftOutput();
    this.refresh();
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
    if (this.inventory.selected === i) return;
    this.inventory.selected = i;
    this.refreshHotbar();
    this.flashSelectedName();
  }

  flashSelectedName() {
    const id = this.inventory.selectedId();
    const name = id === null ? 'Empty' : isBlock(id) ? blockName(id) : itemName(id);
    this.selectedName.textContent = name;
    this.selectedName.style.opacity = '1';
    this.selectedNameTimer = 2.0;
  }

  tick(dt) {
    if (this.selectedNameTimer > 0) {
      this.selectedNameTimer -= dt;
      if (this.selectedNameTimer <= 0) this.selectedName.style.opacity = '0';
    }
  }

  selectedBlock() {
    return this.inventory.selectedBlockId();
  }

  refreshSelectedName() {
    const id = this.inventory.selectedId();
    const name = id === null ? '' : isBlock(id) ? blockName(id) : itemName(id);
    this.selectedName.textContent = name;
    this.selectedName.style.opacity = name ? '1' : '0';
    this.selectedNameTimer = name ? 2.0 : 0;
  }

  setBreakProgress(p) {
    if (p <= 0 || p >= 1) {
      this.breakOverlay.style.opacity = '0';
      this.breakOverlay.style.transform = 'translate(-50%, -50%) scale(1)';
      return;
    }
    const s = 1 - p * 0.35;
    this.breakOverlay.style.opacity = String(0.35 + p * 0.55);
    this.breakOverlay.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  drawIcon(canvas, id) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 40, 40);
    if (!id) return;
    if (isBlock(id) && BLOCKS[id]) {
      ctx.imageSmoothingEnabled = false;
      const icon = BLOCKS[id].icon;
      ctx.drawImage(
        this.atlasCanvas,
        (icon % 4) * 16,
        Math.floor(icon / 4) * 16,
        16, 16, 0, 0, 40, 40
      );
      return;
    }
    const item = ITEMS[id];
    if (item) drawItemIcon(ctx, this.itemCanvas, item.icon, 40);
  }

  updateSlot(slot, stack) {
    this.drawIcon(slot.canvas, stack?.id ?? null);
    if (stack?.infinite) slot.count.textContent = '∞';
    else slot.count.textContent = stack && stack.count > 1 ? stack.count : '';
    slot.el.classList.toggle('empty', !stack);
  }

  refreshHotbar() {
    this.hotbarSlots.forEach((slot, i) => {
      this.updateSlot(slot, this.inventory.getSlot(i));
      slot.el.classList.toggle('selected', this.inventory.selected === i);
    });
    this.invHotbarSlots.forEach((slot, i) => {
      this.updateSlot(slot, this.inventory.getSlot(i));
      slot.el.classList.toggle('selected', this.inventory.selected === i);
    });
  }

  refreshInventory() {
    this.invSlots.forEach((slot, i) => {
      this.updateSlot(slot, this.inventory.getSlot(i + HOTBAR_SIZE));
    });
    this.craftSlots.forEach((slot, i) => {
      this.updateSlot(slot, this.inventory.craftSlots[i]);
    });
    this.updateSlot(this.craftOutSlot, this.craftOutput);
    if (this.held) {
      this.drawIcon(this.heldCursorCanvas, this.held.id);
      this.heldCount.textContent = this.held.infinite ? '∞' : (this.held.count > 1 ? this.held.count : '');
    }
  }

  refresh() {
    this.refreshHotbar();
    this.refreshInventory();
  }

  updateHearts(health, maxHealth, flash) {
    this.hearts.innerHTML = '';
    const total = Math.ceil(maxHealth / 2);
    const filled = Math.ceil(health / 2);
    for (let i = 0; i < total; i++) {
      const h = el('span', 'heart');
      if (i < filled) h.classList.add('full');
      this.hearts.appendChild(h);
    }
    this.hearts.classList.toggle('hurt', flash > 0);
  }

  updateHunger(hunger, maxHunger) {
    this.hunger.innerHTML = '';
    const total = Math.ceil(maxHunger / 2);
    const filled = Math.ceil(hunger / 2);
    for (let i = 0; i < total; i++) {
      const h = el('span', 'drumstick');
      if (i < filled) h.classList.add('full');
      this.hunger.appendChild(h);
    }
  }

  updateDebug(text) {
    this.debug.textContent = text;
  }
}
