import * as THREE from 'three';

const DAY = new THREE.Color(0x87ceeb);
const NIGHT = new THREE.Color(0x070b21);
const DUSK = new THREE.Color(0xf28c4f);
const RAIN_DAY = new THREE.Color(0x607080);
const RAIN_NIGHT = new THREE.Color(0x050912);

const RAIN_COUNT = 100;
const RAIN_SPREAD = 32;

export class Sky {
  constructor(scene) {
    this.sun = new THREE.DirectionalLight(0xffffff, 1);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(this.sun, this.ambient);
    this.cycleSeconds = 240;
    this.time = this.cycleSeconds * 0.12;
    this.color = new THREE.Color();
    this.dayFactor = 1;
    this.color.copy(DAY);

    this.weather = 'clear';
    this.weatherTimer = 60 + Math.random() * 120;
    this.rainParticles = [];
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * RAIN_SPREAD;
      this.rainPositions[i * 3 + 1] = Math.random() * 40;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_SPREAD;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainMat = new THREE.PointsMaterial({ color: 0xaabbcc, size: 0.15, transparent: true, opacity: 0.6 });
    this.rainMesh = new THREE.Points(this.rainGeo, this.rainMat);
    this.rainMesh.visible = false;
    scene.add(this.rainMesh);
    this.scene = scene;
    this.thunderFlash = 0;
  }

  isDay() {
    return this.dayFactor > 0.55;
  }

  isNight() {
    return this.dayFactor < 0.35;
  }

  isRaining() {
    return this.weather === 'rain' || this.weather === 'thunder';
  }

  isThunder() {
    return this.weather === 'thunder';
  }

  setTimePreset(preset) {
    const map = {
      day: 0.25,
      afternoon: 0.38,
      night: 0.62,
      midnight: 0.75,
    };
    this.time = this.cycleSeconds * (map[preset] ?? 0.25);
  }

  update(dt, scene) {
    this.time = (this.time + dt) % this.cycleSeconds;
    const angle = (this.time / this.cycleSeconds) * Math.PI * 2;
    const sy = Math.sin(angle);
    const sx = Math.cos(angle);

    if (sy >= -0.05) this.sun.position.set(sx * 100, sy * 100, 40);
    else this.sun.position.set(-sx * 100, -sy * 100, -40);

    const day = THREE.MathUtils.smoothstep(sy, -0.12, 0.25);
    this.dayFactor = day;
    const dusk = Math.max(0, 1 - Math.abs(sy) / 0.3);

    const rainy = this.isRaining();
    if (rainy) {
      this.color.copy(this.isNight() ? RAIN_NIGHT : RAIN_DAY);
      const grayFactor = 0.3 + day * 0.3;
      this.color.lerp(new THREE.Color(0x556677), grayFactor);
    } else {
      this.color.copy(NIGHT).lerp(DAY, day).lerp(DUSK, dusk * (0.25 + day * 0.4));
    }

    this.sun.intensity = rainy ? (0.04 + day * 0.5) : (0.08 + day * 1.1);
    this.ambient.intensity = rainy ? (0.2 + day * 0.25) : (0.25 + day * 0.55);
    scene.background = this.color;
    scene.fog.color.copy(this.color);

    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const r = Math.random();
      if (r < 0.5) this.weather = 'clear';
      else if (r < 0.8) this.weather = 'rain';
      else this.weather = 'thunder';
      this.weatherTimer = 120 + Math.random() * 180;
      this.rainMesh.visible = this.isRaining();
    }

    if (this.isRaining()) {
      const camX = scene._cameraX ?? 0;
      const camY = scene._cameraY ?? 0;
      const camZ = scene._cameraZ ?? 0;
      for (let i = 0; i < RAIN_COUNT; i++) {
        this.rainPositions[i * 3 + 1] -= dt * 30;
        if (this.rainPositions[i * 3 + 1] < -5) {
          this.rainPositions[i * 3] = camX + (Math.random() - 0.5) * RAIN_SPREAD;
          this.rainPositions[i * 3 + 1] = camY + 20 + Math.random() * 20;
          this.rainPositions[i * 3 + 2] = camZ + (Math.random() - 0.5) * RAIN_SPREAD;
        }
      }
      this.rainGeo.attributes.position.needsUpdate = true;
    }

    if (this.isThunder()) {
      this.thunderFlash -= dt;
      if (this.thunderFlash <= 0 && Math.random() < dt * 0.3) {
        this.thunderFlash = 0.15 + Math.random() * 0.2;
      }
    } else {
      this.thunderFlash = 0;
    }
  }
}
