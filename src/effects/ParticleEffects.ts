import * as pc from 'playcanvas';

interface SparkParticle {
  entity: pc.Entity;
  velocity: pc.Vec3;
}

function emissiveMaterial(name: string, color: pc.Color, intensity: number, opacity = 1) {
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

/** Lightweight procedural sparkle burst without external textures. */
export async function sparkleBurst(app: pc.Application, world: pc.Vec3, color = new pc.Color(1, 0.75, 0.18)) {
  const mat = emissiveMaterial('sparkle-burst', color, 2.2);

  const particles: SparkParticle[] = [];
  for (let i = 0; i < 16; i++) {
    const entity = new pc.Entity(`Spark ${i}`);
    entity.addComponent('render', { type: 'sphere' });
    if (entity.render) entity.render.material = mat;
    entity.setLocalScale(0.07, 0.07, 0.07);
    entity.setPosition(world.clone().add(new pc.Vec3(0, 0.16, 0)));
    app.root.addChild(entity);
    const angle = (i / 16) * Math.PI * 2;
    particles.push({
      entity,
      velocity: new pc.Vec3(Math.cos(angle) * 1.35, 1.1 + Math.random() * 0.8, Math.sin(angle) * 1.35)
    });
  }

  const started = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const dt = 1 / 60;
      const elapsed = (now - started) / 1000;
      particles.forEach((p) => {
        p.velocity.y -= 2.3 * dt;
        const pos = p.entity.getPosition().clone().add(p.velocity.clone().mulScalar(dt));
        p.entity.setPosition(pos);
        const scale = Math.max(0.01, 0.07 * (1 - elapsed / 0.82));
        p.entity.setLocalScale(scale, scale, scale);
      });
      if (elapsed < 0.82) requestAnimationFrame(tick);
      else {
        particles.forEach((p) => p.entity.destroy());
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

/** Expanding luminous ring used to sell each landing on the ascending board. */
export async function landingPulse(app: pc.Application, world: pc.Vec3, color = new pc.Color(0.36, 0.78, 1.0)) {
  const mat = emissiveMaterial('landing-pulse', color, 2.4, 0.72);
  const ring = new pc.Entity('Landing Pulse Ring');
  ring.addComponent('render', { type: 'torus' });
  if (ring.render) {
    ring.render.material = mat;
    ring.render.castShadows = false;
    ring.render.receiveShadows = false;
  }
  ring.setEulerAngles(90, 0, 0);
  ring.setPosition(world.clone().add(new pc.Vec3(0, 0.075, 0)));
  ring.setLocalScale(0.25, 0.25, 0.035);
  app.root.addChild(ring);

  const start = performance.now();
  const duration = 380;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const s = pc.math.lerp(0.25, 1.38, eased);
      ring.setLocalScale(s, s, 0.035);
      mat.opacity = 0.72 * (1 - t);
      mat.update();
      if (t < 1) requestAnimationFrame(tick);
      else {
        ring.destroy();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

/** A short vertical shimmer for dramatic upward progression. */
export async function climbShimmer(app: pc.Application, world: pc.Vec3, height = 0.9) {
  const color = new pc.Color(0.50, 0.82, 1.0);
  const mat = emissiveMaterial('climb-shimmer', color, 2.8, 0.45);
  const pillar = new pc.Entity('Climb Shimmer');
  pillar.addComponent('render', { type: 'cylinder' });
  if (pillar.render) {
    pillar.render.material = mat;
    pillar.render.castShadows = false;
  }
  pillar.setPosition(world.clone().add(new pc.Vec3(0, height / 2, 0)));
  pillar.setLocalScale(0.08, Math.max(0.35, height), 0.08);
  app.root.addChild(pillar);

  const start = performance.now();
  const duration = 300;
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const s = 1 + t * 1.8;
      pillar.setLocalScale(0.08 * s, Math.max(0.35, height) * (1 - t * 0.15), 0.08 * s);
      mat.opacity = 0.45 * (1 - t);
      mat.update();
      if (t < 1) requestAnimationFrame(tick);
      else {
        pillar.destroy();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}
