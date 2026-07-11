function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

export class Chat {
  constructor() {
    this.open = false;
    this.onSubmit = null;
    this.onToggle = null;

    this.root = el('div', 'chat');
    this.log = el('div', 'chat-log');
    this.input = document.createElement('input');
    this.input.className = 'chat-input';
    this.input.type = 'text';
    this.input.placeholder = 'Try /creative, /spawn zombie, /time set night…';
    this.input.maxLength = 120;

    // Send + close buttons so chat is usable without a physical keyboard
    // (touch devices have no Enter/Escape).
    const row = el('div', 'chat-row');
    const sendBtn = el('div', 'chat-action');
    sendBtn.textContent = '➤';
    sendBtn.addEventListener('click', () => this.submit());
    const closeBtn = el('div', 'chat-action');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());
    row.append(this.input, sendBtn, closeBtn);
    this.root.append(this.log, row);

    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this.submit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  submit() {
    const msg = this.input.value.trim();
    if (msg) this.onSubmit?.(msg);
    this.close();
  }

  mount(parent) {
    parent.appendChild(this.root);
  }

  logMessage(text, ok = true) {
    const line = el('div', ok ? 'chat-line' : 'chat-line err');
    line.textContent = text;
    this.log.appendChild(line);
    this.log.scrollTop = this.log.scrollHeight;
    while (this.log.children.length > 8) this.log.firstChild.remove();
  }

  openChat(focusNow = false) {
    if (this.open) return;
    this.open = true;
    this.root.classList.add('open');
    this.input.value = '';
    document.exitPointerLock();
    // iOS only shows the on-screen keyboard when focus() runs inside the
    // triggering gesture, so touch passes focusNow. Opening with the T key
    // keeps the deferred focus so the letter itself doesn't land in the input.
    if (focusNow) this.input.focus();
    else setTimeout(() => this.input.focus(), 0);
    this.onToggle?.(true);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove('open');
    this.input.blur();
    this.onToggle?.(false);
  }

  toggle(focusNow = false) {
    if (this.open) this.close();
    else this.openChat(focusNow);
  }
}
