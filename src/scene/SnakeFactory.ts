import * as pc from 'playcanvas';
import { MaterialFactory } from './MaterialFactory';

interface SnakeSegment {
  entity: pc.Entity;
  t: number;
  radius: number;
}

export class AnimatedSnake {
  private readonly segments: SnakeSegment[] = [];
  private time = 0;
  private readonly midpoint: pc.Vec3;
  private readonly dir: pc.Vec3;
  private readonly perp: pc.Vec3;
  private readonly distance: number;
  private readonly waves: number;
  private readonly head: pc.Entity;

  constructor(
    private readonly app: pc.Application,
    private readonly name: string,
    private readonly start: pc.Vec3,
    private readonly end: pc.Vec3,
    private readonly materials: MaterialFactory
  ) {
    this.midpoint = new pc.Vec3().lerp(start, end, 0.5);
    this.dir = new pc.Vec3(end.x - start.x, 0, end.z - start.z);
    this.distance = this.dir.length();
    this.dir.normalize();
    this.perp = new pc.Vec3(-this.dir.z, 0, this.dir.x);
    this.waves = Math.max(2, Math.round(this.distance / 2.1));

    const count = Math.max(24, Math.round(this.distance * 5.5));
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const taper = 0.075 + 0.075 * Math.pow(1 - t, 0.62);
      const seg = new pc.Entity(`${name}-body-${i}`);
      seg.addComponent('render', { type: 'sphere' });
      if (seg.render) {
        seg.render.material = materials.snakeGreen;
        seg.render.castShadows = true;
        seg.render.receiveShadows = true;
      }
      seg.setLocalScale(taper * 2.0, taper * 1.25, taper * 2.0);
      app.root.addChild(seg);
      this.segments.push({ entity: seg, t, radius: taper });
    }

    this.head = new pc.Entity(`${name}-head`);
    this.head.addComponent('render', { type: 'sphere' });
    if (this.head.render) {
      this.head.render.material = materials.snakeGreen;
      this.head.render.castShadows = true;
      this.head.render.receiveShadows = true;
    }
    this.head.setLocalScale(0.38, 0.23, 0.30);
    app.root.addChild(this.head);

    for (const side of [-1, 1]) {
      const eye = new pc.Entity(`${name}-eye-${side}`);
      eye.addComponent('render', { type: 'sphere' });
      if (eye.render) eye.render.material = materials.snakeEye;
      eye.setLocalScale(0.045, 0.045, 0.045);
      eye.setLocalPosition(-0.08, 0.12, side * 0.09);
      this.head.addChild(eye);
    }

    const tongue = new pc.Entity(`${name}-tongue`);
    tongue.addComponent('render', { type: 'box' });
    if (tongue.render) tongue.render.material = materials.tongue;
    tongue.setLocalScale(0.22, 0.018, 0.035);
    tongue.setLocalPosition(-0.27, -0.02, 0);
    this.head.addChild(tongue);

    for (const side of [-1, 1]) {
      const fork = new pc.Entity(`${name}-fork-${side}`);
      fork.addComponent('render', { type: 'box' });
      if (fork.render) fork.render.material = materials.tongue;
      fork.setLocalScale(0.10, 0.014, 0.018);
      fork.setLocalPosition(-0.42, -0.02, side * 0.025);
      fork.setLocalEulerAngles(0, side * 18, 0);
      this.head.addChild(fork);
    }

    this.update(0);
  }

  update(dt: number) {
    this.time += dt;
    const amp = 0.22;
    const speed = 1.65;
    for (const s of this.segments) {
      const t = s.t;
      const along = (t - 0.5) * this.distance;
      const baseX = this.midpoint.x + this.dir.x * along;
      const baseZ = this.midpoint.z + this.dir.z * along;
      const baseY = pc.math.lerp(this.start.y, this.end.y, t);
      const envelope = Math.sin(Math.PI * t);
      const wave = Math.sin(t * Math.PI * this.waves + this.time * speed + Number(this.name.length)) * amp * envelope;
      const micro = Math.sin(this.time * 2.8 - t * 9.0) * 0.035 * envelope;
      s.entity.setPosition(
        baseX + this.perp.x * (wave + micro),
        baseY + 0.16 + Math.sin(Math.PI * t) * 0.035 + Math.sin(this.time * 2 + t * 7) * 0.008,
        baseZ + this.perp.z * (wave + micro)
      );
    }

    const headWave = Math.sin(this.time * speed + Number(this.name.length)) * 0.035;
    this.head.setPosition(
      this.start.x + this.perp.x * headWave,
      this.start.y + 0.20 + Math.sin(this.time * 2.1) * 0.018,
      this.start.z + this.perp.z * headWave
    );
    const yaw = Math.atan2(this.dir.x, this.dir.z) * pc.math.RAD_TO_DEG + 90;
    this.head.setEulerAngles(0, yaw + Math.sin(this.time * 1.8) * 4, 0);
  }
}

export class SnakeFactory {
  readonly snakes: AnimatedSnake[] = [];
  constructor(private readonly app: pc.Application, private readonly materials: MaterialFactory) {
    app.on('update', (dt: number) => this.snakes.forEach((snake) => snake.update(dt)));
  }

  create(name: string, start: pc.Vec3, end: pc.Vec3) {
    const snake = new AnimatedSnake(this.app, name, start, end, this.materials);
    this.snakes.push(snake);
    return snake;
  }
}
