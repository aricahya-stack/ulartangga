import * as pc from 'playcanvas';

interface CameraPreset {
  yaw: number;
  pitch: number;
  radius: number;
  target: pc.Vec3;
}

export class CameraController {
  readonly entity: pc.Entity;
  private current = 0;
  private yaw = 176;
  private pitch = 38;
  private radius = 24.4;
  private target = new pc.Vec3(0, 1.85, 0.9);
  private desiredYaw = this.yaw;
  private desiredPitch = this.pitch;
  private desiredRadius = this.radius;
  private desiredTarget = this.target.clone();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private cinematicLock = false;

  private readonly presets: CameraPreset[] = [
    // Sudut utama: dari arah angka rendah menuju angka tinggi
    { yaw: 176, pitch: 38, radius: 24.4, target: new pc.Vec3(0, 1.85, 0.9) },
    // Sudut sinematik kanan, masih menatap arah kenaikan ubin
    { yaw: 154, pitch: 33, radius: 21.6, target: new pc.Vec3(1.15, 2.05, 0.7) },
    // Sudut sinematik kiri, juga dari bawah ke puncak
    { yaw: -154, pitch: 44, radius: 22.8, target: new pc.Vec3(-1.0, 1.85, 0.75) },
    // Top-oblique agar susunan bertingkat tetap terbaca
    { yaw: 180, pitch: 68, radius: 24.6, target: new pc.Vec3(0, 1.75, 0.45) }
  ];

  constructor(private readonly app: pc.Application, private readonly canvas: HTMLCanvasElement) {
    this.entity = new pc.Entity('Cinematic Camera');
    this.entity.addComponent('camera', {
      clearColor: new pc.Color(0.08, 0.11, 0.16),
      fov: 46,
      nearClip: 0.1,
      farClip: 100
    });
    app.root.addChild(this.entity);
    this.bindInput();
    app.on('update', (dt: number) => this.update(dt));
    this.snap();
  }

  togglePreset() {
    if (this.cinematicLock) return;
    this.current = (this.current + 1) % this.presets.length;
    const p = this.presets[this.current];
    this.desiredYaw = p.yaw;
    this.desiredPitch = p.pitch;
    this.desiredRadius = p.radius;
    this.desiredTarget.copy(p.target);
  }

  focus(world: pc.Vec3, radius = 14.8, durationBias = 1) {
    this.desiredTarget.lerp(this.desiredTarget, world, Math.min(1, 0.88 * durationBias));
    this.desiredTarget.y = Math.max(this.desiredTarget.y, world.y + 0.28);
    this.desiredRadius = radius;
    this.desiredPitch = Math.min(this.desiredPitch, 40);
  }

  trackClimb(world: pc.Vec3, tile: number, progress: number, heightProgress: number) {
    this.cinematicLock = true;
    const level = pc.math.clamp((tile - 1) / 49, 0, 1);
    const sideSweep = Math.sin(progress * Math.PI) * (tile % 2 === 0 ? 1 : -1);
    this.desiredTarget.set(world.x, world.y + 0.38 + level * 0.38, world.z + 0.06);
    this.desiredRadius = pc.math.lerp(15.4, 12.0, level) - Math.sin(progress * Math.PI) * 0.8;
    this.desiredPitch = pc.math.lerp(41, 31, level) - heightProgress * 2.6;
    // Tetap dominan dari belakang/arah petak rendah ke petak tinggi
    const baseYaw = 176 - level * 12;
    this.desiredYaw = this.lerpAngle(this.desiredYaw, baseYaw + sideSweep * 7, 0.10);
  }

  async finalApproach(world: pc.Vec3) {
    this.cinematicLock = true;
    this.desiredTarget.copy(world);
    this.desiredTarget.y += 0.52;
    this.desiredTarget.z += 0.10;
    // Pendekatan dari bawah ke puncak
    this.desiredRadius = 11.0;
    this.desiredPitch = 29;
    this.desiredYaw = 174;
    await this.wait(760);

    this.desiredRadius = 9.4;
    this.desiredPitch = 26;
    this.desiredYaw = 154;
    await this.wait(820);
  }

  async finalVictoryOrbit(world: pc.Vec3) {
    this.cinematicLock = true;
    this.desiredTarget.copy(world);
    this.desiredTarget.y += 0.66;
    this.desiredTarget.z += 0.08;
    this.desiredRadius = 9.4;
    this.desiredPitch = 28;
    for (const yaw of [168, 138, 112]) {
      this.desiredYaw = yaw;
      await this.wait(560);
    }
  }

  releaseCinematic() {
    this.cinematicLock = false;
  }

  restoreOverview() {
    this.cinematicLock = false;
    const p = this.presets[this.current];
    this.desiredTarget.copy(p.target);
    this.desiredRadius = p.radius;
    this.desiredPitch = p.pitch;
    this.desiredYaw = p.yaw;
  }

  private bindInput() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.cinematicLock) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointerup', (e) => {
      this.dragging = false;
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging || this.cinematicLock) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.desiredYaw -= dx * 0.25;
      this.desiredPitch = pc.math.clamp(this.desiredPitch - dy * 0.20, 25, 76);
    });
    this.canvas.addEventListener('wheel', (e) => {
      if (this.cinematicLock) return;
      e.preventDefault();
      this.desiredRadius = pc.math.clamp(this.desiredRadius + e.deltaY * 0.012, 12.5, 28);
    }, { passive: false });
  }

  private update(dt: number) {
    if (this.app.xr?.active) return;
    const k = 1 - Math.exp(-dt * 5.5);
    this.yaw = this.lerpAngle(this.yaw, this.desiredYaw, k);
    this.pitch = pc.math.lerp(this.pitch, this.desiredPitch, k);
    this.radius = pc.math.lerp(this.radius, this.desiredRadius, k);
    this.target.lerp(this.target, this.desiredTarget, k);
    this.applyTransform();
  }

  private snap() {
    this.yaw = this.desiredYaw;
    this.pitch = this.desiredPitch;
    this.radius = this.desiredRadius;
    this.target.copy(this.desiredTarget);
    this.applyTransform();
  }

  private applyTransform() {
    const yaw = this.yaw * pc.math.DEG_TO_RAD;
    const pitch = this.pitch * pc.math.DEG_TO_RAD;
    const horizontal = Math.cos(pitch) * this.radius;
    const pos = new pc.Vec3(
      this.target.x + Math.sin(yaw) * horizontal,
      this.target.y + Math.sin(pitch) * this.radius,
      this.target.z + Math.cos(yaw) * horizontal
    );
    this.entity.setPosition(pos);
    this.entity.lookAt(this.target);
  }

  private lerpAngle(a: number, b: number, t: number) {
    const delta = ((b - a + 180) % 360 + 360) % 360 - 180;
    return a + delta * t;
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
