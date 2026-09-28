import * as pc from 'playcanvas';
import { Board } from '../game/Board';
import { BONUS_TILES } from '../game/TileEvent';
import { MaterialFactory } from './MaterialFactory';

function primitive(
  name: string,
  type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus',
  material: pc.StandardMaterial,
  position: pc.Vec3,
  scale: pc.Vec3,
  parent: pc.Entity
) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type });
  if (e.render) {
    e.render.material = material;
    e.render.castShadows = true;
    e.render.receiveShadows = true;
  }
  e.setLocalPosition(position);
  e.setLocalScale(scale);
  parent.addChild(e);
  return e;
}

export class BoardFactory {
  readonly root = new pc.Entity('Premium Board');

  constructor(
    private readonly app: pc.Application,
    private readonly board: Board,
    private readonly materials: MaterialFactory
  ) {}

  create() {
    this.app.root.addChild(this.root);

    primitive('Base', 'box', this.materials.boardBase, new pc.Vec3(0, -0.24, 0), new pc.Vec3(16.9, 0.48, 9.08), this.root);
    primitive('Walnut Frame', 'box', this.materials.darkWood, new pc.Vec3(0, -0.45, 0), new pc.Vec3(17.45, 0.22, 9.62), this.root);
    primitive('Metal Inlay', 'box', this.materials.boardMetal, new pc.Vec3(0, -0.31, 0), new pc.Vec3(17.04, 0.12, 9.22), this.root);
    primitive('Felt Surface', 'box', this.materials.felt, new pc.Vec3(0, -0.05, 0), new pc.Vec3(16.12, 0.08, 8.12), this.root);

    const tileMaterials = new Map<string, pc.StandardMaterial>();
    const pedestalBaseY = -0.01;
    for (let tile = 1; tile <= 50; tile++) {
      const competency = this.board.competencyFor(tile);
      const special = tile === 50 ? 'final' : BONUS_TILES.has(tile) ? 'bonus' : 'normal';
      const key = `${competency}-${special}`;
      if (!tileMaterials.has(key)) tileMaterials.set(key, this.materials.tile(competency, special));
      const pos = this.board.tilePosition(tile);
      const tileCenterY = pos.y - this.board.tileHeight / 2;

      const pedestalTopY = tileCenterY - this.board.tileHeight / 2;
      const pedestalHeight = pedestalTopY - pedestalBaseY;
      if (pedestalHeight > 0.025) {
        primitive(
          `Pedestal ${tile}`,
          'box',
          this.materials.boardMetal,
          new pc.Vec3(pos.x, pedestalBaseY + pedestalHeight / 2, pos.z),
          new pc.Vec3(this.board.tileSize * 0.34, pedestalHeight, this.board.tileSize * 0.34),
          this.root
        );
      }

      const entity = primitive(
        `Tile ${tile}`,
        'box',
        tileMaterials.get(key)!,
        new pc.Vec3(pos.x, tileCenterY, pos.z),
        new pc.Vec3(this.board.tileSize, this.board.tileHeight, this.board.tileSize),
        this.root
      );
      entity.tags.add(`tile-${tile}`);
    }

    const cornerPositions = [
      [-8.16, -4.24], [8.16, -4.24], [-8.16, 4.24], [8.16, 4.24]
    ] as const;
    cornerPositions.forEach(([x, z], i) => {
      const bolt = primitive(`Corner Bolt ${i + 1}`, 'cylinder', this.materials.boardMetal, new pc.Vec3(x, -0.05, z), new pc.Vec3(0.20, 0.10, 0.20), this.root);
      bolt.setLocalEulerAngles(0, 0, 0);
    });

    return this.root;
  }
}
