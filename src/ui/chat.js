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
    this.root.append(this.log, this.input);

    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const msg = this.input.value.trim();
        if (msg) this.onSubmit?.(msg);
        this.close();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
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

  openChat() {
    if (this.open) return;
    this.open = true;
    this.root.classList.add('open');
    this.input.value = '';
    document.exitPointerLock();
    setTimeout(() => this.input.focus(), 0);
    this.onToggle?.(true);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove('open');
    this.input.blur();
    this.onToggle?.(false);
  }

  toggle() {
    if (this.open) this.close();
    else this.openChat();
  }
}
