// Minecraft PE-style touch controls:
//   - virtual joystick (bottom-left) moves the player, analog speed
//   - dragging anywhere else looks around
//   - quick tap = use item / place block, press-and-hold = break block
//   - jump + sneak/descend buttons (bottom-right)
//   - small buttons for inventory, chat, and pause (top-right)
// Enabled automatically on coarse-pointer devices (phones/tablets), or on
// the first real touch anywhere (hybrid laptops).

const HOLD_TO_BREAK_MS = 350;
const TAP_SLOP_PX = 12;
// Base radians-per-pixel for touch look; scaled by settings.sensitivity.
const LOOK_SENSITIVITY = 0.007;
const STICK_DEADZONE = 0.18;

export class TouchControls {
  constructor(root, input, handlers, settings) {
    this.root = root;
    this.input = input;
    this.handlers = handlers;
    this.settings = settings;
    this.enabled = false;
    this.userDisabled = false;
    this.firstTouchArmed = false;

    // Full-screen look/act layer, painted (and hit-tested) below every other
    // HUD element so panels and buttons take priority.
    this.look = document.createElement('div');
    this.look.className = 'touch-look';
    root.insertBefore(this.look, root.firstChild);

    this.ui = document.createElement('div');
    this.ui.className = 'touch-ui';
    this.ui.innerHTML = `
      <div class="joystick"><div class="knob"></div></div>
      <div class="tbtn jump">&#9650;</div>
      <div class="tbtn sneak">&#9660;</div>
      <div class="tbtn-col">
        <div class="tbtn small inv-btn">&#9776;</div>
        <div class="tbtn small chat-btn">&#128172;</div>
        <div class="tbtn small pause-btn">&#10073;&#10073;</div>
      </div>`;
    // Below the inventory panel and overlay so they cover the controls.
    root.insertBefore(this.ui, root.querySelector('.inv-panel'));

    this.base = this.ui.querySelector('.joystick');
    this.knob = this.ui.querySelector('.knob');

    this.stickId = null;
    this.lookId = null;
    this.lookState = null; // 'pending' | 'look' | 'break'
    this.lookLast = { x: 0, y: 0 };
    this.tapMoved = 0;
    this.breakTimer = 0;

    this.bind();
    this.setMode(settings.touchMode);
  }

  enable() {
    if (this.enabled || this.userDisabled) return;
    this.enabled = true;
    this.input.touchMode = true; // pointer lock is pointless on touch
    this.root.classList.add('touch-on');
  }

  turnOff() {
    if (!this.enabled) return;
    this.enabled = false;
    this.input.touchMode = false;
    this.root.classList.remove('touch-on');
    clearTimeout(this.breakTimer);
    this.stickId = null;
    this.lookId = null;
    this.lookState = null;
    this.knob.style.transform = '';
    this.input.touchF = 0;
    this.input.touchS = 0;
    this.input.touchSprint = false;
    if (this.input.breaking) {
      this.input.breaking = false;
      this.handlers.stopBreak?.();
    }
  }

