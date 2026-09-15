// ============================================================
// HUD.ts
// In-game heads-up display: timer, objective, wood progress.
// All elements live in a fixed UI camera (no world scrolling).
// ============================================================

import Phaser from 'phaser';
import type { GameState } from '../systems/GameState';

export class HUD {
  private scene: Phaser.Scene;
  private timerLabel: Phaser.GameObjects.Text;
  private timerValue: Phaser.GameObjects.Text;
  private objectiveText: Phaser.GameObjects.Text;
  private woodProgress: Phaser.GameObjects.Text;
  private panel: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, requiredWood: number) {
    this.scene = scene;

    const W = scene.scale.width;

    // ── Background panel at top ──────────────────────────────
    this.panel = scene.add
      .rectangle(W / 2, 0, W, 80, 0x1a3300, 0.82)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(50);

    // ── Timer label ──────────────────────────────────────────
    this.timerLabel = scene.add
      .text(W / 2, 8, 'TIME', {
        fontSize: '13px',
        fontFamily: 'Nunito, sans-serif',
        color: '#a8d8a8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(51);

    // ── Timer value (MM:SS) ──────────────────────────────────
    this.timerValue = scene.add
      .text(W / 2, 24, '00:00', {
        fontSize: '26px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(51);

    // ── Objective text ───────────────────────────────────────
    this.objectiveText = scene.add
      .text(12, 8, `Collect ${requiredWood} woods to celebrate!`, {
        fontSize: '13px',
        fontFamily: 'Nunito, sans-serif',
        color: '#f0e68c',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(51);

    // ── Wood progress (bottom-left of panel) ─────────────────
    this.woodProgress = scene.add
      .text(12, 52, `🪵 Wood: 0 / ${requiredWood}`, {
        fontSize: '15px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(51);
  }

  /** Called every frame with current game state */
  update(state: GameState): void {
    // Format remaining time as MM:SS
    const secs  = Math.max(0, Math.ceil(state.timeRemaining));
    const mins  = Math.floor(secs / 60);
    const s     = secs % 60;
    const label = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    this.timerValue.setText(label);

    // Turn timer red when ≤ 10 seconds left
    this.timerValue.setColor(secs <= 10 ? '#ff4444' : '#ffffff');

    // Wood progress
    this.woodProgress.setText(`🪵 Wood: ${state.woodDelivered} / ${state.requiredWood}`);
  }

  destroy(): void {
    this.panel.destroy();
    this.timerLabel.destroy();
    this.timerValue.destroy();
    this.objectiveText.destroy();
    this.woodProgress.destroy();
  }
}
