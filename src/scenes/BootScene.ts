// ============================================================
// BootScene.ts
// First scene to run. Generates all procedural textures and
// then hands off to MainMenuScene.
// ============================================================

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // All graphics are generated programmatically — nothing to load.
    // If you add sprite sheets or audio later, load them here.
  }

  create(): void {
    // Generate a grass tile texture used as the map background
    this.generateGrassTile();
    // Move straight to the main menu
    this.scene.start('MainMenuScene');
  }

  private generateGrassTile(): void {
    const size = 64;
    const gfx = this.add.graphics();

    // Base green
    gfx.fillStyle(0x4caf50);
    gfx.fillRect(0, 0, size, size);

    // Darker green variation patches
    gfx.fillStyle(0x43a047, 0.5);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillRect(32, 32, 32, 32);

    // Small grass tufts
    gfx.fillStyle(0x388e3c, 0.6);
    [[8, 12], [40, 50], [20, 40], [52, 20], [30, 8], [55, 48]].forEach(([x, y]) => {
      gfx.fillRect(x, y, 3, 5);
      gfx.fillRect(x + 3, y + 2, 2, 4);
    });

    gfx.generateTexture('grass', size, size);
    gfx.destroy();
  }
}
