// ============================================================
// HowToPlayScene.ts
// Explains the game with a visual icon layout + text.
// ============================================================

import Phaser from 'phaser';

export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HowToPlayScene' });
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ── Background ───────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // ── Title ────────────────────────────────────────────────
    this.add.text(cx, 24, 'HOW TO PLAY', {
      fontSize: '28px',
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      color: '#ffee58',
      stroke: '#5d2a00',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // ── Visual flow diagram ──────────────────────────────────
    const iconY = H * 0.22;
    const iconSpacing = W / 4;

    // Tree icon
    this.drawMiniTree(iconSpacing * 0.6, iconY, 20);
    this.add.text(iconSpacing * 0.6, iconY + 28, '🌲 Forest', {
      fontSize: '12px', fontFamily: 'Nunito, sans-serif', color: '#a5d6a7',
    }).setOrigin(0.5);

    // Arrow →
    this.add.text(iconSpacing * 1.2, iconY - 2, '→', {
      fontSize: '22px', fontFamily: 'Nunito, sans-serif', color: '#ffee58',
    }).setOrigin(0.5);

    // Wood icon
    this.drawMiniWood(iconSpacing * 1.8, iconY);
    this.add.text(iconSpacing * 1.8, iconY + 28, '🪵 Wood', {
      fontSize: '12px', fontFamily: 'Nunito, sans-serif', color: '#a5d6a7',
    }).setOrigin(0.5);

    // Arrow →
    this.add.text(iconSpacing * 2.4, iconY - 2, '→', {
      fontSize: '22px', fontFamily: 'Nunito, sans-serif', color: '#ffee58',
    }).setOrigin(0.5);

    // Fire icon
    this.drawMiniFire(iconSpacing * 3.0, iconY);
    this.add.text(iconSpacing * 3.0, iconY + 28, '🔥 ችቦ', {
      fontSize: '12px', fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif', color: '#a5d6a7',
    }).setOrigin(0.5);

    // ── Player icon in the middle row ────────────────────────
    this.drawMiniPlayer(cx, iconY + 72);
    this.add.text(cx, iconY + 100, '👨🌾 You!', {
      fontSize: '12px', fontFamily: 'Nunito, sans-serif', color: '#ffe082',
    }).setOrigin(0.5);

    // ── Step-by-step instructions ────────────────────────────
    const steps = [
      '1. Move your farmer around the forest.',
      '2. Find and collect wood bundles.',
      '3. Carry the wood back to the ችቦ.',
      '4. Add wood to the fire.',
      '5. Complete the objective before time runs out!',
    ];

    const startY = H * 0.52;
    steps.forEach((step, i) => {
      this.add.text(cx, startY + i * 30, step, {
        fontSize: '14px',
        fontFamily: 'Nunito, sans-serif',
        color: '#e8f5e9',
        wordWrap: { width: W - 48 },
      }).setOrigin(0.5, 0);
    });

    // ── Mud warning ──────────────────────────────────────────
    const mudY = startY + steps.length * 30 + 16;
    const mudBg = this.add.graphics();
    mudBg.fillStyle(0x7b5c2e, 0.6);
    mudBg.fillRoundedRect(24, mudY, W - 48, 50, 10);

    this.add.text(cx, mudY + 10, '⚠ Mud slows you down.', {
      fontSize: '14px',
      fontFamily: 'Nunito, sans-serif',
      color: '#ffe082',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(cx, mudY + 30, 'Try to avoid it when you are in a hurry.', {
      fontSize: '12px',
      fontFamily: 'Nunito, sans-serif',
      color: '#d7ccc8',
    }).setOrigin(0.5, 0);

    // ── BACK button ──────────────────────────────────────────
    const btnY = H - 60;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x424242);
    btnBg.fillRoundedRect(cx - 100, btnY - 24, 200, 48, 12);

    const hitArea = this.add
      .rectangle(cx, btnY, 200, 48, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, btnY, '← BACK', {
      fontSize: '20px',
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    hitArea.on('pointerdown', () => this.scene.start('MainMenuScene'));
    hitArea.on('pointerover',  () => btnBg.setAlpha(0.7));
    hitArea.on('pointerout',   () => btnBg.setAlpha(1.0));
  }

  private drawMiniTree(x: number, y: number, r: number): void {
    this.add.rectangle(x, y + r * 0.7, 6, r, 0x5d3a1a);
    this.add.arc(x, y, r, 0, 360, false, 0x2e7d32);
    this.add.arc(x, y - r * 0.2, r * 0.6, 0, 360, false, 0x43a047);
  }

  private drawMiniWood(x: number, y: number): void {
    this.add.rectangle(x, y - 5, 28, 7, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
    this.add.rectangle(x, y + 3, 24, 7, 0x7a4e2d).setStrokeStyle(1, 0x5a3010);
    this.add.rectangle(x, y + 11, 28, 7, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
  }

  private drawMiniFire(x: number, y: number): void {
    this.add.arc(x, y, 16, 0, 360, false, 0xff4500);
    this.add.arc(x, y - 4, 10, 0, 360, false, 0xff8c00);
    this.add.arc(x, y - 8, 6,  0, 360, false, 0xffee00);
  }

  private drawMiniPlayer(x: number, y: number): void {
    // Head
    this.add.arc(x, y - 14, 8, 0, 360, false, 0xf4a261);
    // Body
    this.add.rectangle(x, y, 12, 18, 0x2196f3);
  }
}
