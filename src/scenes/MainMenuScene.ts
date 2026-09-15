// ============================================================
// MainMenuScene.ts
// The game's title screen. Shows the game name, subtitle, and
// buttons for Play and How To Play.
// ============================================================

import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ── Background gradient (dark green → lighter green) ─────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // ── Decorative trees left/right ──────────────────────────
    this.drawDecorTree(80,  H * 0.35, 38);
    this.drawDecorTree(W - 70, H * 0.38, 34);
    this.drawDecorTree(50,  H * 0.65, 30);
    this.drawDecorTree(W - 55, H * 0.68, 28);
    this.drawDecorTree(cx - 150, H * 0.78, 26);
    this.drawDecorTree(cx + 145, H * 0.80, 28);

    // ── Fire glow behind the title ───────────────────────────
    const glow = this.add.arc(cx, H * 0.22, 70, 0, 360, false, 0xff6600, 0.22);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.22, to: 0.42 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Fire icon above title ────────────────────────────────
    const fireOuter = this.add.arc(cx, H * 0.22, 32, 0, 360, false, 0xff4500);
    const fireMid   = this.add.arc(cx, H * 0.22 - 5, 20, 0, 360, false, 0xff8c00);
    const fireCore  = this.add.arc(cx, H * 0.22 - 10, 10, 0, 360, false, 0xffee00);
    this.tweens.add({
      targets: [fireOuter, fireMid, fireCore],
      scaleX: { from: 1, to: 0.9 },
      scaleY: { from: 1, to: 0.85 },
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Game title ───────────────────────────────────────────
    this.add.text(cx, H * 0.36, 'MESKEL ችቦ', {
      fontSize: '42px',
      fontFamily: '"Noto Sans Ethiopic", "Fredoka One", Nunito, sans-serif',
      color: '#ffee58',
      stroke: '#5d2a00',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true },
    }).setOrigin(0.5);

    // ── Ethiopian name subtitle ──────────────────────────────
    this.add.text(cx, H * 0.46, 'ዳመራ', {
      fontSize: '28px',
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: '#a5d6a7',
      stroke: '#1b3a00',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Tagline ──────────────────────────────────────────────
    this.add.text(cx, H * 0.535, 'Keep the Fire Burning', {
      fontSize: '17px',
      fontFamily: 'Nunito, sans-serif',
      color: '#c8e6c9',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // ── PLAY button ──────────────────────────────────────────
    this.makeButton(cx, H * 0.645, 'PLAY', 0xe65100, 0xbf360c, () => {
      this.scene.start('LevelSelectScene');
    });

    // ── HOW TO PLAY button ───────────────────────────────────
    this.makeButton(cx, H * 0.755, 'HOW TO PLAY', 0x1565c0, 0x0d47a1, () => {
      this.scene.start('HowToPlayScene');
    });

    // ── Version / credit ─────────────────────────────────────
    this.add.text(cx, H - 18, 'Phase 1 Prototype • Meskel ችቦ', {
      fontSize: '11px',
      fontFamily: 'Nunito, sans-serif',
      color: '#66bb6a',
    }).setOrigin(0.5, 1);
  }

  private makeButton(
    x: number, y: number,
    label: string,
    colorTop: number,
    colorBot: number,
    cb: () => void,
  ): void {
    const btnW = 230, btnH = 60;

    const bg = this.add.graphics();
    bg.fillGradientStyle(colorTop, colorTop, colorBot, colorBot, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 16);

    const hit = this.add
      .rectangle(x, y, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: '24px',
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      color: '#ffffff',
      stroke: '#00000044',
      strokeThickness: 2,
    }).setOrigin(0.5);

    hit.on('pointerdown', cb);
    hit.on('pointerover', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
  }

  private drawDecorTree(x: number, y: number, r: number): void {
    // Trunk
    this.add.rectangle(x, y + r * 0.6, r * 0.35, r * 0.8, 0x5d3a1a);
    // Canopy
    this.add.arc(x, y, r, 0, 360, false, 0x2e7d32);
    this.add.arc(x, y, r * 0.7, 0, 360, false, 0x388e3c);
    this.add.arc(x, y - r * 0.2, r * 0.45, 0, 360, false, 0x43a047);
  }
}
