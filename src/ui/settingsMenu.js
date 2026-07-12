import { DEFAULT_BINDINGS, BINDING_LABELS, keyLabel } from '../game/settings.js';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// Fires on both mouse click and touch without relying on Safari's
// synthetic clicks (see hud.js bindTouch for why that matters).
function press(node, fn) {
  node.addEventListener('click', fn);
  node.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn(e);
  }, { passive: false });
}

export class SettingsMenu {
  constructor(root, settings) {
    this.settings = settings;
    this.open = false;
    this.onToggle = null;
    this.capturing = null; // action name while waiting for a key press

    this.panel = el('div', 'settings-panel');
    this.panel.innerHTML = '<h2>Settings</h2>';

    const close = el('div', 'panel-close');
    close.textContent = '✕';
    press(close, () => this.close());
    this.panel.appendChild(close);

    const body = el('div', 'settings-body');

    // --- Camera ---
    const cam = el('div', 'settings-section');
    cam.innerHTML = '<h3>Camera</h3>';
    const sensRow = el('div', 'settings-row');
    const sensLabel = el('span', 'settings-label');
    sensLabel.textContent = 'Sensitivity';
    this.sensValue = el('span', 'sens-value');
    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '20';
    this.slider.max = '300';
    this.slider.step = '10';
    this.slider.className = 'sens-slider';
    this.slider.addEventListener('input', () => {
      this.settings.set('sensitivity', Number(this.slider.value) / 100);
      this.refreshSensitivity();
    });
    sensRow.append(sensLabel, this.slider, this.sensValue);
    cam.appendChild(sensRow);

    // --- Touch controls ---
    const touch = el('div', 'settings-section');
    touch.innerHTML = '<h3>Touch controls</h3><p class="settings-hint">On-screen joystick and buttons for phones/tablets. Auto shows them on touch devices.</p>';
    const seg = el('div', 'seg-row');
    this.segButtons = {};
    for (const mode of ['auto', 'on', 'off']) {
      const b = el('div', 'seg-btn');
      b.textContent = mode[0].toUpperCase() + mode.slice(1);
      press(b, () => {
        this.settings.set('touchMode', mode);
        this.refreshTouchMode();
      });
      this.segButtons[mode] = b;
      seg.appendChild(b);
    }
    touch.appendChild(seg);

    // --- Key bindings ---
    const keys = el('div', 'settings-section');
    keys.innerHTML = '<h3>Controls</h3><p class="settings-hint">Click a key to rebind it. Esc cancels.</p>';
    this.bindButtons = {};
    for (const action of Object.keys(DEFAULT_BINDINGS)) {
      const row = el('div', 'settings-row');
      const label = el('span', 'settings-label');
      label.textContent = BINDING_LABELS[action];
      const btn = el('div', 'bind-key');
      press(btn, () => this.startCapture(action));
      this.bindButtons[action] = btn;
      row.append(label, btn);
      keys.appendChild(row);
    }
    const reset = el('div', 'bind-reset');
    reset.textContent = 'Reset controls to defaults';
    press(reset, () => {
      this.settings.resetBindings();
      this.refreshBindings();
    });
    keys.appendChild(reset);

    body.append(cam, touch, keys);
    this.panel.appendChild(body);
    root.appendChild(this.panel);

    // Capture-phase so a rebinding key press never reaches the game.
    document.addEventListener('keydown', (e) => {
      if (!this.capturing) return;
      e.preventDefault();
      e.stopPropagation();
      const action = this.capturing;
      this.capturing = null;
      if (e.code !== 'Escape') this.settings.setBinding(action, e.code);
      this.refreshBindings();
    }, { capture: true });

    this.refresh();
  }

  startCapture(action) {
    this.capturing = action;
    this.refreshBindings();
  }

  refreshSensitivity() {
    this.slider.value = String(Math.round(this.settings.sensitivity * 100));
    this.sensValue.textContent = `${Math.round(this.settings.sensitivity * 100)}%`;
  }

  refreshTouchMode() {
    for (const [mode, b] of Object.entries(this.segButtons)) {
      b.classList.toggle('active', this.settings.touchMode === mode);
    }
  }

  refreshBindings() {
    for (const [action, btn] of Object.entries(this.bindButtons)) {
      if (this.capturing === action) {
        btn.textContent = 'Press a key…';
        btn.classList.add('capturing');
      } else {
        btn.textContent = keyLabel(this.settings.bindings[action]);
        btn.classList.remove('capturing');
      }
    }
  }

  refresh() {
    this.refreshSensitivity();
    this.refreshTouchMode();
    this.refreshBindings();
  }

  openMenu() {
    if (this.open) return;
    this.open = true;
    this.refresh();
    this.panel.classList.add('open');
    this.onToggle?.(true);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.capturing = null;
    this.panel.classList.remove('open');
    this.onToggle?.(false);
  }
}
