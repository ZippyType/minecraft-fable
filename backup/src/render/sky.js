import * as THREE from 'three';

const DAY = new THREE.Color(0x87ceeb);
const NIGHT = new THREE.Color(0x070b21);
const DUSK = new THREE.Color(0xf28c4f);

export class Sky {
  constructor(scene) {
    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(this.sun, this.ambient);
    this.cycleSeconds = 240;
    this.time = this.cycleSeconds * 0.12; // start mid-morning
    this.color = new THREE.Color();
  }

  update(dt, scene) {
    this.time = (this.time + dt) % this.cycleSeconds;
    const angle = (this.time / this.cycleSeconds) * Math.PI * 2; // 0 = sunrise
    const sy = Math.sin(angle);
    const sx = Math.cos(angle);

    // Below the horizon the light flips to the opposite side: moonlight.
    if (sy >= -0.05) this.sun.position.set(sx * 100, sy * 100, 40);
    else this.sun.position.set(-sx * 100, -sy * 100, -40);

    const day = THREE.MathUtils.smoothstep(sy, -0.12, 0.25);
    const dusk = Math.max(0, 1 - Math.abs(sy) / 0.3);
    this.color.copy(NIGHT).lerp(DAY, day).lerp(DUSK, dusk * (0.25 + day * 0.4));

    this.sun.intensity = 0.08 + day * 1.1;
    this.ambient.intensity = 0.25 + day * 0.55;
    scene.background = this.color;
    scene.fog.color.copy(this.color);
  }
}
