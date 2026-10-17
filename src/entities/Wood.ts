// ============================================================
// Wood.ts — Procedural realistic firewood bundle.
// Disappears instantly on collect.
// ============================================================
import Phaser from "phaser";
import { WOOD_COLLECT_RADIUS } from "../config/GameConfig";

export class Wood {
  private scene:      Phaser.Scene;
  private graphics:   Phaser.GameObjects.Graphics;
  private prompt:     Phaser.GameObjects.Container;
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

    // Draw the wood bundle directly
    this.graphics = scene.add.graphics();
    this.drawWood();
    this.graphics.setDepth(5);

    // Polished prompt badge
    const promptBg = scene.add.graphics();
    promptBg.fillStyle(0x1b5e20, 0.92);
    promptBg.fillRoundedRect(-38, -12, 76, 24, 6);
    promptBg.lineStyle(1.2, 0xa5d6a7, 0.85);
    promptBg.strokeRoundedRect(-38, -12, 76, 24, 6);

    const promptTxt = scene.add.text(0, 0, "🪵 Collect", {
      fontSize: "12px",
      fontFamily: "Nunito, sans-serif",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.prompt = scene.add.container(x, y - 24, [promptBg, promptTxt]);
    this.prompt.setVisible(false).setDepth(25).setScrollFactor(0);
  }

  update(playerX: number, playerY: number): boolean {
    if (this._collected) return false;
    const dist    = Phaser.Math.Distance.Between(playerX, playerY, this._x, this._y);
    const inRange = dist <= WOOD_COLLECT_RADIUS;
    this.prompt.setVisible(inRange);
    if (inRange) {
      const cam = this.scene.cameras.main;
      this.prompt.setPosition(this._x - cam.scrollX, this._y - cam.scrollY - 24);
    }
    return inRange;
  }

  collect(): void {
    this._collected = true;
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

    // 1. Soft ground shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(x, y + 12, 40, 12);

    // 2. Bottom Log (Left)
    g.fillStyle(0x543310, 1); // Dark bark
    g.fillRoundedRect(x - 18, y + 3, 36, 9, 3);
    g.fillStyle(0x744a20, 1); // Inner wood highlight
    g.fillRect(x - 14, y + 5, 26, 3);
    // End ring left
    g.fillStyle(0x3e230a, 1);
    g.fillCircle(x - 15, y + 7, 3.8);
    g.fillStyle(0xd4a373, 1);
    g.fillCircle(x - 15, y + 7, 2.2);
    g.fillStyle(0x543310, 1);
    g.fillCircle(x - 15, y + 7, 0.9);

    // 3. Bottom Log (Right offset)
    g.fillStyle(0x4a2c0c, 1);
    g.fillRoundedRect(x - 14, y - 4, 34, 8, 3);
    g.fillStyle(0x6b4018, 1);
    g.fillRect(x - 10, y - 2, 24, 2.5);
    // End ring right
    g.fillStyle(0x3e230a, 1);
    g.fillCircle(x + 16, y, 3.4);
    g.fillStyle(0xd4a373, 1);
    g.fillCircle(x + 16, y, 1.9);

    // 4. Top Log
    g.fillStyle(0x663c15, 1);
    g.fillRoundedRect(x - 17, y - 9, 35, 9, 3);
    g.fillStyle(0x8a5423, 1);
    g.fillRect(x - 13, y - 7, 26, 3);
    // End ring left
    g.fillStyle(0x3e230a, 1);
    g.fillCircle(x - 14, y - 5, 3.8);
    g.fillStyle(0xe2b78a, 1);
    g.fillCircle(x - 14, y - 5, 2.2);
    g.fillStyle(0x543310, 1);
    g.fillCircle(x - 14, y - 5, 0.9);

    // 5. Golden hemp binding rope
    g.fillStyle(0xfbc02d, 1);
    g.fillRect(x - 6, y - 10, 3, 22);
    g.fillRect(x + 5, y - 10, 3, 22);
    g.fillStyle(0xc49000, 1);
    g.fillRect(x - 6, y - 10, 1, 22);
    g.fillRect(x + 5, y - 10, 1, 22);
  }
}