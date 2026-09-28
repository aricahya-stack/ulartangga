import './styles.css';
import * as pc from 'playcanvas';
import { GameManager } from './game/GameManager';
import { QuestionEngine } from './questions/QuestionEngine';
import { GameScene } from './scene/GameScene';
import { CameraController } from './scene/CameraController';
import { createLighting } from './scene/Lighting';
import type { PawnMaterialStyle } from './scene/MaterialFactory';
import { TileNumberOverlay } from './ui/TileNumberOverlay';
import { must } from './ui/HUD';
import { enableCinematicFrame } from './effects/PostProcessing';
import { GameBridge } from './integrations/GameBridge';
import { Portal } from './portal/Portal';
import { installAR } from './integrations/ARMode';

async function bootstrap() {
  const canvas = must<HTMLCanvasElement>('#renderCanvas');
  const scenePanel = must<HTMLElement>('.scene-panel');
  const tileLayer = must<HTMLElement>('#tile-label-layer');

  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
    keyboard: new pc.Keyboard(window),
    graphicsDeviceOptions: {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    }
  });
  app.setCanvasFillMode(pc.FILLMODE_NONE, canvas.clientWidth, canvas.clientHeight);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.scene.exposure = 1.22;

  const resize = () => {
    const w = Math.max(320, Math.floor(canvas.clientWidth));
    const h = Math.max(320, Math.floor(canvas.clientHeight));
    app.resizeCanvas(w, h);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(scenePanel);
  window.addEventListener('resize', resize);

  createLighting(app);
  const camera = new CameraController(app, canvas);
  if (camera.entity.camera) {
    camera.entity.camera.gammaCorrection = pc.GAMMA_SRGB;
    camera.entity.camera.toneMapping = pc.TONEMAP_ACES;
  }
  const gameScene = new GameScene(app);
  new TileNumberOverlay(app, gameScene.board, camera.entity, canvas, tileLayer);
  enableCinematicFrame(scenePanel);

  const questionEngine = new QuestionEngine(must('#question-overlay'), must('#question-card'));
  const game = new GameManager(gameScene, camera, questionEngine, {
    rollButton: must<HTMLButtonElement>('#roll-btn'),
    cameraButton: must<HTMLButtonElement>('#camera-btn'),
    diceValue: must('#dice-value'),
    turnName: must('#turn-name'),
    zonePill: must('#zone-pill'),
    questionCount: must('#question-count'),
    logList: must('#log-list'),
    playerNames: [must('#player-name-0'), must('#player-name-1')],
    playerPositions: [must('#player-pos-0'), must('#player-pos-1')],
    playerScores: [must('#player-score-0'), must('#player-score-1')],
    playerAccuracy: [must('#player-acc-0'), must('#player-acc-1')],
    playerCards: [must('#player-card-0'), must('#player-card-1')],
    winOverlay: must('#win-overlay'),
    winCard: must('#win-card')
  });
  const bridge = new GameBridge(game, gameScene, questionEngine);
  new Portal(bridge);
  installAR(app, camera, (message) => bridge.notice(message));

  const startButton = must<HTMLButtonElement>('#start-btn');
  startButton.addEventListener('click', () => {
    const nameA = must<HTMLInputElement>('#name-a').value.trim();
    const nameB = must<HTMLInputElement>('#name-b').value.trim();
    const styleA = must<HTMLSelectElement>('#material-a').value as PawnMaterialStyle;
    const styleB = must<HTMLSelectElement>('#material-b').value as PawnMaterialStyle;
    gameScene.setPawnMaterials(styleA, styleB);
    must('#start-overlay').classList.add('hidden');
    game.start(nameA, nameB);
  });

  app.start();
  resize();

  window.addEventListener('beforeunload', () => {
    observer.disconnect();
    app.destroy();
  });
}

bootstrap().catch((error) => {
  console.error(error);
  const overlay = document.querySelector<HTMLElement>('#start-overlay');
  if (overlay) {
    overlay.innerHTML = `<div class="start-card"><span class="eyebrow">Gagal memuat</span><h2>PlayCanvas tidak dapat dijalankan</h2><p>${String(error instanceof Error ? error.message : error)}</p><p>Jalankan melalui <code>npm install</code> lalu <code>npm run dev</code>.</p></div>`;
  }
});
