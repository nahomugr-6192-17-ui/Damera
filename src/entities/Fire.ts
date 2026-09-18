// ============================================================
// Fire.ts — procedural graphics fire with wood-count growth
// ============================================================
import Phaser from "phaser";
import { FIRE_RADIUS, FIRE_DELIVER_RADIUS, FIRE_MIN_SCALE, FIRE_MAX_SCALE } from "../config/GameConfig";

export class Fire {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  private outerFlame: Phaser.GameObjects.Arc;
  private midFlame: Phaser.GameObjects.Arc;
  private coreFlame: Phaser.GameObjects.Arc;
  private glow: Phaser.GameObjects.Arc;

  private promptText: Phaser.GameObjects.Text;
  private promptVisible: boolean = false;
  private baseScale: number = FIRE_MIN_SCALE;
  private isExtinguished: boolean = false;

  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Wooden poles behind the flames
    const poles: Phaser.GameObjects.Rectangle[] = [];
    [-30, -15, 0, 15, 30].forEach(angle => {
      const pole = scene.add.rectangle(0, 0, 6, FIRE_RADIUS * 1.6, 0x5d3a1a);
      pole.setOrigin(0.5, 1);
      pole.setAngle(angle);
      pole.setPosition(Math.sin(Phaser.Math.DegToRad(angle)) * 10, FIRE_RADIUS * 0.3);
      poles.push(pole);
    });

    this.glow = scene.add.arc(0, 0, FIRE_RADIUS * 1.4, 0, 360, false, 0xff8800, 0.18);
    this.outerFlame = scene.add.arc(0, 0, FIRE_RADIUS, 0, 360, false, 0xff4500);
    this.midFlame = scene.add.arc(0, -4, FIRE_RADIUS * 0.65, 0, 360, false, 0xff8c00);
    this.coreFlame = scene.add.arc(0, -8, FIRE_RADIUS * 0.35, 0, 360, false, 0xffee00);

    this.container = scene.add.container(x, y, [
      this.glow, ...poles, this.outerFlame, this.midFlame, this.coreFlame,
    ]);
    this.container.setDepth(8);
    this.container.setScale(FIRE_MIN_SCALE);

    this.promptText = scene.add.text(0, 0, "Add Wood", {
      fontSize: "12px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#ffffff",
      backgroundColor: "#cc4400cc",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setVisible(false).setDepth(25).setScrollFactor(0);

    this.startFlicker();
  }

  /** Grow fire based on number of woods delivered */
  growFromWood(woodDelivered: number, requiredWood: number): void {
    if (this.isExtinguished) return;
    const ratio = Phaser.Math.Clamp(woodDelivered / requiredWood, 0, 1);
    this.baseScale = FIRE_MIN_SCALE + (FIRE_MAX_SCALE - FIRE_MIN_SCALE) * ratio;
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container, scale: this.baseScale,
      duration: 400, ease: "Back.easeOut",
    });
  }

  update(playerX: number, playerY: number, carryingWood: boolean): boolean {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const inRange = dist <= FIRE_DELIVER_RADIUS && carryingWood;

    if (inRange !== this.promptVisible) {
      this.promptVisible = inRange;
      this.promptText.setVisible(inRange);
    }
    if (inRange) {
      const cam = this.scene.cameras.main;
      this.promptText.setPosition(
        this.x - cam.scrollX,
        this.y - cam.scrollY - FIRE_RADIUS * this.baseScale - 16,
      );
    }
    return inRange;
  }

  onWoodAdded(): void {
    this.scene.tweens.add({
      targets: [this.outerFlame, this.midFlame, this.coreFlame],
      scaleX: 1.5, scaleY: 1.5, duration: 130, yoyo: true, ease: "Power2",
    });
  }

  extinguish(): void {
    if (this.isExtinguished) return;
    this.isExtinguished = true;
    this.scene.tweens.killTweensOf(this.outerFlame);
    this.scene.tweens.killTweensOf(this.midFlame);
    this.scene.tweens.killTweensOf(this.coreFlame);
    this.scene.tweens.killTweensOf(this.glow);
    this.outerFlame.setFillStyle(0x888888, 0.9);
    this.midFlame.setFillStyle(0x666666, 0.8);
    this.coreFlame.setFillStyle(0x444444, 0.7);
    this.glow.setFillStyle(0x555555, 0.05);
    this.scene.tweens.add({
      targets: this.container, scale: FIRE_MIN_SCALE * 0.4, alpha: 0.4,
      duration: 900, ease: "Power2",
    });
  }

  destroy(): void { this.container.destroy(); this.promptText.destroy(); }

  private startFlicker(): void {
    this.scene.tweens.add({
      targets: this.outerFlame,
      scaleX: { from: 1, to: 0.88 }, scaleY: { from: 1, to: 0.80 }, alpha: { from: 1, to: 0.75 },
      duration: 280, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.coreFlame,
      scaleX: { from: 1, to: 1.2 }, scaleY: { from: 1, to: 0.85 },
      duration: 200, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 80,
    });
    this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.18, to: 0.35 }, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }
}