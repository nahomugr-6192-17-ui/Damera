// ============================================================
// BootScene.ts — generates rich grass tile + preloads sprites
// ============================================================

import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: "BootScene" }); }

  preload(): void {
    // Preload audio feedback and speech effects
    this.load.audio("pickup_hoy", "assets/audio/pickup_hoy.wav");
    this.load.audio("fire_whoosh", "assets/audio/fire_whoosh.ogg");
    this.load.audio("countdown_tick", "assets/audio/countdown_tick.wav");
    this.load.audio("ui_click", "assets/audio/ui_click.wav");
    this.load.audio("victory_ululation", "assets/audio/victory_ululation.wav");
    this.load.audio("fire_extinguish", "assets/audio/fire_extinguish.wav");
    this.load.audio("gameover_amharic", "assets/audio/gameover_amharic.mp3");

    // Preload studio logo artwork
    this.load.image("papa_smurf_logo", "assets/papa_smurf_logo.png");
  }

  create(): void {
    // Generate 64x64 lush Ethiopian highland meadow grass tile
    const TILE = 64;
    const rt = this.add.renderTexture(0, 0, TILE, TILE);
    const gfx = this.add.graphics();

    // 1. Rich base meadow green
    gfx.fillStyle(0x2e7d32, 1);
    gfx.fillRect(0, 0, TILE, TILE);

    // 2. Soft mottled tone patches
    const patchColors = [0x256628, 0x338a37, 0x388e3c, 0x2b752e];
    for (let i = 0; i < 8; i++) {
      gfx.fillStyle(patchColors[i % patchColors.length], 0.7);
      gfx.fillCircle(
        Phaser.Math.Between(0, TILE),
        Phaser.Math.Between(0, TILE),
        Phaser.Math.Between(10, 22)
      );
    }

    // 3. Fine grass blade strokes
    for (let i = 0; i < 18; i++) {
      const bx = Phaser.Math.Between(4, TILE - 4);
      const by = Phaser.Math.Between(6, TILE - 4);
      const bladeH = Phaser.Math.Between(5, 9);
      const shade = (i % 2 === 0) ? 0x43a047 : 0x1b5e20;
      gfx.fillStyle(shade, 0.75);
      gfx.fillRect(bx, by, 1.8, bladeH);
      gfx.fillRect(bx + 1.5, by + 1, 1.5, bladeH - 2);
    }

    // 4. Subtle sparse Adey Abeba wildflowers (yellow with orange center)
    const flowerX = 22, flowerY = 40;
    gfx.fillStyle(0xfbc02d, 0.85); // Yellow petals
    gfx.fillCircle(flowerX - 2, flowerY, 1.8);
    gfx.fillCircle(flowerX + 2, flowerY, 1.8);
    gfx.fillCircle(flowerX, flowerY - 2, 1.8);
    gfx.fillCircle(flowerX, flowerY + 2, 1.8);
    gfx.fillStyle(0xe65100, 0.95); // Orange center
    gfx.fillCircle(flowerX, flowerY, 1.3);

    rt.draw(gfx, 0, 0);
    rt.saveTexture("grass");
    gfx.destroy();
    rt.destroy();

    this.scene.start("SplashScreenScene");
  }
}