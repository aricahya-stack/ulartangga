import * as pc from 'playcanvas';
import { MaterialFactory } from './MaterialFactory';

function box(name: string, parent: pc.Entity, material: pc.StandardMaterial, scale: pc.Vec3, position: pc.Vec3) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type: 'box' });
  if (e.render) {
    e.render.material = material;
    e.render.castShadows = true;
    e.render.receiveShadows = true;
  }
  e.setLocalScale(scale);
  e.setLocalPosition(position);
  parent.addChild(e);
  return e;
}

export class LadderFactory {
  constructor(private readonly app: pc.Application, private readonly materials: MaterialFactory) {}

  create(name: string, start: pc.Vec3, end: pc.Vec3) {
    const root = new pc.Entity(name);
    this.app.root.addChild(root);

    const delta = end.clone().sub(start);
    const distanceXZ = Math.hypot(delta.x, delta.z);
    const distance = delta.length();
    root.setPosition(start.clone().add(end).mulScalar(0.5));
    const yaw = Math.atan2(delta.z, delta.x) * pc.math.RAD_TO_DEG;
    const pitch = Math.atan2(delta.y, Math.max(0.0001, distanceXZ)) * pc.math.RAD_TO_DEG;
    root.setEulerAngles(0, -yaw, pitch);

    box(`${name}-rail-a`, root, this.materials.ladderWood, new pc.Vec3(distance, 0.13, 0.13), new pc.Vec3(0, 0, -0.31));
    box(`${name}-rail-b`, root, this.materials.ladderWood, new pc.Vec3(distance, 0.13, 0.13), new pc.Vec3(0, 0, 0.31));

    const rungCount = Math.max(5, Math.round(distance / 0.58));
    for (let i = 0; i < rungCount; i++) {
      const t = rungCount === 1 ? 0.5 : i / (rungCount - 1);
      const x = -distance / 2 + t * distance;
      box(`${name}-rung-${i}`, root, this.materials.ladderWood, new pc.Vec3(0.12, 0.11, 0.74), new pc.Vec3(x, 0.04, 0));
    }

    for (const x of [-distance / 2, distance / 2]) {
      const cap = new pc.Entity(`${name}-cap-${x}`);
      cap.addComponent('render', { type: 'sphere' });
      if (cap.render) {
        cap.render.material = this.materials.ladderMetal;
        cap.render.castShadows = true;
      }
      cap.setLocalScale(0.18, 0.10, 0.75);
      cap.setLocalPosition(x, 0.02, 0);
      root.addChild(cap);
    }
    return root;
  }
}
