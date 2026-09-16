// ============================================================
// BootScene.ts — generates the grass tile + preloads sprites
// ============================================================

import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: "BootScene" }); }

  preload(): void {
    // Pixel-art sprites used across the game
    this.load.image("tree", "assets/tree.png");
    this.load.image("wood", "assets/wood.png");
    this.load.image("fire", "assets/fire.png");
  }

  create(): void {
    // Generate 64x64 grass tile as a RenderTexture
    const TILE = 64;
    const rt = this.add.renderTexture(0, 0, TILE, TILE);
    const gfx = this.add.graphics();

    const baseColors = [0x4caf50, 0x43a047, 0x388e3c];
    baseColors.forEach(c => {
      gfx.fillStyle(c, 1);
      gfx.fillRect(
        Phaser.Math.Between(0, TILE),
        Phaser.Math.Between(0, TILE),
        Phaser.Math.Between(12, 24),
        Phaser.Math.Between(12, 24),
      );
    });
    gfx.fillStyle(0x33691e, 1);
    gfx.fillRect(0, 0, TILE, TILE);

    // Tuft marks
    for (let i = 0; i < 10; i++) {
      gfx.fillStyle(Phaser.Math.Between(0x388e3c, 0x43a047), 0.6);
      gfx.fillRect(
        Phaser.Math.Between(0, TILE - 4),
        Phaser.Math.Between(0, TILE - 6),
        Phaser.Math.Between(3, 7),
        Phaser.Math.Between(4, 8),
      );
    }

    rt.draw(gfx, 0, 0);
    rt.saveTexture("grass");
    gfx.destroy();
    rt.destroy();

    this.scene.start("MainMenuScene");
  }
}