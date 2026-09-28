import * as pc from 'playcanvas';

function makeGlowMaterial(name: string, color: pc.Color, intensity: number, opacity = 1) {
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

export class FinalTileEffects {
  readonly root = new pc.Entity('Final Tile Effects');
  private time = 0;
  private readonly light: pc.Entity;
  private readonly rings: pc.Entity[] = [];
  private readonly beacon: pc.Entity;
  private readonly crown: pc.Entity;

  constructor(private readonly app: pc.Application, world: pc.Vec3) {
    this.root.setPosition(world.x, world.y + 0.18, world.z);
    app.root.addChild(this.root);

    const gold = new pc.Color(1.0, 0.67, 0.12);
    const warmWhite = new pc.Color(1.0, 0.92, 0.62);
    const ringMat = makeGlowMaterial('final-ring', gold, 2.8, 0.72);
    const beaconMat = makeGlowMaterial('final-beacon', warmWhite, 3.5, 0.24);
    const crownMat = makeGlowMaterial('final-crown', gold, 4.2, 1.0);

    for (let i = 0; i < 3; i++) {
      const ring = new pc.Entity(`Final Halo ${i + 1}`);
      ring.addComponent('render', { type: 'torus' });
      if (ring.render) {
        ring.render.material = ringMat;
        ring.render.castShadows = false;
        ring.render.receiveShadows = false;
      }
      ring.setLocalEulerAngles(90, 0, 0);
      ring.setLocalScale(1.35 + i * 0.26, 1.35 + i * 0.26, 0.045);
      ring.setLocalPosition(0, 0.05 + i * 0.035, 0);
      this.root.addChild(ring);
      this.rings.push(ring);
    }

    this.beacon = new pc.Entity('Final Beacon');
    this.beacon.addComponent('render', { type: 'cylinder' });
    if (this.beacon.render) {
      this.beacon.render.material = beaconMat;
      this.beacon.render.castShadows = false;
      this.beacon.render.receiveShadows = false;
    }
    this.beacon.setLocalScale(0.42, 3.8, 0.42);
    this.beacon.setLocalPosition(0, 1.85, 0);
    this.root.addChild(this.beacon);

    this.crown = new pc.Entity('Final Crown');
    this.crown.addComponent('render', { type: 'sphere' });
    if (this.crown.render) {
      this.crown.render.material = crownMat;
      this.crown.render.castShadows = false;
    }
    this.crown.setLocalScale(0.28, 0.28, 0.28);
    this.crown.setLocalPosition(0, 1.25, 0);
    this.root.addChild(this.crown);

    this.light = new pc.Entity('Final Golden Light');
    this.light.addComponent('light', {
      type: 'omni',
      color: gold,
      intensity: 4.0,
      range: 7.5,
      castShadows: false
    });
    this.light.setLocalPosition(0, 1.35, 0);
    this.root.addChild(this.light);

    app.on('update', (dt: number) => this.update(dt));
  }

  private update(dt: number) {
    this.time += dt;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.25);
    const breathe = 0.92 + pulse * 0.12;

    this.rings.forEach((ring, i) => {
      const phase = this.time * (0.55 + i * 0.08) + i * 1.7;
      ring.setLocalEulerAngles(90, phase * 14, phase * 4);
      const base = 1.35 + i * 0.26;
      const scale = base * (0.95 + 0.08 * Math.sin(phase * 2));
      ring.setLocalScale(scale, scale, 0.045);
    });

    this.beacon.setLocalScale(0.40 + pulse * 0.08, 3.8 + pulse * 0.35, 0.40 + pulse * 0.08);
    this.crown.setLocalScale(0.28 * breathe, 0.28 * breathe, 0.28 * breathe);
    this.crown.setLocalEulerAngles(0, this.time * 42, 0);

    if (this.light.light) {
      this.light.light.intensity = 3.6 + pulse * 2.4;
      this.light.light.range = 7.0 + pulse * 1.8;
    }
  }
}
