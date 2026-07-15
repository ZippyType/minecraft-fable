import * as THREE from 'three';
import { MOB } from '../entities/mobTypes.js';

function tex(draw, size = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function mat(draw, size = 16) {
  return new THREE.MeshLambertMaterial({ map: tex(draw, size) });
}

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function skin(ctx, s, base, dark, light) {
  px(ctx, 0, 0, s, s, base);
  px(ctx, 2, 3, 3, 2, dark);
  px(ctx, s - 5, 3, 3, 2, dark);
  px(ctx, 4, 8, s - 8, 2, dark);
  px(ctx, 1, 1, 2, 2, light);
}

function box(group, w, h, d, x, y, z, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y + h / 2, z);
  group.add(m);
  return m;
}

function humanoid(group, textures, scale = 1) {
  const s = scale;
  const head = box(group, 0.5 * s, 0.5 * s, 0.5 * s, 0, 1.5 * s, 0, textures.head);
  const body = box(group, 0.5 * s, 0.75 * s, 0.25 * s, 0, 0.75 * s, 0, textures.body);
  const legL = box(group, 0.25 * s, 0.75 * s, 0.25 * s, -0.125 * s, 0, 0, textures.legs);
  const legR = box(group, 0.25 * s, 0.75 * s, 0.25 * s, 0.125 * s, 0, 0, textures.legs);
  const armL = box(group, 0.25 * s, 0.75 * s, 0.25 * s, -0.375 * s, 0.75 * s, 0, textures.arms ?? textures.body);
  const armR = box(group, 0.25 * s, 0.75 * s, 0.25 * s, 0.375 * s, 0.75 * s, 0, textures.arms ?? textures.body);
  return { head, body, legL, legR, armL, armR };
}

