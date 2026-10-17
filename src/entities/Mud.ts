// ============================================================
// Mud.ts
// A mud patch zone. When the player overlaps it, movement speed
// is reduced via Player.setInMud(true).
// ============================================================

import Phaser from 'phaser';

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

    // 1. Soft outer damp soil rim
    scene.add.ellipse(x, y, width + 14, height + 10, 0x3d2817, 0.45).setDepth(2);

    // 2. Main rich mud body
    this.zone = scene.add.ellipse(x, y, width, height, 0x54381e, 0.75);
    this.zone.setDepth(2);

    // 3. Inner deep mud puddle
    scene.add.ellipse(x, y + 2, width * 0.75, height * 0.70, 0x3b2410, 0.82).setDepth(2);

    // 4. Mud speckles and churned earth clumps
    const numSpeckles = Math.floor((width * height) / 1400);
    for (let i = 0; i < numSpeckles; i++) {
      const sx = x + Phaser.Math.Between(-width * 0.36, width * 0.36);
      const sy = y + Phaser.Math.Between(-height * 0.36, height * 0.36);
      scene.add.arc(sx, sy, Phaser.Math.Between(2, 5), 0, 360, false, 0x271607, 0.75).setDepth(2);
    }

    // 5. Wet glossy glints / water sheen on mud
    for (let i = 0; i < 3; i++) {
      const gx = x + Phaser.Math.Between(-width * 0.25, width * 0.25);
      const gy = y + Phaser.Math.Between(-height * 0.25, height * 0.25);
      scene.add.ellipse(gx, gy, Phaser.Math.Between(8, 16), 3, 0x9e7d58, 0.45).setAngle(-12).setDepth(2);
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

