import * as pc from 'playcanvas';
import { Player } from './Player';
import { TurnManager } from './TurnManager';
import type { TileEvent } from './TileEvent';
import { GameScene } from '../scene/GameScene';
import { CameraController } from '../scene/CameraController';
import { QuestionEngine } from '../questions/QuestionEngine';
import { climbShimmer, landingPulse, sparkleBurst } from '../effects/ParticleEffects';
import { bonusCelebrationEffect, ladderSuccessEffect, snakeEscapeEffect, snakePenaltyEffect } from '../effects/EventEffects';
import { zoneName } from '../portal/zone';

interface UIRefs {
  rollButton: HTMLButtonElement;
  cameraButton: HTMLButtonElement;
  diceValue: HTMLElement;
  turnName: HTMLElement;
  zonePill: HTMLElement;
  questionCount: HTMLElement;
  logList: HTMLElement;
  playerNames: [HTMLElement, HTMLElement];
  playerPositions: [HTMLElement, HTMLElement];
  playerScores: [HTMLElement, HTMLElement];
  playerAccuracy: [HTMLElement, HTMLElement];
  playerCards: [HTMLElement, HTMLElement];
  winOverlay: HTMLElement;
  winCard: HTMLElement;
}

export class GameManager {
  readonly players = [new Player('Player A', 0), new Player('Player B', 1)] as const;
  private readonly turns = new TurnManager();
  private started = false;
  private busy = false;
  private logs: string[] = [];

  constructor(
    private readonly gameScene: GameScene,
    private readonly camera: CameraController,
    private readonly questionEngine: QuestionEngine,
    private readonly ui: UIRefs
  ) {
    this.players[0].attach(gameScene.pawns[0].root);
    this.players[1].attach(gameScene.pawns[1].root);
    ui.rollButton.addEventListener('click', () => void this.roll());
    ui.cameraButton.addEventListener('click', () => camera.togglePreset());
  }

  start(nameA: string, nameB: string) {
    this.players[0].name = nameA || 'Player A';
    this.players[1].name = nameB || 'Player B';
    this.turns.reset();
    this.questionEngine.reset();
    this.players.forEach((p) => p.reset(this.gameScene.board));
    this.started = true;
    this.busy = false;
    this.logs = [];
    this.camera.restoreOverview();
    this.addLog(`Pertandingan dimulai. ${this.players[0].name} mendapat giliran pertama.`);
    this.renderHUD();
  }

  private async roll() {
    if (!this.started || this.busy) return;
    this.busy = true;
    this.renderHUD();
    this.playSound('/sounds/roll.wav');
    const player = this.players[this.turns.current];

    this.camera.focus(this.gameScene.dice.root.getPosition(), 10.8);
    const value = await this.gameScene.dice.roll();
    this.ui.diceValue.textContent = String(value);

    if (player.position + value > 50) {
      this.addLog(`${player.name} mendapat ${value}; dibutuhkan angka tepat untuk mencapai 50.`);
      await this.delay(450);
      this.camera.restoreOverview();
      this.finishTurn();
      return;
    }

    const target = player.position + value;
    this.camera.focus(this.gameScene.board.tilePosition(target), 12.8);
    this.addLog(`${player.name}: ${player.position} → ${target} (dadu ${value}).`);
    for (let tile = player.position + 1; tile <= target; tile++) {
      const beforeY = player.root?.getPosition().y ?? 0;
      await player.moveTo(tile, this.gameScene.board, 300, (position, progress, heightProgress) => this.camera.trackClimb(position, tile, progress, heightProgress));
      const landed = this.gameScene.board.tilePosition(tile);
      const climbHeight = Math.max(0.35, landed.y - beforeY + 0.28);
      void landingPulse(this.gameScene.app, landed);
      void climbShimmer(this.gameScene.app, landed, climbHeight);
      this.playSound('/sounds/move.wav', 0.18);
      this.renderHUD();
    }

    if (target === 50) {
      await this.camera.finalApproach(this.gameScene.board.tilePosition(50));
    } else {
      this.camera.releaseCinematic();
    }

    const competency = this.gameScene.board.competencyFor(target);
    const event = this.gameScene.board.eventFor(target);
    const question = this.questionEngine.draw(competency);
    this.renderHUD();
    const outcome = await this.questionEngine.ask(question, this.eventLabel(event), { playerName: player.name, tile: target });

    player.answered += 1;
    if (outcome.fullCorrect) player.correct += 1;
    let points = outcome.points;
    if (event.kind === 'bonus' && outcome.fullCorrect) points += 50;
    player.score += points;
    this.playSound(outcome.fullCorrect ? '/sounds/correct.wav' : '/sounds/wrong.wav', 0.45);

    await this.resolveEvent(event, outcome.fullCorrect);
    this.renderHUD();
  }

