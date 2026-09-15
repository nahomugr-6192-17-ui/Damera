// ============================================================
// Mud.ts
// A mud patch zone. When the player overlaps it, movement speed
// is reduced via Player.setInMud(true).
// ============================================================

import Phaser from 'phaser';
import { COLOR_MUD, MUD_ALPHA } from '../config/GameConfig';

export class Mud {
  public zone: Phaser.GameObjects.Ellipse;
  private scene: Phaser.Scene;

  readonly halfW: number;
  readonly halfH: number;

  get x(): number { return this.zone.x; }
  get y(): number { return this.zone.y; }

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.halfW = width  / 2;
    this.halfH = height / 2;

    // Draw mud as a dark ellipse with some texture dots
    this.zone = scene.add.ellipse(x, y, width, height, COLOR_MUD, MUD_ALPHA);
    this.zone.setDepth(2);

    // Add some darker speckles to make it look more like mud
    const numSpeckles = Math.floor((width * height) / 1800);
    for (let i = 0; i < numSpeckles; i++) {
      const sx = x + Phaser.Math.Between(-width * 0.38, width * 0.38);
      const sy = y + Phaser.Math.Between(-height * 0.38, height * 0.38);
      scene.add.arc(sx, sy, Phaser.Math.Between(3, 7), 0, 360, false, 0x5a3a10, 0.45).setDepth(2);
    }
  }

  /**
   * Returns true if the given world point is inside this mud zone.
   * Uses a simple ellipse containment test.
   */
  containsPoint(px: number, py: number): boolean {
    const dx = (px - this.x) / this.halfW;
    const dy = (py - this.y) / this.halfH;
    return (dx * dx + dy * dy) <= 1;
  }

  destroy(): void {
    this.zone.destroy();
  }
}
