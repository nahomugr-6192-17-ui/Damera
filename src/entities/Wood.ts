// ============================================================
// Wood.ts
// A wood bundle on the ground.
// Shows a "Collect" prompt when player is nearby.
// ============================================================

import Phaser from 'phaser';
import { WOOD_SIZE, COLOR_WOOD, WOOD_COLLECT_RADIUS } from '../config/GameConfig';

export class Wood {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private collected: boolean = false;

  // Visual parts
  private log1: Phaser.GameObjects.Rectangle;
  private log2: Phaser.GameObjects.Rectangle;
  private log3: Phaser.GameObjects.Rectangle;
  private promptText: Phaser.GameObjects.Text;
  private promptVisible: boolean = false;

  get isCollected(): boolean { return this.collected; }
  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Draw 3 small log rectangles stacked like a bundle
    const w = WOOD_SIZE;
    const h = Math.round(w * 0.3);
    this.log1 = scene.add.rectangle( 0, -h,     w,     h, COLOR_WOOD).setStrokeStyle(1, 0x5a3010);
    this.log2 = scene.add.rectangle( 0,  0,     w * 1.1, h, 0x7a4e2d).setStrokeStyle(1, 0x5a3010);
    this.log3 = scene.add.rectangle( 0,  h,     w,     h, COLOR_WOOD).setStrokeStyle(1, 0x5a3010);

    // Small dark end-grain circles on left/right of middle log
    const knot1 = scene.add.arc(-w * 0.5,  0, 5, 0, 360, false, 0x5a3010);
    const knot2 = scene.add.arc( w * 0.5,  0, 5, 0, 360, false, 0x5a3010);

    // "Collect" prompt (hidden until player is close)
    this.promptText = scene.add.text(0, -WOOD_SIZE - 18, 'Collect', {
      fontSize: '13px',
      fontFamily: 'Nunito, sans-serif',
      color: '#ffffff',
      backgroundColor: '#1a6600cc',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setVisible(false).setDepth(20);

    this.container = scene.add.container(x, y, [
      this.log1, this.log2, this.log3, knot1, knot2,
    ]);
    this.container.setDepth(5);
  }

  /** Call each frame. Returns true if player is in collect range. */
  update(playerX: number, playerY: number): boolean {
    if (this.collected) return false;

    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const inRange = dist <= WOOD_COLLECT_RADIUS;

    if (inRange !== this.promptVisible) {
      this.promptVisible = inRange;
      this.promptText.setVisible(inRange);
    }

    // Keep prompt above the wood in world space
    if (inRange) {
      this.promptText.setPosition(this.x, this.y - WOOD_SIZE - 14);
    }

    return inRange;
  }

  /** Remove the wood from the map */
  collect(): void {
    this.collected = true;
    this.container.setVisible(false);
    this.promptText.setVisible(false);
    this.promptText.destroy();
  }

  destroy(): void {
    this.container.destroy();
    if (this.promptText) this.promptText.destroy();
  }
}
