import * as pc from 'playcanvas';
import type { Board } from './Board';
import { easeInOutCubic } from '../effects/Animations';

export class Player {
  position = 0;
  score = 0;
  correct = 0;
  answered = 0;
  root: pc.Entity | null = null;

  constructor(public name: string, public readonly index: number) {}

  get accuracy(): string {
    return this.answered ? `${Math.round((this.correct / this.answered) * 100)}%` : '–';
  }

  attach(root: pc.Entity) {
    this.root = root;
  }

  reset(board: Board) {
    this.position = 0;
    this.score = 0;
    this.correct = 0;
    this.answered = 0;
    if (this.root) {
      this.root.setPosition(this.offsetPosition(board.tilePosition(0)));
      this.root.setLocalScale(1, 1, 1);
      this.root.setEulerAngles(0, 0, 0);
    }
  }

  private offsetPosition(pos: pc.Vec3): pc.Vec3 {
    const copy = pos.clone();
    copy.x += this.index === 0 ? -0.26 : 0.26;
    copy.y += 0.02;
    return copy;
  }

  async moveTo(
    tile: number,
    board: Board,
    duration = 340,
    onFrame?: (position: pc.Vec3, progress: number, heightProgress: number) => void
  ): Promise<void> {
    this.position = tile;
    if (!this.root) return;

    const from = this.root.getPosition().clone();
    const to = this.offsetPosition(board.tilePosition(tile));
    const deltaY = to.y - from.y;
    const horizontalDistance = Math.hypot(to.x - from.x, to.z - from.z);
    const climbFactor = pc.math.clamp(Math.max(0, deltaY) / Math.max(0.001, board.risePerTile), 0, 20);
    const lift = Math.max(0.30, Math.min(1.65, horizontalDistance * 0.14 + climbFactor * 0.045));
    const actualDuration = duration + Math.min(260, climbFactor * 16);
    const start = performance.now();
    const startYaw = this.root.getEulerAngles().y;

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const raw = Math.min(1, (now - start) / actualDuration);
        const t = easeInOutCubic(raw);
        const p = new pc.Vec3().lerp(from, to, t);

        const arc = Math.sin(Math.PI * raw);
        const climbKick = Math.max(0, deltaY) * Math.sin(Math.PI * raw) * 0.24;
        p.y += arc * lift + climbKick;
        this.root!.setPosition(p);

        const stretch = 1 + arc * 0.12;
        const squash = 1 - arc * 0.055;
        this.root!.setLocalScale(squash, stretch, squash);

        const directionYaw = Math.atan2(to.x - from.x, to.z - from.z) * pc.math.RAD_TO_DEG;
        const yaw = pc.math.lerp(startYaw, directionYaw, Math.min(1, raw * 2.4));
        const tilt = Math.sin(Math.PI * raw) * (deltaY >= 0 ? -5.5 : 4.0);
        this.root!.setEulerAngles(tilt, yaw, 0);

        const heightProgress = from.y === to.y ? 1 : pc.math.clamp((p.y - from.y) / (to.y - from.y), 0, 1);
        onFrame?.(p, raw, heightProgress);

        if (raw < 1) {
          requestAnimationFrame(tick);
        } else {
          this.root!.setPosition(to);
          this.root!.setLocalScale(1, 1, 1);
          this.root!.setEulerAngles(0, directionYaw, 0);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

    await this.landingBounce();
  }

  private async landingBounce() {
    if (!this.root) return;
    const start = performance.now();
    const duration = 180;
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const wave = Math.sin(Math.PI * t);
        this.root!.setLocalScale(1 + wave * 0.07, 1 - wave * 0.09, 1 + wave * 0.07);
        if (t < 1) requestAnimationFrame(tick);
        else {
          this.root!.setLocalScale(1, 1, 1);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }
}
