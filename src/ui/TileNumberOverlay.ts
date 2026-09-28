import * as pc from 'playcanvas';
import { Board } from '../game/Board';
import { BONUS_TILES, LADDERS, SNAKES } from '../game/TileEvent';

export class TileNumberOverlay {
  private readonly labels: HTMLDivElement[] = [];
  private readonly scratch = new pc.Vec3();

  constructor(
    private readonly app: pc.Application,
    private readonly board: Board,
    private readonly cameraEntity: pc.Entity,
    private readonly canvas: HTMLCanvasElement,
    private readonly layer: HTMLElement
  ) {
    for (let tile = 1; tile <= 50; tile++) {
      const label = document.createElement('div');
      label.className = `tile-number zone-${this.board.competencyFor(tile).toLowerCase()}`;
      const special = tile === 50 ? '🏆' : BONUS_TILES.has(tile) ? '★' : LADDERS.has(tile) ? '🪜' : SNAKES.has(tile) ? '🐍' : '';
      label.innerHTML = `<b>${tile}</b>${special ? `<span>${special}</span>` : ''}`;
      this.layer.appendChild(label);
      this.labels.push(label);
    }
    app.on('update', () => this.update());
  }

  private update() {
    const camera = this.cameraEntity.camera;
    if (!camera) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = rect.width / this.app.graphicsDevice.width;
    const sy = rect.height / this.app.graphicsDevice.height;

    for (let tile = 1; tile <= 50; tile++) {
      const world = this.board.tilePosition(tile).clone();
      world.y += 0.10;
      const screen = camera.worldToScreen(world, this.scratch);
      const x = screen.x * sx;
      const y = screen.y * sy;
      const label = this.labels[tile - 1];
      const visible = x > -20 && x < rect.width + 20 && y > -20 && y < rect.height + 20;
      label.style.display = visible ? 'flex' : 'none';
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
    }
  }
}
