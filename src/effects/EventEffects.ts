import * as pc from 'playcanvas';
import { sparkleBurst } from './ParticleEffects';

function glowMaterial(name: string, color: pc.Color, intensity: number, opacity = 1) {
  const mat = new pc.StandardMaterial();
  mat.name = name;
  mat.diffuse.set(0, 0, 0);
  mat.emissive.copy(color);
  mat.emissiveIntensity = intensity;
  mat.opacity = opacity;
  if (opacity < 1) {
    mat.blendType = pc.BLEND_ADDITIVE;
    mat.depthWrite = false;
  }
  mat.update();
  return mat;
}

function screenFlash(color: string, duration = 420) {
  const flash = document.createElement('div');
  flash.className = 'event-screen-flash';
  flash.style.setProperty('--event-flash-color', color);
  flash.style.setProperty('--event-flash-duration', `${duration}ms`);
  document.body.appendChild(flash);
  requestAnimationFrame(() => flash.classList.add('show'));
  window.setTimeout(() => flash.remove(), duration + 120);
}

async function risingRings(app: pc.Application, world: pc.Vec3, color: pc.Color) {
  const mat = glowMaterial('ladder-rise', color, 3.2, 0.72);
  const rings: pc.Entity[] = [];
  for (let i = 0; i < 4; i++) {
    const ring = new pc.Entity(`Ladder Rise Ring ${i}`);
    ring.addComponent('render', { type: 'torus' });
    if (ring.render) {
      ring.render.material = mat;
      ring.render.castShadows = false;
      ring.render.receiveShadows = false;
    }
    ring.setEulerAngles(90, 0, 0);
    ring.setPosition(world.x, world.y + 0.08, world.z);
    ring.setLocalScale(0.35 + i * 0.08, 0.35 + i * 0.08, 0.035);
    app.root.addChild(ring);
    rings.push(ring);
  }

  const start = performance.now();
  const duration = 720;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      rings.forEach((ring, i) => {
        const local = pc.math.clamp((t - i * 0.10) / 0.72, 0, 1);
        ring.setPosition(world.x, world.y + 0.10 + local * 1.65, world.z);
        const s = 0.35 + local * 0.82;
        ring.setLocalScale(s, s, 0.035);
      });
      mat.opacity = 0.72 * (1 - t);
      mat.update();
      if (t < 1) requestAnimationFrame(tick);
      else {
        rings.forEach((ring) => ring.destroy());
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

async function warningRings(app: pc.Application, world: pc.Vec3, color: pc.Color) {
  const mat = glowMaterial('snake-warning', color, 3.0, 0.82);
  const rings: pc.Entity[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new pc.Entity(`Snake Warning Ring ${i}`);
    ring.addComponent('render', { type: 'torus' });
    if (ring.render) ring.render.material = mat;
    ring.setEulerAngles(90, 0, 0);
    ring.setPosition(world.x, world.y + 0.08, world.z);
    ring.setLocalScale(0.25, 0.25, 0.04);
    app.root.addChild(ring);
    rings.push(ring);
  }

  const light = new pc.Entity('Snake Warning Light');
  light.addComponent('light', {
    type: 'omni',
    color,
    intensity: 3.2,
    range: 5.2,
    castShadows: false
  });
  light.setPosition(world.x, world.y + 0.85, world.z);
  app.root.addChild(light);

  const start = performance.now();
  const duration = 620;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      rings.forEach((ring, i) => {
        const pulse = Math.max(0, Math.sin((t * 2.2 - i * 0.16) * Math.PI));
        const s = 0.30 + t * 1.35 + pulse * 0.18;
        ring.setLocalScale(s, s, 0.04);
      });
      mat.opacity = 0.82 * (1 - t);
      mat.update();
      if (light.light) light.light.intensity = 2.5 + Math.sin(t * Math.PI * 6) * 1.2;
      if (t < 1) requestAnimationFrame(tick);
      else {
        rings.forEach((ring) => ring.destroy());
        light.destroy();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

export async function ladderSuccessEffect(app: pc.Application, world: pc.Vec3) {
  screenFlash('rgba(255,201,72,.30)', 420);
  await Promise.all([
    risingRings(app, world, new pc.Color(1.0, 0.72, 0.15)),
    sparkleBurst(app, world, new pc.Color(1.0, 0.78, 0.20))
  ]);
}

export async function snakePenaltyEffect(app: pc.Application, world: pc.Vec3) {
  screenFlash('rgba(255,67,79,.28)', 520);
  await warningRings(app, world, new pc.Color(1.0, 0.12, 0.16));
}

export async function snakeEscapeEffect(app: pc.Application, world: pc.Vec3) {
  screenFlash('rgba(74,231,151,.20)', 360);
  await sparkleBurst(app, world, new pc.Color(0.34, 1.0, 0.58));
}

export async function bonusCelebrationEffect(app: pc.Application, world: pc.Vec3) {
  screenFlash('rgba(92,190,255,.20)', 360);
  await Promise.all([
    risingRings(app, world, new pc.Color(0.30, 0.78, 1.0)),
    sparkleBurst(app, world, new pc.Color(0.42, 0.85, 1.0))
  ]);
}
