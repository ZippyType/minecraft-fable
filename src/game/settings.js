const STORAGE_KEY = 'voxelcraft.settings';

export const DEFAULT_BINDINGS = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  sprint: 'ShiftLeft',
  inventory: 'KeyE',
  chat: 'KeyT',
  fly: 'KeyF',
};

export const BINDING_LABELS = {
  forward: 'Move forward',
  back: 'Move back',
  left: 'Move left',
  right: 'Move right',
  jump: 'Jump / swim / fly up',
  sprint: 'Sprint / fly down',
  inventory: 'Inventory',
  chat: 'Chat',
  fly: 'Toggle fly (creative)',
};

// Human-readable name for a KeyboardEvent.code.
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const named = {
    Space: 'Space',
    ShiftLeft: 'L-Shift',
    ShiftRight: 'R-Shift',
    ControlLeft: 'L-Ctrl',
    ControlRight: 'R-Ctrl',
    AltLeft: 'L-Alt',
    AltRight: 'R-Alt',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Tab: 'Tab',
    Enter: 'Enter',
    Backspace: 'Bksp',
    CapsLock: 'Caps',
  };
  return named[code] ?? code;
}

// Persistent game settings. Consumers read fields directly (`settings.
// sensitivity`, `settings.bindings.jump`) so changes apply instantly;
// `onChange` exists for the few things that need an explicit re-apply
// (like switching the touch-controls mode).
export class Settings {
  constructor() {
    this.sensitivity = 1; // camera look multiplier, 0.2 - 3
    this.touchMode = 'auto'; // 'auto' | 'on' | 'off'
    this.bindings = { ...DEFAULT_BINDINGS };
    this.listeners = new Set();
    this.load();
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  emit(field) {
    for (const fn of this.listeners) fn(field, this);
  }

  set(field, value) {
    this[field] = value;
    this.save();
    this.emit(field);
  }

  setBinding(action, code) {
    // If the key is already bound to another action, swap them so no
    // action silently loses its key.
    for (const other of Object.keys(this.bindings)) {
      if (other !== action && this.bindings[other] === code) {
        this.bindings[other] = this.bindings[action];
      }
    }
    this.bindings[action] = code;
    this.save();
    this.emit('bindings');
  }

  resetBindings() {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.save();
    this.emit('bindings');
  }

  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      if (typeof raw.sensitivity === 'number') {
        this.sensitivity = Math.max(0.2, Math.min(3, raw.sensitivity));
      }
      if (['auto', 'on', 'off'].includes(raw.touchMode)) this.touchMode = raw.touchMode;
      if (raw.bindings && typeof raw.bindings === 'object') {
        for (const k of Object.keys(DEFAULT_BINDINGS)) {
          if (typeof raw.bindings[k] === 'string') this.bindings[k] = raw.bindings[k];
        }
      }
    } catch {
      // Corrupt JSON or storage unavailable (private mode) — keep defaults.
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sensitivity: this.sensitivity,
        touchMode: this.touchMode,
        bindings: this.bindings,
      }));
    } catch {
      // Storage unavailable — settings just won't persist.
    }
  }
}
