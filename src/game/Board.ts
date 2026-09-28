import { Vec3 } from 'playcanvas';
import { BONUS_TILES, LADDERS, SNAKES, tileEventFor } from './TileEvent';

export type Competency = 'Pedagogik' | 'Profesional' | 'Kepribadian' | 'Sosial' | 'Integratif';

export class Board {
  readonly tileSize = 1.42;
  readonly gap = 0.12;
  readonly step = this.tileSize + this.gap;
  readonly ladders = LADDERS;
  readonly snakes = SNAKES;
  readonly bonusTiles = BONUS_TILES;
  readonly tileHeight = 0.40;
  readonly startTopY = 0.35;
  readonly risePerTile = 0.055;

  competencyFor(tile: number): Competency {
    if (tile <= 10) return 'Pedagogik';
    if (tile <= 20) return 'Profesional';
    if (tile <= 30) return 'Kepribadian';
    if (tile <= 40) return 'Sosial';
    return 'Integratif';
  }

  tilePosition(tile: number): Vec3 {
    if (tile <= 0) return new Vec3(-this.step * 5.5, this.startTopY - 0.08, -this.step * 2.2);
    const row = Math.floor((tile - 1) / 10);
    const index = (tile - 1) % 10;
    const col = row % 2 === 0 ? index : 9 - index;
    const x = (col - 4.5) * this.step;
    const z = (row - 2) * this.step;
    const y = this.startTopY + (tile - 1) * this.risePerTile;
    return new Vec3(x, y, z);
  }

  eventFor(tile: number) {
    return tileEventFor(tile);
  }
}
