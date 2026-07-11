// Seeded classic Perlin noise (2D + 3D) — no dependencies.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Perlin {
  constructor(seed = 1337) {
    const rand = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = (rand() * (i + 1)) | 0;
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  grad2(h, x, y) {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }

  grad3(h, x, y, z) {
    h &= 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  // Returns roughly [-1, 1].
  noise2(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const p = this.perm;
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return this.lerp(
      this.lerp(this.grad2(p[A], x, y), this.grad2(p[B], x - 1, y), u),
      this.lerp(this.grad2(p[A + 1], x, y - 1), this.grad2(p[B + 1], x - 1, y - 1), u),
      v
    ) * 0.7;
  }

  // Returns roughly [-1, 1].
  noise3(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const p = this.perm;
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return this.lerp(
      this.lerp(
        this.lerp(this.grad3(p[AA], x, y, z), this.grad3(p[BA], x - 1, y, z), u),
        this.lerp(this.grad3(p[AB], x, y - 1, z), this.grad3(p[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.grad3(p[AA + 1], x, y, z - 1), this.grad3(p[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad3(p[AB + 1], x, y - 1, z - 1), this.grad3(p[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }
}
