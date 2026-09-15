// ============================================================
// GameOverOverlay.ts
// Dark overlay shown when the timer expires before the objective
// is completed. Shows red "GAME OVER", progress, and buttons.
// ============================================================

import Phaser from 'phaser';

export class GameOverOverlay {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor(
    scene: Phaser.Scene,
    woodDelivered: number,
    requiredWood: number,
    onPlayAgain: () => void,
    onMainMenu: () => void,
  ) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const cx = W / 2;

    // ── Dark overlay ─────────────────────────────────────────
    const overlay = scene.add
      .rectangle(cx, H / 2, W, H, 0x111111, 0.88)
      .setScrollFactor(0)
      .setDepth(100);
    this.elements.push(overlay);

    // ── GAME OVER title ──────────────────────────────────────
    const title = scene.add
      .text(cx, H * 0.22, 'GAME OVER', {
        fontSize: '48px',
        fontFamily: 'Fredoka One, Nunito, sans-serif',
        color: '#ff3333',
        stroke: '#660000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.elements.push(title);

    // ── Subtitle ─────────────────────────────────────────────
    const sub = scene.add
      .text(cx, H * 0.34, 'The fire went out.', {
        fontSize: '20px',
        fontFamily: 'Nunito, sans-serif',
        color: '#cccccc',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.elements.push(sub);

    // ── Progress ─────────────────────────────────────────────
    const progress = scene.add
      .text(cx, H * 0.44, `Wood: ${woodDelivered} / ${requiredWood}\nTime: 00:00`, {
        fontSize: '18px',
        fontFamily: 'Nunito, sans-serif',
        color: '#aaaaaa',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.elements.push(progress);

    // ── PLAY AGAIN button ────────────────────────────────────
    this.makeButton(scene, cx, H * 0.60, 'PLAY AGAIN', 0x2e7d32, onPlayAgain);

    // ── MAIN MENU button ─────────────────────────────────────
    this.makeButton(scene, cx, H * 0.73, 'MAIN MENU', 0x424242, onMainMenu);
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    color: number,
    callback: () => void,
  ): void {
    const btnW = 220, btnH = 54;

    const bg = scene.add
      .rectangle(x, y, btnW, btnH, color, 1)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });

    const txt = scene.add
      .text(x, y, label, {
        fontSize: '20px',
        fontFamily: 'Fredoka One, Nunito, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    bg.on('pointerdown', callback);
    bg.on('pointerover',  () => bg.setAlpha(0.8));
    bg.on('pointerout',   () => bg.setAlpha(1.0));

    this.elements.push(bg, txt);
  }

  destroy(): void {
    this.elements.forEach(e => e.destroy());
    this.elements = [];
  }
}
