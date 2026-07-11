export class Input {
  constructor(canvas, handlers = {}) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0;
    this.locked = false;
    // Fallback mode: some environments (embedded previews, iframes) block
    // pointer lock entirely. There we run with regular mouse-move look
    // instead of never starting the game.
    this.fallback = false;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.fallback && this.locked) {
        this.locked = false;
        handlers.lockChange?.(false);
        return;
      }
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 9) handlers.selectSlot?.(n - 1);
      }
      if (e.code === 'KeyF') handlers.toggleFly?.();
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - e.movementY * 0.0022));
    });
    document.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      if (e.button === 0) handlers.breakBlock?.();
      if (e.button === 2) handlers.placeBlock?.();
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('wheel', (e) => {
      if (this.locked) handlers.scrollSlot?.(Math.sign(e.deltaY));
    });

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      if (locked) this.fallback = false;
      if (locked !== this.locked) {
        this.locked = locked;
        handlers.lockChange?.(locked);
      }
    });
    document.addEventListener('pointerlockerror', () => this.enableFallback());
  }

  isDown(code) {
    return this.keys.has(code);
  }

  requestLock() {
    if (this.locked) return;
    // If the lock hasn't engaged shortly after the user's click, assume it's
    // blocked and start the game in fallback mode.
    setTimeout(() => this.enableFallback(), 300);
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => this.enableFallback());
    } catch {
      this.enableFallback();
    }
  }

  enableFallback() {
    if (this.locked || document.pointerLockElement === this.canvas) return;
    this.fallback = true;
    this.locked = true;
    this.handlers.lockChange?.(true);
  }
}
