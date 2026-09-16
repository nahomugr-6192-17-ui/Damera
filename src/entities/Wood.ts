// ============================================================
// Wood.ts — procedural wood bundle. Disappears instantly on collect.
// ============================================================
import Phaser from "phaser";
import { WOOD_COLLECT_RADIUS } from "../config/GameConfig";

export class Wood {
  private scene:      Phaser.Scene;
  private graphics:   Phaser.GameObjects.Graphics;
  private prompt:     Phaser.GameObjects.Text;
  private _collected: boolean = false;
  private _x: number;
  private _y: number;

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get isCollected(): boolean { return this._collected; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this._x = x;
    this._y = y;

    // Draw the wood bundle directly (no container — avoids tween issues)
    this.graphics = scene.add.graphics();
    this.drawWood();
    this.graphics.setDepth(5);

    this.prompt = scene.add.text(x, y - 28, "Collect", {
      fontSize: "13px",
      fontFamily: "Nunito, sans-serif",
      color: "#ffffff",
      backgroundColor: "#2e7d32cc",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setVisible(false).setDepth(25).setScrollFactor(0);
  }

  update(playerX: number, playerY: number): boolean {
    if (this._collected) return false;
    const dist    = Phaser.Math.Distance.Between(playerX, playerY, this._x, this._y);
    const inRange = dist <= WOOD_COLLECT_RADIUS;
    this.prompt.setVisible(inRange);
    if (inRange) {
      const cam = this.scene.cameras.main;
      this.prompt.setPosition(this._x - cam.scrollX, this._y - cam.scrollY - 28);
    }
    return inRange;
  }

  collect(): void {
    this._collected = true;
    // Hide immediately — no tween delay
    this.graphics.setVisible(false);
    this.graphics.setActive(false);
    this.prompt.setVisible(false);
  }

  destroy(): void {
    this.graphics.destroy();
    this.prompt.destroy();
  }

  private drawWood(): void {
    const g = this.graphics;
    const x = this._x;
    const y = this._y;
    // Three stacked log shapes
    g.fillStyle(0x8b5e3c, 1);
    g.fillRoundedRect(x - 18, y - 7, 36, 8, 3);
    g.fillStyle(0x7a4e2d, 1);
    g.fillRoundedRect(x - 15, y + 1, 30, 8, 3);
    g.fillStyle(0x8b5e3c, 1);
    g.fillRoundedRect(x - 18, y + 9, 36, 8, 3);
    // End grain circles
    g.fillStyle(0x5a3010, 1);
    g.fillCircle(x - 14, y - 3, 4);
    g.fillStyle(0x6b4020, 1);
    g.fillCircle(x - 14, y - 3, 2);
    g.fillStyle(0x5a3010, 1);
    g.fillCircle(x + 14, y + 5, 4);
    g.fillStyle(0x6b4020, 1);
    g.fillCircle(x + 14, y + 5, 2);
  }
}