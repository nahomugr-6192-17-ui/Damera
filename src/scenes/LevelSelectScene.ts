// ============================================================
// LevelSelectScene.ts
// Shows EASY / MEH / HARD buttons with descriptions.
// Stores the chosen level key in the Phaser registry and
// transitions to GameScene.
// ============================================================

import Phaser from 'phaser';
import { LEVELS } from '../config/LevelConfig';
import type { DifficultyKey } from '../config/LevelConfig';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
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
    this.add.text(cx, 28, 'CHOOSE DIFFICULTY', {
      fontSize: '26px',
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      color: '#ffee58',
      stroke: '#5d2a00',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this.add.text(cx, 68, 'How hard do you want the challenge?', {
      fontSize: '14px',
      fontFamily: 'Nunito, sans-serif',
      color: '#c8e6c9',
      fontStyle: 'italic',
    }).setOrigin(0.5, 0);

    // ── Level cards ──────────────────────────────────────────
    const cardData: { key: DifficultyKey; color: number; accent: number; icon: string }[] = [
      { key: 'EASY', color: 0x2e7d32, accent: 0x1b5e20, icon: '🌿' },
      { key: 'MEH',  color: 0xe65100, accent: 0xbf360c, icon: '🔥' },
      { key: 'HARD', color: 0xb71c1c, accent: 0x7f0000, icon: '⚡' },
    ];

    const cardH = 130;
    const cardW = W - 48;
    const startY = H * 0.22;
    const gap    = cardH + 18;

    cardData.forEach(({ key, color, accent, icon }, i) => {
      const cfg = LEVELS[key];
      const y   = startY + i * gap;

      // Card background
      const cardGfx = this.add.graphics();
      cardGfx.fillGradientStyle(color, color, accent, accent, 1);
      cardGfx.fillRoundedRect(24, y, cardW, cardH, 16);
      cardGfx.lineStyle(2, 0xffffff, 0.15);
      cardGfx.strokeRoundedRect(24, y, cardW, cardH, 16);

      // Hit area
      const hit = this.add
        .rectangle(cx, y + cardH / 2, cardW, cardH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      // Icon + name
      this.add.text(52, y + 18, icon, { fontSize: '28px' });
      this.add.text(90, y + 18, cfg.label, {
        fontSize: '26px',
        fontFamily: 'Fredoka One, Nunito, sans-serif',
        color: '#ffffff',
        stroke: '#00000055',
        strokeThickness: 2,
      });

      // Description
      this.add.text(52, y + 56, cfg.description, {
        fontSize: '13px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffffffcc',
        wordWrap: { width: cardW - 60 },
      });

      // Stats row
      const mins  = Math.floor(cfg.time / 60);
      const secs  = cfg.time % 60;
      const tStr  = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      this.add.text(52, y + 95, `⏱ ${tStr}   🪵 ${cfg.requiredWood} woods`, {
        fontSize: '13px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffe082',
        fontStyle: 'bold',
      });

      // Interaction
      hit.on('pointerdown', () => {
        this.registry.set('selectedLevel', key);
        this.scene.start('GameScene');
      });
      hit.on('pointerover', () => {
        this.tweens.add({ targets: cardGfx, alpha: 0.85, duration: 80 });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: cardGfx, alpha: 1.0, duration: 80 });
      });
    });

    // ── BACK button ──────────────────────────────────────────
    const backY = H - 52;
    const backBg = this.add.graphics();
    backBg.fillStyle(0x37474f);
    backBg.fillRoundedRect(cx - 90, backY - 22, 180, 44, 10);

    const backHit = this.add
      .rectangle(cx, backY, 180, 44, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    this.add.text(cx, backY, '← BACK', {
      fontSize: '18px',
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    backHit.on('pointerdown', () => this.scene.start('MainMenuScene'));
    backHit.on('pointerover',  () => backBg.setAlpha(0.7));
    backHit.on('pointerout',   () => backBg.setAlpha(1.0));
  }
}
