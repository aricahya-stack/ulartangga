import * as pc from 'playcanvas';
import type { Competency } from '../game/Board';

export type PawnMaterialStyle = 'glossy' | 'metallic' | 'matte' | 'marble';

const ZONE_COLORS: Record<Competency, pc.Color> = {
  Pedagogik: new pc.Color(0.18, 0.55, 0.95),
  Profesional: new pc.Color(0.48, 0.31, 0.90),
  Kepribadian: new pc.Color(0.96, 0.50, 0.12),
  Sosial: new pc.Color(0.18, 0.68, 0.39),
  Integratif: new pc.Color(0.88, 0.18, 0.34)
};

function material(name: string, diffuse: pc.Color, metalness: number, gloss: number, emissive?: pc.Color) {
  const mat = new pc.StandardMaterial();
  mat.name = name;
  mat.diffuse.copy(diffuse);
  mat.useMetalness = true;
  mat.metalness = metalness;
  mat.gloss = gloss;
  if (emissive) {
    mat.emissive.copy(emissive);
    mat.emissiveIntensity = 1.2;
  }
  mat.update();
  return mat;
}

export class MaterialFactory {
  private marbleTexture: pc.Texture | null = null;
  private readonly marbleMaterials: pc.StandardMaterial[] = [];
  readonly boardBase = material('board-base-premium', new pc.Color(0.055, 0.07, 0.09), 0.58, 0.72);
  readonly boardMetal = material('board-metal-trim', new pc.Color(0.22, 0.24, 0.28), 0.85, 0.88);
  readonly darkWood = material('dark-walnut', new pc.Color(0.24, 0.105, 0.035), 0.08, 0.52);
  readonly felt = material('felt', new pc.Color(0.035, 0.16, 0.13), 0.0, 0.12);
  readonly ladderWood = material('ladder-warm-oak', new pc.Color(0.55, 0.32, 0.095), 0.02, 0.38);
  readonly ladderMetal = material('ladder-cap', new pc.Color(0.64, 0.50, 0.25), 0.52, 0.74);
  readonly snakeGreen = material('snake-scales', new pc.Color(0.11, 0.48, 0.20), 0.06, 0.52);
  readonly snakeBelly = material('snake-belly', new pc.Color(0.78, 0.68, 0.38), 0.0, 0.28);
  readonly snakeEye = material('snake-eye', new pc.Color(0.01, 0.01, 0.012), 0.22, 0.92, new pc.Color(0.02, 0.02, 0.02));
  readonly tongue = material('snake-tongue', new pc.Color(0.72, 0.04, 0.08), 0.0, 0.42, new pc.Color(0.08, 0.0, 0.0));
  readonly dice = material('dice-ivory', new pc.Color(0.92, 0.91, 0.84), 0.08, 0.82);
  readonly dicePip = material('dice-pip', new pc.Color(0.025, 0.028, 0.032), 0.3, 0.72);

  loadProceduralTextures(app: pc.Application) {
    const load = (url: string, apply: (texture: pc.Texture) => void) => {
      app.assets.loadFromUrl(url, 'texture', (err, asset) => {
        if (err || !asset?.resource) return;
        const texture = asset.resource as pc.Texture;
        apply(texture);
      });
    };

    load('/textures/walnut-procedural.png', (texture) => {
      this.darkWood.diffuseMap = texture;
      this.darkWood.diffuseMapTiling.set(2.2, 1.2);
      this.darkWood.update();
    });
    load('/textures/board-felt.png', (texture) => {
      this.felt.diffuseMap = texture;
      this.felt.diffuseMapTiling.set(4, 2);
      this.felt.update();
    });
    load('/textures/snake-scales-procedural.png', (texture) => {
      this.snakeGreen.diffuseMap = texture;
      this.snakeGreen.diffuseMapTiling.set(5, 2);
      this.snakeGreen.update();
    });
    load('/textures/marble-procedural.png', (texture) => {
      this.marbleTexture = texture;
      this.marbleMaterials.forEach((mat) => {
        mat.diffuseMap = texture;
        mat.diffuseMapTiling.set(1.4, 2.2);
        mat.update();
      });
    });
  }

  tile(competency: Competency, special: 'normal' | 'bonus' | 'final' = 'normal') {
    const color = ZONE_COLORS[competency].clone();
    let emissive: pc.Color | undefined;
    if (special === 'bonus') emissive = new pc.Color(0.12, 0.09, 0.012);
    if (special === 'final') {
      color.set(0.96, 0.24, 0.33);
      emissive = new pc.Color(0.48, 0.18, 0.03);
    }
    return material(`tile-${competency}-${special}`, color, 0.08, 0.68, emissive);
  }

  pawn(style: PawnMaterialStyle, color: pc.Color, accent = new pc.Color(0.95, 0.97, 1.0)) {
    const mat = new pc.StandardMaterial();
    mat.name = `pawn-${style}`;
    mat.diffuse.copy(color);
    mat.useMetalness = true;

    switch (style) {
      case 'metallic':
        mat.metalness = 0.88;
        mat.gloss = 0.90;
        break;
      case 'matte':
        mat.metalness = 0.03;
        mat.gloss = 0.24;
        break;
      case 'marble':
        mat.metalness = 0.04;
        mat.gloss = 0.76;
        mat.specular.copy(accent);
        if (this.marbleTexture) {
          mat.diffuseMap = this.marbleTexture;
          mat.diffuseMapTiling.set(1.4, 2.2);
        }
        this.marbleMaterials.push(mat);
        break;
      default:
        mat.metalness = 0.10;
        mat.gloss = 0.86;
    }
    mat.update();
    return mat;
  }

  pawnAccent(style: PawnMaterialStyle, color: pc.Color) {
    const accent = new pc.Color(
      Math.min(1, color.r * 0.45 + 0.55),
      Math.min(1, color.g * 0.45 + 0.55),
      Math.min(1, color.b * 0.45 + 0.55)
    );
    return this.pawn(style === 'matte' ? 'matte' : 'glossy', accent, new pc.Color(1, 1, 1));
  }
}
