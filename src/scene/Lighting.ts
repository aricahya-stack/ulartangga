import * as pc from 'playcanvas';

export function createLighting(app: pc.Application) {
  // Lebih cerah, tetapi tetap hangat dan sinematik.
  app.scene.ambientLight = new pc.Color(0.24, 0.26, 0.30);
  app.scene.skyboxIntensity = 1.15;

  const sun = new pc.Entity('Key Sun');
  sun.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1.0, 0.95, 0.84),
    intensity: 2.05,
    castShadows: true,
    shadowResolution: 2048,
    shadowDistance: 36,
    shadowBias: 0.2,
    normalOffsetBias: 0.06
  });
  sun.setEulerAngles(50, -28, 0);
  app.root.addChild(sun);

  const fill = new pc.Entity('Cool Fill');
  fill.addComponent('light', {
    type: 'omni',
    color: new pc.Color(0.44, 0.72, 1.0),
    intensity: 1.45,
    range: 18,
    castShadows: false
  });
  fill.setPosition(7.5, 7.4, 5.8);
  app.root.addChild(fill);

  const warm = new pc.Entity('Warm Fill');
  warm.addComponent('light', {
    type: 'omni',
    color: new pc.Color(1.0, 0.66, 0.36),
    intensity: 1.15,
    range: 16,
    castShadows: false
  });
  warm.setPosition(-7.0, 6.2, -5.0);
  app.root.addChild(warm);

  const summit = new pc.Entity('Summit Glow');
  summit.addComponent('light', {
    type: 'omni',
    color: new pc.Color(1.0, 0.88, 0.52),
    intensity: 1.35,
    range: 10,
    castShadows: false
  });
  summit.setPosition(6.8, 4.9, 2.8);
  app.root.addChild(summit);

  return { sun, fill, warm, summit };
}
