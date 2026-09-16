// ============================================================
// Fire.ts — ዳmeラ campfire using pixel-art sprite.
// Size grows each time wood is delivered (growFromWood).
// ============================================================

import Phaser from "phaser";
import { FIRE_DELIVER_RADIUS, FIRE_MIN_SCALE, FIRE_MAX_SCALE } from "../config/GameConfig";

export class Fire {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Arc;
  private prompt: Phaser.GameObjects.Text;

  private baseScale: number = FIRE_MIN_SCALE;
  private promptVisible: boolean = false;
  private isExtinguished: boolean = false;

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Orange glow underneath the sprite
    this.glow = scene.add.arc(x, y + 10, 48, 0, 360, false, 0xff6600, 0.25);
    this.glow.setDepth(7);

    // Pixel art campfire sprite
    this.sprite = scene.add.image(x, y, "fire");
    this.sprite.setDisplaySize(90, 90);
    this.sprite.setDepth(8);
    this.sprite.setScale(FIRE_MIN_SCALE);

    // "Add Wood" interaction prompt
    this.prompt = scene.add.text(x, y - 55, "Add Wood to \u12f3\u1218\u122b", {
      fontSize: "14px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#ffffff",
      backgroundColor: "#cc4400cc",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setVisible(false).setDepth(25).setScrollFactor(0);

    // Breathing glow animation
    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.25, to: 0.55 },
      scaleX: { from: 1, to: 1.3 },
      scaleY: { from: 1, to: 1.3 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtle sprite bob animation
    scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: FIRE_MIN_SCALE, to: FIRE_MIN_SCALE * 1.06 },
      scaleY: { from: FIRE_MIN_SCALE, to: FIRE_MIN_SCALE * 0.96 },
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Grow the fire based on how many woods have been delivered.
   * Scale transitions smoothly to the new size.
   * Call this once from deliverWood() in GameScene.
   */
  growFromWood(woodDelivered: number, requiredWood: number): void {
    if (this.isExtinguished) return;

    const ratio = Phaser.Math.Clamp(woodDelivered / requiredWood, 0, 1);
    this.baseScale = FIRE_MIN_SCALE + (FIRE_MAX_SCALE - FIRE_MIN_SCALE) * ratio;

    // Kill existing scale tweens and tween to new size
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: this.baseScale,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        // Restart the gentle bob at the new base scale
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: { from: this.baseScale, to: this.baseScale * 1.06 },
          scaleY: { from: this.baseScale, to: this.baseScale * 0.96 },
          duration: 350,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    // Also grow the glow
    this.scene.tweens.killTweensOf(this.glow);
    const glowBase = 48 * (0.6 + ratio * 1.0);
    this.scene.tweens.add({
      targets: this.glow,
      radius: glowBase,
      alpha: 0.3 + ratio * 0.25,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.glow,
          alpha: { from: 0.25 + ratio * 0.2, to: 0.55 + ratio * 0.2 },
          scaleX: { from: 1, to: 1.3 },
          scaleY: { from: 1, to: 1.3 },
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });
  }

  /** Call every frame — shows prompt and returns true when delivery is possible */
  update(playerX: number, playerY: number, carryingWood: boolean): boolean {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const inRange = dist <= FIRE_DELIVER_RADIUS && carryingWood;

    if (inRange !== this.promptVisible) {
      this.promptVisible = inRange;
      this.prompt.setVisible(inRange);
    }
    if (inRange) {
      const cam = this.scene.cameras.main;
      this.prompt.setPosition(
        this.x - cam.scrollX,
        this.y - cam.scrollY - this.sprite.displayHeight * this.baseScale * 0.5 - 10,
      );
    }
    return inRange;
  }

  /** Burst flash on wood delivery */
  onWoodAdded(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: this.baseScale * 1.4,
      duration: 120,
      yoyo: true,
      ease: "Power2",
    });
  }

  /** Grey out the fire on game over */
  extinguish(): void {
    if (this.isExtinguished) return;
    this.isExtinguished = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glow);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: FIRE_MIN_SCALE * 0.3,
      alpha: 0.25,
      duration: 900,
      ease: "Power2",
    });
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0,
      duration: 600,
    });
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow.destroy();
    this.prompt.destroy();
  }
}