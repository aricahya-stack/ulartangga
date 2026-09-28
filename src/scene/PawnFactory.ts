import * as pc from 'playcanvas';
import { MaterialFactory, type PawnMaterialStyle } from './MaterialFactory';

export interface PawnVisual {
  root: pc.Entity;
  bodyParts: pc.Entity[];
  accentParts: pc.Entity[];
  color: pc.Color;
  style: PawnMaterialStyle;
}

export class PawnFactory {
  constructor(private readonly materials: MaterialFactory) {}

  create(name: string, color: pc.Color, style: PawnMaterialStyle): PawnVisual {
    const root = new pc.Entity(name);
    const bodyMat = this.materials.pawn(style, color);
    const accentMat = this.materials.pawnAccent(style, color);
    const bodyParts: pc.Entity[] = [];
    const accentParts: pc.Entity[] = [];

    const add = (
      partName: string,
      type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus',
      mat: pc.StandardMaterial,
      pos: pc.Vec3,
      scale: pc.Vec3,
      collection: pc.Entity[]
    ) => {
      const e = new pc.Entity(`${name}-${partName}`);
      e.addComponent('render', { type });
      if (e.render) {
        e.render.material = mat;
        e.render.castShadows = true;
        e.render.receiveShadows = true;
      }
      e.setLocalPosition(pos);
      e.setLocalScale(scale);
      root.addChild(e);
      collection.push(e);
      return e;
    };

    add('base', 'cylinder', accentMat, new pc.Vec3(0, 0.10, 0), new pc.Vec3(0.66, 0.18, 0.66), accentParts);
    add('lower-body', 'cone', bodyMat, new pc.Vec3(0, 0.43, 0), new pc.Vec3(0.48, 0.62, 0.48), bodyParts);
    add('torso', 'cylinder', bodyMat, new pc.Vec3(0, 0.73, 0), new pc.Vec3(0.34, 0.44, 0.34), bodyParts);
    add('shoulder', 'sphere', bodyMat, new pc.Vec3(0, 0.94, 0), new pc.Vec3(0.52, 0.22, 0.44), bodyParts);
    add('neck', 'cylinder', accentMat, new pc.Vec3(0, 1.06, 0), new pc.Vec3(0.16, 0.13, 0.16), accentParts);
    add('head', 'sphere', accentMat, new pc.Vec3(0, 1.27, 0), new pc.Vec3(0.36, 0.36, 0.36), accentParts);
    add('collar', 'torus', bodyMat, new pc.Vec3(0, 1.07, 0), new pc.Vec3(0.30, 0.08, 0.30), bodyParts);
    add('badge', 'box', accentMat, new pc.Vec3(0, 0.72, -0.19), new pc.Vec3(0.15, 0.12, 0.035), accentParts);

    return { root, bodyParts, accentParts, color: color.clone(), style };
  }

  applyStyle(visual: PawnVisual, style: PawnMaterialStyle) {
    visual.style = style;
    const bodyMat = this.materials.pawn(style, visual.color);
    const accentMat = this.materials.pawnAccent(style, visual.color);
    visual.bodyParts.forEach((e) => { if (e.render) e.render.material = bodyMat; });
    visual.accentParts.forEach((e) => { if (e.render) e.render.material = accentMat; });
  }
}