  private async resolveEvent(event: TileEvent, fullCorrect: boolean) {
    const player = this.players[this.turns.current];
    if (event.kind === 'ladder') {
      if (fullCorrect && event.to) {
        this.addLog(`${player.name} menjawab benar dan naik tangga ke ${event.to}.`);
        const from = this.gameScene.board.tilePosition(player.position);
        this.camera.focus(from, 11.6);
        await ladderSuccessEffect(this.gameScene.app, from);
        this.camera.focus(this.gameScene.board.tilePosition(event.to), 12.0);
        await player.moveTo(event.to, this.gameScene.board, 760, (p, progress, heightProgress) => this.camera.trackClimb(p, event.to!, progress, heightProgress));
        void sparkleBurst(this.gameScene.app, this.gameScene.board.tilePosition(event.to));
      } else this.addLog(`${player.name} belum berhasil naik tangga.`);
    } else if (event.kind === 'snake') {
      if (fullCorrect) {
        this.addLog(`${player.name} menjawab benar dan selamat dari ular.`);
        await snakeEscapeEffect(this.gameScene.app, this.gameScene.board.tilePosition(player.position));
      } else if (event.to) {
        this.addLog(`${player.name} turun karena ular ke petak ${event.to}.`);
        const from = this.gameScene.board.tilePosition(player.position);
        this.camera.focus(from, 10.9);
        await snakePenaltyEffect(this.gameScene.app, from);
        this.camera.focus(this.gameScene.board.tilePosition(event.to), 11.7);
        await player.moveTo(event.to, this.gameScene.board, 820, (p) => this.camera.focus(p, 11.7, 0.25));
      }
    } else if (event.kind === 'bonus') {
      this.addLog(fullCorrect ? `${player.name} mendapat bonus +50 poin.` : `${player.name} belum memperoleh bonus.`);
      if (fullCorrect) await bonusCelebrationEffect(this.gameScene.app, this.gameScene.board.tilePosition(player.position));
    } else if (event.kind === 'final') {
      if (fullCorrect) {
        await this.showWinner(this.turns.current);
        return;
      }
      this.addLog(`${player.name} belum lolos Final Challenge dan kembali ke petak 49.`);
      await player.moveTo(49, this.gameScene.board, 620, (p) => this.camera.focus(p, 12.0, 0.25));
    } else {
      this.addLog(`${player.name} menyelesaikan tantangan zona ${zoneName[this.gameScene.board.competencyFor(player.position)]}.`);
    }
    await this.delay(220);
    this.camera.restoreOverview();
    this.finishTurn();
  }

  private finishTurn() {
    if (!this.started) return;
    this.turns.next();
    this.busy = false;
    this.renderHUD();
  }

  private async showWinner(index: number) {
    const winner = this.players[index];
    const other = this.players[index === 0 ? 1 : 0];
    this.started = false;
    this.busy = true;
    const finalPos = this.gameScene.board.tilePosition(50);
    void sparkleBurst(this.gameScene.app, finalPos, new pc.Color(1.0, 0.72, 0.12));
    await this.camera.finalVictoryOrbit(finalPos);
    this.ui.winCard.innerHTML = `<div class="trophy">🏆</div><span class="eyebrow">Pertandingan selesai</span><h2>${this.escape(winner.name)} Menang!</h2><p>${this.escape(winner.name)} mencapai petak 50 dan menuntaskan Final Challenge.</p><div class="win-stats"><div><b>${this.escape(winner.name)}</b><br>Skor ${winner.score}<br>Akurasi ${winner.accuracy}</div><div><b>${this.escape(other.name)}</b><br>Skor ${other.score}<br>Akurasi ${other.accuracy}</div></div><button id="reload-game" class="primary">Main Lagi</button>`;
    this.ui.winOverlay.classList.remove('hidden');
    this.ui.winCard.querySelector<HTMLButtonElement>('#reload-game')?.addEventListener('click', () => location.reload());
  }

  private renderHUD() {
    this.players.forEach((player, index) => {
      this.ui.playerNames[index].textContent = player.name;
      this.ui.playerPositions[index].textContent = String(player.position);
      this.ui.playerScores[index].textContent = String(player.score);
      this.ui.playerAccuracy[index].textContent = player.accuracy;
      this.ui.playerCards[index].classList.toggle('active', this.started && !this.busy && this.turns.current === index);
    });
    const current = this.players[this.turns.current];
    this.ui.turnName.textContent = current.name.toUpperCase();
    this.ui.zonePill.textContent = current.position ? `Zona: ${zoneName[this.gameScene.board.competencyFor(current.position)]}` : 'Mulai dari petak awal';
    this.ui.questionCount.textContent = `Soal unik terpakai: ${this.questionEngine.usedCount} / 50`;
    this.ui.rollButton.disabled = !this.started || this.busy;
  }

  private eventLabel(event: TileEvent) {
    return ({ normal: 'Tantangan Kompetensi', ladder: 'Ladder Challenge', snake: 'Snake Escape', bonus: 'Bonus Tile', final: 'Final Challenge' })[event.kind];
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
    this.logs.unshift(`[${timestamp}] ${message}`);
    this.logs = this.logs.slice(0, 6);
    this.ui.logList.innerHTML = this.logs.map((line) => `<div>${this.escape(line)}</div>`).join('');
  }

  private playSound(url: string, volume = 0.32) {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      void audio.play();
    } catch { /* audio enhancement only */ }
  }

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private escape(value: string) {
    return value.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] ?? c));
  }
}
