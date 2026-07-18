// Base radians-per-pixel for mouse look; scaled by settings.sensitivity.
const MOUSE_SENSITIVITY = 0.0032;

export class Input {
  constructor(canvas, handlers = {}, settings) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.settings = settings;
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0;
    this.locked = false;
    this.fallback = false;
    this.breaking = false;
    this.paused = false;
    // Touch-control state (see ui/touch.js): analog movement in [-1, 1].
    this.touchMode = false;
    this.touchF = 0;
    this.touchS = 0;
    this.touchSprint = false;
    this.touchAttack = false;
    this.touchBreak = false;

    document.addEventListener('keydown', (e) => {
      const binds = this.settings.bindings;
      if (this.paused && e.code !== binds.inventory && e.code !== 'Escape' && e.code !== binds.chat) return;
      if (e.code === 'Escape' && this.fallback && this.locked) {
        this.releaseLock();
        return;
      }
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 9) handlers.selectSlot?.(n - 1);
      }
      if (e.code === binds.inventory) handlers.toggleInventory?.();
      if (e.code === binds.chat) handlers.toggleChat?.();
      if (e.code === binds.fly) handlers.toggleFly?.();
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.stopBreak();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.locked || this.paused) return;
      const s = MOUSE_SENSITIVITY * this.settings.sensitivity;
      this.yaw -= e.movementX * s;
      this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - e.movementY * s));
    });
    document.addEventListener('mousedown', (e) => {
      if (!this.locked || this.paused) return;
      // Ignore clicks on HUD elements (hotbar, touch buttons, panels) —
      // only clicks on the game view swing/place.
      const onGameView =
        e.target === this.canvas ||
        e.target === document.body ||
        e.target.classList?.contains('touch-look');
      if (!onGameView) return;
      if (e.button === 0) {
        this.breaking = true;
        handlers.startBreak?.();
      }
      if (e.button === 2) handlers.useItem?.();
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.stopBreak();
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('wheel', (e) => {
      if (this.locked && !this.paused) handlers.scrollSlot?.(Math.sign(e.deltaY));
    });

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      if (locked) this.fallback = false;
      if (locked !== this.locked) {
        this.locked = locked;
        handlers.lockChange?.(locked);
      }
      if (!locked) this.stopBreak();
    });
    document.addEventListener('pointerlockerror', () => this.enableFallback());
  }

  stopBreak() {
    if (!this.breaking && !this.touchAttack) return;
    this.breaking = false;
    this.touchAttack = false;
    this.touchBreak = false;
    this.handlers.stopBreak?.();
  }

  setPaused(v) {
    this.paused = v;
    if (v) this.stopBreak();
  }

  isDown(code) {
    return this.keys.has(code);
  }

  // True while the key bound to the named action is held.
  isAction(name) {
    const code = this.settings.bindings[name];
    if (!code) return false;
    if (this.keys.has(code)) return true;
    // A left-side modifier binding accepts its right-side twin too.
    if (code === 'ShiftLeft') return this.keys.has('ShiftRight');
    if (code === 'ControlLeft') return this.keys.has('ControlRight');
    if (code === 'AltLeft') return this.keys.has('AltRight');
    return false;
  }

  // Touch buttons press actions, not raw key codes, so rebinding a key
  // never breaks them.
  pressAction(name) {
    const code = this.settings.bindings[name];
    if (code) this.keys.add(code);
  }

  releaseAction(name) {
    const code = this.settings.bindings[name];
    if (code) this.keys.delete(code);
  }

  releaseLock() {
    if (this.fallback && this.locked) {
      this.locked = false;
      this.handlers.lockChange?.(false);
    } else if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  requestLock() {
    if (this.locked || this.paused) return;
    // On touch devices pointer lock is useless — go straight to fallback.
    if (this.touchMode) return this.enableFallback();
    setTimeout(() => this.enableFallback(), 300);
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => this.enableFallback());
    } catch {
      this.enableFallback();
    }
  }

  enableFallback() {
    if (this.locked || this.paused || document.pointerLockElement === this.canvas) return;
    this.fallback = true;
    this.locked = true;
    this.handlers.lockChange?.(true);
  }
}
