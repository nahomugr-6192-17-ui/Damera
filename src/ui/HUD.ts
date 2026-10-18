// ============================================================
// HUD.ts
// In-game heads-up display: timer, objective, wood progress.
// All elements live in a fixed UI camera (no world scrolling).
// ============================================================

import Phaser from 'phaser';
import type { GameState } from '../systems/GameState';

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private panelBg: Phaser.GameObjects.Graphics;
  private tibebBar: Phaser.GameObjects.Graphics;

  // Timer elements
  private timerBox: Phaser.GameObjects.Container;
  private timerGfx: Phaser.GameObjects.Graphics;
  private timerLabel: Phaser.GameObjects.Text;
  private timerValue: Phaser.GameObjects.Text;
  private isTimerPulsing: boolean = false;

  // Wood progress elements
  private woodBox: Phaser.GameObjects.Container;
  private woodGfx: Phaser.GameObjects.Graphics;
  private woodText: Phaser.GameObjects.Text;
  private woodBarFill: Phaser.GameObjects.Graphics;
  private lastWoodCount: number = 0;
  private requiredWood: number;

  // Right objective pill
  private objectiveText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, requiredWood: number) {
    this.scene = scene;
    this.requiredWood = requiredWood;

    const W = scene.scale.width;
    const cx = W / 2;

    // ── 1. Top Glassmorphic Banner ────────────────────────────
    this.panelBg = scene.add.graphics();
    // Dark forest gradient background
    this.panelBg.fillGradientStyle(0x0a1f0d, 0x0a1f0d, 0x143518, 0x143518, 0.94);
    this.panelBg.fillRect(0, 0, W, 68);
    // Gold bottom rim
    this.panelBg.fillStyle(0xfbc02d, 0.85);
    this.panelBg.fillRect(0, 67, W, 2);

    // Ethiopian Tibeb Pattern at very top
    this.tibebBar = scene.add.graphics();
    const colors = [0x2e7d32, 0xfbc02d, 0xc62828];
    const segW = 16;
    for (let i = 0; i < Math.ceil(W / segW); i++) {
      this.tibebBar.fillStyle(colors[i % colors.length], 0.9);
      this.tibebBar.fillRect(i * segW, 0, segW, 3);
    }

    // ── 2. Center Timer Pill ──────────────────────────────────
    const tBoxW = 140, tBoxH = 46;
    this.timerGfx = scene.add.graphics();
    this.timerGfx.fillStyle(0x000000, 0.45);
    this.timerGfx.fillRoundedRect(-tBoxW / 2, -tBoxH / 2, tBoxW, tBoxH, 10);
    this.timerGfx.lineStyle(1.5, 0xffd54f, 0.75);
    this.timerGfx.strokeRoundedRect(-tBoxW / 2, -tBoxH / 2, tBoxW, tBoxH, 10);

    this.timerLabel = scene.add.text(0, -14, "⏱️ TIME LEFT", {
      fontSize: "10px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#a5d6a7",
      letterSpacing: 1,
    }).setOrigin(0.5);

    this.timerValue = scene.add.text(0, 5, "00:00", {
      fontSize: "22px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.timerBox = scene.add.container(cx, 36, [
      this.timerGfx, this.timerLabel, this.timerValue
    ]);

    // ── 3. Left Wood Progress Badge ───────────────────────────
    const wBoxW = 200, wBoxH = 46;
    const wBoxX = 18 + wBoxW / 2;

    this.woodGfx = scene.add.graphics();
    this.woodGfx.fillStyle(0x000000, 0.45);
    this.woodGfx.fillRoundedRect(-wBoxW / 2, -wBoxH / 2, wBoxW, wBoxH, 10);
    this.woodGfx.lineStyle(1.5, 0x81c784, 0.75);
    this.woodGfx.strokeRoundedRect(-wBoxW / 2, -wBoxH / 2, wBoxW, wBoxH, 10);

    // Track background for progress bar
    this.woodGfx.fillStyle(0x1b3b1e, 0.8);
    this.woodGfx.fillRoundedRect(-wBoxW / 2 + 12, 10, wBoxW - 24, 6, 3);

    this.woodText = scene.add.text(-wBoxW / 2 + 14, -12, `🪵 Wood: 0 / ${requiredWood}`, {
      fontSize: "14px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
    }).setOrigin(0, 0);

    // Dynamic progress bar fill
    this.woodBarFill = scene.add.graphics();

    this.woodBox = scene.add.container(wBoxX, 36, [
      this.woodGfx, this.woodText, this.woodBarFill
    ]);

    // ── 4. Right Objective Pill ───────────────────────────────
    this.objectiveText = scene.add.text(W - 20, 36, `🔥 Keep the ደመራ Burning!`, {
      fontSize: "14px",
      fontFamily: '"Noto Sans Ethiopic", Fredoka One, Nunito, sans-serif',
      color: "#ffe082",
      backgroundColor: "#1b3b1ecc",
      padding: { x: 14, y: 7 },
    }).setOrigin(1, 0.5);

    // ── 5. Master HUD Container ───────────────────────────────
    this.container = scene.add.container(0, 0, [
      this.panelBg, this.tibebBar, this.woodBox, this.timerBox, this.objectiveText
    ]).setScrollFactor(0).setDepth(50);
  }

  /**
   * Mathematically cancels camera zoom so the HUD remains crisp, 1:1 scale,
   * and pinned perfectly to the physical top of the screen.
   */
  public applyCameraZoom(zoom: number): void {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.container.setScale(1 / zoom);
    this.container.x = (W / 2) - (W / 2) / zoom;
    this.container.y = (H / 2) - (H / 2) / zoom;
  }

  /** Re-anchors HUD components across changing screen widths */
  public relayout(): void {
    const W = this.scene.scale.width;
    const cx = W / 2;

    this.panelBg.clear();
    this.panelBg.fillGradientStyle(0x0a1f0d, 0x0a1f0d, 0x143518, 0x143518, 0.94);
    this.panelBg.fillRect(0, 0, W, 68);
    this.panelBg.fillStyle(0xfbc02d, 0.85);
    this.panelBg.fillRect(0, 67, W, 2);

    this.tibebBar.clear();
    const colors = [0x2e7d32, 0xfbc02d, 0xc62828];
    const segW = 16;
    for (let i = 0; i < Math.ceil(W / segW); i++) {
      this.tibebBar.fillStyle(colors[i % colors.length], 0.9);
      this.tibebBar.fillRect(i * segW, 0, segW, 3);
    }

    this.timerBox.x = cx;
    this.objectiveText.x = W - 20;
  }

  /** Called every frame with current game state */
  update(state: GameState): void {
    // Format remaining time as MM:SS
    const secs = Math.max(0, Math.ceil(state.timeRemaining));
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    const label = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    this.timerValue.setText(label);

    // Critical Time Pulse Warning (≤ 10 seconds remaining)
    if (secs <= 10) {
      this.timerValue.setColor('#ff3d00');
      if (!this.isTimerPulsing) {
        this.isTimerPulsing = true;
        this.scene.tweens.add({
          targets: this.timerBox,
          scale: 1.08,
          duration: 350,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    } else {
      this.timerValue.setColor('#ffffff');
      if (this.isTimerPulsing) {
        this.isTimerPulsing = false;
        this.scene.tweens.killTweensOf(this.timerBox);
        this.timerBox.setScale(1);
      }
    }

    // Wood progress update
    if (state.woodDelivered !== this.lastWoodCount) {
      this.lastWoodCount = state.woodDelivered;
      // Brief celebratory bounce on progress badge
      this.scene.tweens.add({
        targets: this.woodBox,
        scale: 1.08,
        duration: 120,
        yoyo: true,
        ease: "Back.easeOut",
      });
    }

    this.woodText.setText(`🪵 Wood: ${state.woodDelivered} / ${this.requiredWood}`);

    // Update horizontal progress bar fill
    const ratio = Phaser.Math.Clamp(state.woodDelivered / this.requiredWood, 0, 1);
    const wBoxW = 200;
    const barW = (wBoxW - 24) * ratio;
    this.woodBarFill.clear();
    if (barW > 0) {
      this.woodBarFill.fillGradientStyle(0xffb74d, 0xffd54f, 0xff9800, 0xffa726, 1);
      this.woodBarFill.fillRoundedRect(-wBoxW / 2 + 12, 10, barW, 6, 3);
    }
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.timerBox);
    this.scene.tweens.killTweensOf(this.woodBox);
    this.container.destroy();
  }
}