const MOB_BUILDS = {
  [MOB.ZOMBIE]: () => {
    const g = new THREE.Group();
    humanoid(g, {
      head: mat((ctx, s) => skin(ctx, s, '#5a8f4a', '#3d6b32', '#7cb86c')),
      body: mat((ctx, s) => {
        px(ctx, 0, 0, s, s, '#3a4a5a');
        px(ctx, 2, 2, s - 4, s - 6, '#4a5a6a');
        px(ctx, 4, 10, 4, 4, '#6a5040');
      }),
      arms: mat((ctx, s) => skin(ctx, s, '#5a8f4a', '#3d6b32', '#7cb86c')),
      legs: mat((ctx, s) => {
        px(ctx, 0, 0, s, s, '#2a3a6a');
        px(ctx, 2, 0, s - 4, 4, '#1a2a5a');
      }),
    });
    return g;
  },

  [MOB.SKELETON]: () => {
    const g = new THREE.Group();
    humanoid(g, {
      head: mat((ctx, s) => {
        px(ctx, 0, 0, s, s, '#d8d8c8');
        px(ctx, 3, 4, 3, 4, '#1a1a1a');
        px(ctx, s - 6, 4, 3, 4, '#1a1a1a');
        px(ctx, 5, 10, 6, 2, '#1a1a1a');
      }),
      body: mat((ctx, s) => {
        px(ctx, 0, 0, s, s, '#d8d8c8');
        for (let y = 2; y < s; y += 3) px(ctx, 6, y, 4, 1, '#b8b8a8');
      }),
      arms: mat((ctx, s) => {
        px(ctx, 0, 0, s, s, '#d8d8c8');
        px(ctx, 6, 0, 4, s, '#c8c8b8');
      }),
      legs: mat((ctx, s) => {
        px(ctx, 0, 0, s, s, '#d0d0c0');
        px(ctx, 5, 0, 6, s, '#b8b8a8');
      }),
    });
    return g;
  },

  [MOB.CREEPER]: () => {
    const g = new THREE.Group();
    const green = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#4a9a3a');
      px(ctx, 1, 1, 4, 4, '#3a7a2a');
      px(ctx, s - 5, 1, 4, 4, '#3a7a2a');
      px(ctx, 2, 6, 3, 3, '#2a5a1a');
      px(ctx, s - 5, 6, 3, 3, '#2a5a1a');
    });
    const body = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#5aaa4a');
      px(ctx, 2, 2, 5, 8, '#4a9a3a');
      px(ctx, s - 7, 2, 5, 8, '#4a9a3a');
      px(ctx, 4, 4, 8, 6, '#3a8a2a');
    });
    const leg = mat((ctx, s) => px(ctx, 0, 0, s, s, '#3a7a2a'));
    box(g, 0.5, 0.5, 0.5, 0, 1.35, 0, green);
    box(g, 0.5, 0.85, 0.35, 0, 0.65, 0, body);
    box(g, 0.3, 0.45, 0.3, -0.15, 0, 0.1, leg);
    box(g, 0.3, 0.45, 0.3, 0.15, 0, 0.1, leg);
    box(g, 0.3, 0.45, 0.3, -0.15, 0, -0.2, leg);
    box(g, 0.3, 0.45, 0.3, 0.15, 0, -0.2, leg);
    return g;
  },

  [MOB.ENDERMAN]: () => {
    const g = new THREE.Group();
    const black = mat((ctx, s) => px(ctx, 0, 0, s, s, '#121018'));
    const eye = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#121018');
      px(ctx, 2, 5, 4, 3, '#c040ff');
      px(ctx, s - 6, 5, 4, 3, '#c040ff');
      px(ctx, 4, 5, 2, 2, '#e080ff');
      px(ctx, s - 6, 5, 2, 2, '#e080ff');
    });
    box(g, 0.45, 0.45, 0.45, 0, 2.55, 0, eye);
    box(g, 0.45, 1.4, 0.25, 0, 1.35, 0, black);
    box(g, 0.2, 1.35, 0.2, -0.15, 0, 0, black);
    box(g, 0.2, 1.35, 0.2, 0.15, 0, 0, black);
    box(g, 0.2, 1.5, 0.2, -0.35, 1.5, 0, black);
    box(g, 0.2, 1.5, 0.2, 0.35, 1.5, 0, black);
    return g;
  },

  [MOB.SHEEP]: () => {
    const g = new THREE.Group();
    const wool = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#e8e8e8');
      px(ctx, 1, 2, 3, 3, '#d0d0d0');
      px(ctx, s - 4, 3, 3, 3, '#d8d8d8');
      px(ctx, 3, s - 4, 4, 3, '#d0d0d0');
    });
    const face = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#b0b0b0');
      px(ctx, 3, 4, 3, 3, '#2a2a2a');
      px(ctx, s - 6, 4, 3, 3, '#2a2a2a');
      px(ctx, 5, 9, 6, 3, '#909090');
    });
    const leg = mat((ctx, s) => px(ctx, 0, 0, s, s, '#a0a0a0'));
    box(g, 0.55, 0.55, 0.55, 0, 0.85, 0, face);
    box(g, 0.9, 0.65, 0.7, 0, 0.55, 0, wool);
    for (const [x, z] of [[-0.22, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]]) {
      box(g, 0.15, 0.45, 0.15, x, 0, z, leg);
    }
    return g;
  },

  [MOB.CHICKEN]: () => {
    const g = new THREE.Group();
    const white = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#f0f0e8');
      px(ctx, 2, 3, 4, 5, '#e8e8e0');
    });
    const head = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#f0f0e8');
      px(ctx, s - 4, 6, 4, 3, '#e8a020');
      px(ctx, 5, 1, 5, 3, '#c02020');
      px(ctx, 3, 7, 3, 3, '#1a1a1a');
    });
    const leg = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#e8a020');
      px(ctx, 4, 0, 2, s, '#c08010');
      px(ctx, 9, 0, 2, s, '#c08010');
    });
    box(g, 0.35, 0.35, 0.35, 0, 0.55, 0.1, head);
    box(g, 0.45, 0.4, 0.45, 0, 0.3, 0, white);
    box(g, 0.12, 0.35, 0.12, -0.1, 0, 0.08, leg);
    box(g, 0.12, 0.35, 0.12, 0.1, 0, 0.08, leg);
    return g;
  },

  [MOB.COW]: () => {
    const g = new THREE.Group();
    const body = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#6b4226');
      px(ctx, 2, 3, 5, 6, '#f0e8e0');
      px(ctx, s - 7, 5, 4, 5, '#e8e0d8');
      px(ctx, 6, s - 6, 5, 4, '#f0e8e0');
    });
    const head = mat((ctx, s) => {
      px(ctx, 0, 0, s, s, '#6b4226');
      px(ctx, 2, 5, 4, 4, '#f0e8e0');
      px(ctx, 3, 9, 5, 4, '#e8d8c8');
      px(ctx, 3, 4, 3, 3, '#1a1a1a');
      px(ctx, s - 6, 4, 3, 3, '#1a1a1a');
      px(ctx, s - 3, 8, 3, 4, '#d8c8b8');
    });
    const leg = mat((ctx, s) => px(ctx, 0, 0, s, s, '#4a3020'));
    box(g, 0.45, 0.45, 0.45, 0, 1.05, 0.35, head);
    box(g, 1.0, 0.7, 0.55, 0, 0.55, 0, body);
    for (const [x, z] of [[-0.3, 0.18], [0.3, 0.18], [-0.3, -0.18], [0.3, -0.18]]) {
      box(g, 0.18, 0.55, 0.18, x, 0, z, leg);
    }
    return g;
  },
};

export function buildMobMesh(type) {
  const fn = MOB_BUILDS[type];
  return fn ? fn() : MOB_BUILDS[MOB.ZOMBIE]();
}

export function buildPlayerMesh(skin) {
  const g = new THREE.Group();
  humanoid(g, {
    head: mat((ctx, s) => {
      px(ctx, 0, 0, s, s, skin.skin);
      px(ctx, 0, 0, s, 3, skin.hair);
      px(ctx, 3, 5, 3, 2, '#fff');
      px(ctx, s - 6, 5, 3, 2, '#fff');
      px(ctx, 4, 6, 2, 1, '#000');
      px(ctx, s - 6, 6, 2, 1, '#000');
    }),
    body: mat((ctx, s) => {
      px(ctx, 0, 0, s, s, skin.shirt);
    }),
    arms: mat((ctx, s) => {
      px(ctx, 0, 0, s, s, skin.skin);
    }),
    legs: mat((ctx, s) => {
      px(ctx, 0, 0, s, s, skin.pants);
    }),
  });
  return g;
}