  // Applies the touch-controls setting ('auto' | 'on' | 'off'). Auto keys
  // off pointer capabilities, not the user agent, so e.g. Safari's
  // "Request Desktop Website" doesn't hide the controls — 'off' does.
  setMode(mode) {
    if (mode === 'on') {
      this.userDisabled = false;
      this.enable();
      return;
    }
    if (mode === 'off') {
      this.turnOff();
      this.userDisabled = true;
      return;
    }
    // auto: coarse pointers get the controls right away, hybrid devices on
    // their first real touch.
    this.userDisabled = false;
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      this.enable();
      return;
    }
    this.turnOff();
    if (!this.firstTouchArmed) {
      this.firstTouchArmed = true;
      // Not `once`: the mode can change between touches, so re-check each
      // time. enable() is idempotent and cheap.
      window.addEventListener('touchstart', () => {
        if (this.settings.touchMode === 'auto') this.enable();
      }, { passive: true });
    }
  }

  bind() {
    this.base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.stickId !== null) return;
      const t = e.changedTouches[0];
      this.stickId = t.identifier;
      this.moveStick(t);
    }, { passive: false });

    this.look.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!this.input.locked || this.input.paused || this.lookId !== null) return;
      const t = e.changedTouches[0];
      this.lookId = t.identifier;
      this.lookState = 'pending';
      this.tapMoved = 0;
      this.lookLast = { x: t.clientX, y: t.clientY };
      clearTimeout(this.breakTimer);
      this.breakTimer = setTimeout(() => {
        if (this.lookState === 'pending') {
          this.lookState = 'break';
          this.input.breaking = true;
        }
      }, HOLD_TO_BREAK_MS);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      let handled = false;
      for (const t of e.changedTouches) {
        if (t.identifier === this.stickId) {
          this.moveStick(t);
          handled = true;
        } else if (t.identifier === this.lookId) {
          const dx = t.clientX - this.lookLast.x;
          const dy = t.clientY - this.lookLast.y;
          this.lookLast = { x: t.clientX, y: t.clientY };
          this.tapMoved += Math.abs(dx) + Math.abs(dy);
          if (this.lookState === 'pending' && this.tapMoved > TAP_SLOP_PX) {
            this.lookState = 'look';
            clearTimeout(this.breakTimer);
          }
          if (this.lookState === 'look' || this.lookState === 'break') {
            const sens = LOOK_SENSITIVITY * this.settings.sensitivity;
            this.input.yaw -= dx * sens;
            this.input.pitch = Math.max(-1.55, Math.min(1.55, this.input.pitch - dy * sens));
          }
          handled = true;
        }
      }
      if (handled) e.preventDefault();
    }, { passive: false });

    const endTouch = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.stickId) {
          this.stickId = null;
          this.knob.style.transform = '';
          this.input.touchF = 0;
          this.input.touchS = 0;
          this.input.touchSprint = false;
        } else if (t.identifier === this.lookId) {
          clearTimeout(this.breakTimer);
          if (this.lookState === 'pending' && this.input.locked && !this.input.paused) {
            this.handlers.useItem?.();
          }
          if (this.lookState === 'break') {
            this.input.breaking = false;
            this.handlers.stopBreak?.();
          }
          this.lookId = null;
          this.lookState = null;
        }
      }
    };
    document.addEventListener('touchend', endTouch);
    document.addEventListener('touchcancel', endTouch);

    this.pressButton('.jump',
      () => this.input.pressAction('jump'),
      () => this.input.releaseAction('jump'));
    this.pressButton('.sneak',
      () => this.input.pressAction('sprint'),
      () => this.input.releaseAction('sprint'));
    this.pressButton('.inv-btn', () => this.handlers.toggleInventory?.());
    this.pressButton('.chat-btn', () => this.handlers.toggleChat?.());
    this.pressButton('.pause-btn', () => this.handlers.pause?.());
  }

  pressButton(selector, down, up) {
    const btn = this.ui.querySelector(selector);
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('pressed');
      down();
    }, { passive: false });
    const release = (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      up?.();
    };
    btn.addEventListener('touchend', release);
    btn.addEventListener('touchcancel', release);
  }

  moveStick(t) {
    const rect = this.base.getBoundingClientRect();
    const R = rect.width / 2;
    let dx = t.clientX - (rect.left + R);
    let dy = t.clientY - (rect.top + R);
    const mag = Math.hypot(dx, dy);
    if (mag > R) {
      dx = (dx / mag) * R;
      dy = (dy / mag) * R;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;

    const nx = dx / R;
    const ny = dy / R;
    const m = Math.hypot(nx, ny);
    if (m < STICK_DEADZONE) {
      this.input.touchF = 0;
      this.input.touchS = 0;
      this.input.touchSprint = false;
      return;
    }
    const eff = Math.min(1, (m - STICK_DEADZONE) / (1 - STICK_DEADZONE));
    this.input.touchS = (nx / m) * eff;
    this.input.touchF = (-ny / m) * eff;
    // Pushing the stick all the way forward sprints, like holding it in PE.
    this.input.touchSprint = eff > 0.95 && this.input.touchF > 0.6;
  }
}
