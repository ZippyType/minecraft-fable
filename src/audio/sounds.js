let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(duration, freq, type, vol, dest) {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(dest ?? c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
  return { osc, gain };
}

function burst(duration, vol, dest) {
  const c = ensureCtx();
  const bufSize = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(gain);
  gain.connect(dest ?? c.destination);
  src.start();
  src.stop(c.currentTime + duration);
  return { src, gain };
}

export function playBreak() {
  burst(0.1, 0.12);
  noise(0.08, 200, 'square', 0.08);
}

export function playPlace() {
  noise(0.08, 120, 'sine', 0.1);
  noise(0.06, 80, 'square', 0.06);
}

export function playHit() {
  burst(0.1, 0.1);
  noise(0.1, 300, 'square', 0.08);
}

export function playHurt() {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.15);
}

export function playEat() {
  burst(0.05, 0.06);
  setTimeout(() => burst(0.05, 0.05), 80);
  setTimeout(() => burst(0.05, 0.04), 160);
}

export function playStep() {
  burst(0.05, 0.04);
}

export function playPickup() {
  const c = ensureCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.1);
  gain.gain.setValueAtTime(0.08, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.1);
}

export function playArrow() {
  burst(0.15, 0.08);
  noise(0.12, 600, 'sawtooth', 0.05);
}

export function playExplode() {
  burst(0.5, 0.2);
  noise(0.4, 60, 'square', 0.15);
  noise(0.6, 40, 'sine', 0.12);
}

export function playSplash() {
  const c = ensureCtx();
  const bufSize = Math.floor(c.sampleRate * 0.2);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 2;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
  src.stop(c.currentTime + 0.2);
}

let rainNode = null;
let rainGain = null;

export function startRain() {
  if (rainNode) return;
  const c = ensureCtx();
  const bufSize = 2 * c.sampleRate;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  rainNode = c.createBufferSource();
  rainNode.buffer = buf;
  rainNode.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  rainGain = c.createGain();
  rainGain.gain.value = 0.04;
  rainNode.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(c.destination);
  rainNode.start();
}

export function stopRain() {
  if (rainNode) {
    rainNode.stop();
    rainNode = null;
    rainGain = null;
  }
}

export function playThunder() {
  burst(1.0, 0.18);
  noise(0.8, 50, 'sine', 0.15);
  noise(1.0, 30, 'square', 0.1);
}
