export type TileEventKind = 'normal' | 'ladder' | 'snake' | 'bonus' | 'final';

export interface TileEvent {
  kind: TileEventKind;
  to?: number;
}

export const LADDERS = new Map<number, number>([
  [4, 13], [9, 18], [17, 28], [26, 36], [34, 44]
]);

export const SNAKES = new Map<number, number>([
  [15, 6], [24, 14], [32, 21], [43, 31], [48, 37]
]);

export const BONUS_TILES = new Set<number>([7, 20, 29, 39, 46]);

export function tileEventFor(tile: number): TileEvent {
  if (tile === 50) return { kind: 'final' };
  if (LADDERS.has(tile)) return { kind: 'ladder', to: LADDERS.get(tile)! };
  if (SNAKES.has(tile)) return { kind: 'snake', to: SNAKES.get(tile)! };
  if (BONUS_TILES.has(tile)) return { kind: 'bonus' };
  return { kind: 'normal' };
}
