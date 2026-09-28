import * as pc from 'playcanvas';
import { MaterialFactory } from '../scene/MaterialFactory';

const FACE_PIPS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]]
};

const FINAL_ROTATIONS: Record<number, pc.Vec3> = {
  1: new pc.Vec3(0, 0, 0),
  2: new pc.Vec3(90, 0, 0),
  3: new pc.Vec3(0, 0, -90),
  4: new pc.Vec3(0, 0, 90),
  5: new pc.Vec3(-90, 0, 0),
  6: new pc.Vec3(180, 0, 0)
};

export class Dice {
  readonly root = new pc.Entity('3D Dice');
  private readonly baseScale = 1;

  constructor(private readonly app: pc.Application, private readonly materials: MaterialFactory) {
    const cube = new pc.Entity('Dice Body');
    cube.addComponent('render', { type: 'box' });
    if (cube.render) {
      cube.render.material = materials.dice;
      cube.render.castShadows = true;
      cube.render.receiveShadows = true;
    }
    cube.setLocalScale(0.82, 0.82, 0.82);
    this.root.addChild(cube);
    this.addPips();
    this.root.setPosition(8.6, 1.25, -2.7);
    app.root.addChild(this.root);
  }

  async roll(): Promise<number> {
    const value = 1 + Math.floor(Math.random() * 6);
    const start = this.root.getPosition().clone();
    const startEuler = this.root.getEulerAngles().clone();
    const finalBase = FINAL_ROTATIONS[value];
    const targetEuler = new pc.Vec3(
      finalBase.x + 720 + Math.floor(Math.random() * 2) * 360,
      finalBase.y + 900 + Math.floor(Math.random() * 2) * 360,
      finalBase.z + 720 + Math.floor(Math.random() * 2) * 360
    );

    const sideKick = new pc.Vec3((Math.random() - 0.5) * 0.62, 0, (Math.random() - 0.5) * 0.42);
    const startTime = performance.now();
    const duration = 1180;

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);

        const rx = pc.math.lerp(startEuler.x, targetEuler.x, eased);
        const ry = pc.math.lerp(startEuler.y, targetEuler.y, eased);
        const rz = pc.math.lerp(startEuler.z, targetEuler.z, eased);
        this.root.setEulerAngles(rx, ry, rz);

        // Tiga bounce yang makin kecil untuk rasa dadu fisik.
        const bounceEnvelope = Math.max(0, 1 - t);
        const bounce = Math.abs(Math.sin(t * Math.PI * 3.0)) * bounceEnvelope * 1.45;
        const drift = Math.sin(t * Math.PI) * (1 - t * 0.35);
        this.root.setPosition(
          start.x + sideKick.x * drift,
          start.y + bounce,
          start.z + sideKick.z * drift
        );

        // Squash/stretch ringan saat impact.
        const impactWave = Math.abs(Math.cos(t * Math.PI * 3.0));
        const squash = t > 0.18 ? impactWave * (1 - t) * 0.10 : 0;
        this.root.setLocalScale(
          this.baseScale + squash,
          this.baseScale - squash * 0.65,
          this.baseScale + squash
        );

        if (t < 1) requestAnimationFrame(tick);
        else {
          this.root.setPosition(start);
          this.root.setLocalScale(this.baseScale, this.baseScale, this.baseScale);
          this.root.setEulerAngles(finalBase.x, finalBase.y, finalBase.z);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

    await this.impactPulse(start);
    return value;
  }

  private async impactPulse(world: pc.Vec3) {
    const mat = new pc.StandardMaterial();
    mat.name = 'dice-impact-ring';
    mat.diffuse.set(0, 0, 0);
    mat.emissive.set(0.32, 0.78, 1.0);
    mat.emissiveIntensity = 2.8;
    mat.opacity = 0.78;
    mat.blendType = pc.BLEND_ADDITIVE;
    mat.depthWrite = false;
    mat.update();

    const ring = new pc.Entity('Dice Impact Ring');
    ring.addComponent('render', { type: 'torus' });
    if (ring.render) {
      ring.render.material = mat;
      ring.render.castShadows = false;
      ring.render.receiveShadows = false;
    }
    ring.setEulerAngles(90, 0, 0);
    ring.setPosition(world.x, Math.max(0.08, world.y - 0.48), world.z);
    ring.setLocalScale(0.22, 0.22, 0.03);
    this.app.root.addChild(ring);

    const started = performance.now();
    const duration = 300;
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        const s = pc.math.lerp(0.22, 1.25, 1 - Math.pow(1 - t, 3));
        ring.setLocalScale(s, s, 0.03);
        mat.opacity = 0.78 * (1 - t);
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

  private addPips() {
    const offset = 0.425;
    const spread = 0.18;
    const pipScale = 0.055;

    const addFace = (value: number, face: 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right') => {
      for (const [gx, gy] of FACE_PIPS[value]) {
        const pip = new pc.Entity(`pip-${face}-${gx}-${gy}`);
        pip.addComponent('render', { type: 'sphere' });
        if (pip.render) pip.render.material = this.materials.dicePip;
        pip.setLocalScale(pipScale, pipScale * 0.45, pipScale);

        switch (face) {
          case 'top':
            pip.setLocalPosition(gx * spread, offset, gy * spread);
            break;
          case 'bottom':
            pip.setLocalPosition(gx * spread, -offset, -gy * spread);
            break;
          case 'front':
            pip.setLocalPosition(gx * spread, gy * spread, -offset);
            pip.setLocalEulerAngles(90, 0, 0);
            break;
          case 'back':
            pip.setLocalPosition(-gx * spread, gy * spread, offset);
            pip.setLocalEulerAngles(90, 0, 0);
            break;
          case 'left':
            pip.setLocalPosition(-offset, gy * spread, gx * spread);
            pip.setLocalEulerAngles(0, 0, 90);
            break;
          case 'right':
            pip.setLocalPosition(offset, gy * spread, -gx * spread);
            pip.setLocalEulerAngles(0, 0, 90);
            break;
        }
        this.root.addChild(pip);
      }
    };

    addFace(1, 'top');
    addFace(6, 'bottom');
    addFace(2, 'front');
    addFace(5, 'back');
    addFace(3, 'left');
    addFace(4, 'right');
  }
}
