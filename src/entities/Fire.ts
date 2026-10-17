// ============================================================
// Fire.ts — Authentic Ethiopian ደመራ (Demera) bonfire
// Layered organic flames, glowing aura, rising embers, and
// traditional conical wood structure with Adey Abeba crest.
// ============================================================
import Phaser from "phaser";
import { FIRE_RADIUS, FIRE_DELIVER_RADIUS, FIRE_MIN_SCALE, FIRE_MAX_SCALE } from "../config/GameConfig";

export class Fire {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  // Visual layers
  private glowOuter: Phaser.GameObjects.Arc;
  private glowInner: Phaser.GameObjects.Arc;
  private woodGroup: Phaser.GameObjects.Container;
  private flamesGroup: Phaser.GameObjects.Container;
  private embersGroup: Phaser.GameObjects.Container;
  private smokeGroup: Phaser.GameObjects.Container;

  // Individual flame layers for organic deformation
  private flameOuterL: Phaser.GameObjects.Ellipse;
  private flameOuterC: Phaser.GameObjects.Ellipse;
  private flameOuterR: Phaser.GameObjects.Ellipse;
  private flameMidL: Phaser.GameObjects.Ellipse;
  private flameMidC: Phaser.GameObjects.Ellipse;
  private flameMidR: Phaser.GameObjects.Ellipse;
  private flameCore: Phaser.GameObjects.Ellipse;
  private flameHotTip: Phaser.GameObjects.Arc;

  // Adey Abeba / Cross ornament on top of the Demera
  private topOrnament: Phaser.GameObjects.Container;

  // Wood poles
  private poles: Phaser.GameObjects.Rectangle[] = [];

  // Embers system
  private emberParticles: { obj: Phaser.GameObjects.Arc; vx: number; vy: number; life: number; maxLife: number }[] = [];
  private emberTimer?: Phaser.Time.TimerEvent;

  private promptContainer: Phaser.GameObjects.Container;
  private promptVisible: boolean = false;
  private baseScale: number = FIRE_MIN_SCALE;
  private isExtinguished: boolean = false;

  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // ── 1. Radiant Ambient Glow ───────────────────────────────
    // Soft outer ambient light pool
    this.glowOuter = scene.add.arc(0, 4, FIRE_RADIUS * 2.2, 0, 360, false, 0xff3d00, 0.12);
    // Warm intense inner glow
    this.glowInner = scene.add.arc(0, 0, FIRE_RADIUS * 1.5, 0, 360, false, 0xff9100, 0.22);

    // ── 2. Traditional Demera Conical Wood Structure ───────────
    this.woodGroup = scene.add.container(0, 0);

    // Base firewood logs horizontally cross-stacked
    const baseLog1 = scene.add.rectangle(0, 16, FIRE_RADIUS * 1.4, 8, 0x4a2c11).setStrokeStyle(1, 0x2e1804);
    const baseLog2 = scene.add.rectangle(0, 21, FIRE_RADIUS * 1.6, 7, 0x3d210b).setStrokeStyle(1, 0x2e1804);
    const baseChar = scene.add.ellipse(0, 24, FIRE_RADIUS * 1.8, 10, 0x1f140a, 0.6);
    this.woodGroup.add([baseChar, baseLog2, baseLog1]);

    // Conical upright branches (Chibo poles tied into a conical teepee)
    const angles = [-38, -26, -15, -7, 0, 7, 15, 26, 38];
    const poleColors = [0x5d3a1a, 0x4e3014, 0x6d4420, 0x4a2c11, 0x5a3617, 0x633e1d, 0x4e3014, 0x5d3a1a, 0x4a2c11];

    angles.forEach((angle, i) => {
      const poleH = FIRE_RADIUS * (1.65 + Math.cos(Phaser.Math.DegToRad(angle * 2)) * 0.25);
      const pole = scene.add.rectangle(0, 0, 5.5, poleH, poleColors[i % poleColors.length]);
      pole.setOrigin(0.5, 1);
      pole.setAngle(angle);
      pole.setPosition(Math.sin(Phaser.Math.DegToRad(angle)) * 14, 18);
      pole.setStrokeStyle(1, 0x2e1804);
      this.poles.push(pole);
      this.woodGroup.add(pole);
    });

    // Traditional binding rope bands encircling the cone
    const ropeBand1 = scene.add.ellipse(0, 8, FIRE_RADIUS * 1.05, 5, 0xd4a373).setStrokeStyle(1, 0x8b5e34);
    const ropeBand2 = scene.add.ellipse(0, -6, FIRE_RADIUS * 0.72, 4, 0xd4a373).setStrokeStyle(1, 0x8b5e34);
    const ropeBand3 = scene.add.ellipse(0, -22, FIRE_RADIUS * 0.42, 3.5, 0xd4a373).setStrokeStyle(1, 0x8b5e34);
    this.woodGroup.add([ropeBand1, ropeBand2, ropeBand3]);

    // Adey Abeba (yellow Meskel daisy) bouquet & cross at the very top of Demera
    const flowerCenter = scene.add.circle(0, -FIRE_RADIUS * 1.45, 4, 0xff6f00);
    const petal1 = scene.add.circle(-4, -FIRE_RADIUS * 1.45, 3, 0xffeb3b);
    const petal2 = scene.add.circle(4, -FIRE_RADIUS * 1.45, 3, 0xffeb3b);
    const petal3 = scene.add.circle(0, -FIRE_RADIUS * 1.45 - 4, 3, 0xffeb3b);
    const petal4 = scene.add.circle(0, -FIRE_RADIUS * 1.45 + 4, 3, 0xffeb3b);
    const crossVert = scene.add.rectangle(0, -FIRE_RADIUS * 1.55, 3, 14, 0xffd54f);
    const crossHorz = scene.add.rectangle(0, -FIRE_RADIUS * 1.58, 10, 3, 0xffd54f);
    this.topOrnament = scene.add.container(0, 0, [crossVert, crossHorz, petal1, petal2, petal3, petal4, flowerCenter]);
    this.woodGroup.add(this.topOrnament);

    // ── 3. Layered Organic Flames ─────────────────────────────
    this.flamesGroup = scene.add.container(0, 0);

    // Outer deep red/orange flame tongues
    this.flameOuterC = scene.add.ellipse(0, -4, FIRE_RADIUS * 1.15, FIRE_RADIUS * 1.7, 0xd50000, 0.88);
    this.flameOuterL = scene.add.ellipse(-10, 0, FIRE_RADIUS * 0.8, FIRE_RADIUS * 1.35, 0xff3d00, 0.82);
    this.flameOuterR = scene.add.ellipse(10, 0, FIRE_RADIUS * 0.8, FIRE_RADIUS * 1.35, 0xff3d00, 0.82);

    // Mid vibrant orange/amber flames
    this.flameMidC = scene.add.ellipse(0, -8, FIRE_RADIUS * 0.82, FIRE_RADIUS * 1.35, 0xff6d00, 0.92);
    this.flameMidL = scene.add.ellipse(-7, -4, FIRE_RADIUS * 0.58, FIRE_RADIUS * 1.05, 0xff9100, 0.88);
    this.flameMidR = scene.add.ellipse(7, -4, FIRE_RADIUS * 0.58, FIRE_RADIUS * 1.05, 0xff9100, 0.88);

    // Hot bright golden/yellow inner core
    this.flameCore = scene.add.ellipse(0, -12, FIRE_RADIUS * 0.52, FIRE_RADIUS * 0.95, 0xffd600, 0.95);
    // Incandescent white-hot center spark
    this.flameHotTip = scene.add.arc(0, -14, FIRE_RADIUS * 0.26, 0, 360, false, 0xffffff, 0.92);

    this.flamesGroup.add([
      this.flameOuterL, this.flameOuterR, this.flameOuterC,
      this.flameMidL, this.flameMidR, this.flameMidC,
      this.flameCore, this.flameHotTip,
    ]);

    // ── 4. Rising Embers & Smoke Groups ───────────────────────
    this.smokeGroup = scene.add.container(0, 0);
    this.embersGroup = scene.add.container(0, 0);

    // Assemble container hierarchy
    this.container = scene.add.container(x, y, [
      this.glowOuter,
      this.glowInner,
      this.woodGroup,
      this.smokeGroup,
      this.flamesGroup,
      this.embersGroup,
    ]);
    this.container.setDepth(8);
    this.container.setScale(FIRE_MIN_SCALE);

    // ── 5. Stylized Floating Prompt ───────────────────────────
    const promptBg = scene.add.graphics();
    promptBg.fillStyle(0x1a0f05, 0.9);
    promptBg.fillRoundedRect(-58, -14, 116, 28, 8);
    promptBg.lineStyle(1.5, 0xffb300, 0.9);
    promptBg.strokeRoundedRect(-58, -14, 116, 28, 8);

    const promptTxt = scene.add.text(0, 0, "🔥 Add Wood", {
      fontSize: "12px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#ffee58",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.promptContainer = scene.add.container(0, 0, [promptBg, promptTxt]);
    this.promptContainer.setVisible(false).setDepth(25).setScrollFactor(0);

    // Start all procedural organic animations
    this.startFlicker();
    this.startSparks();
  }

  /** Grow fire based on number of woods delivered */
  growFromWood(woodDelivered: number, requiredWood: number): void {
    if (this.isExtinguished) return;
    const ratio = Phaser.Math.Clamp(woodDelivered / requiredWood, 0, 1);
    this.baseScale = FIRE_MIN_SCALE + (FIRE_MAX_SCALE - FIRE_MIN_SCALE) * ratio;

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      scale: this.baseScale,
      duration: 450,
      ease: "Back.easeOut",
    });

    // Intensify glow as fire grows
    this.glowOuter.setAlpha(0.12 + ratio * 0.16);
    this.glowInner.setAlpha(0.22 + ratio * 0.22);
  }

  update(playerX: number, playerY: number, carryingWood: boolean): boolean {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const inRange = dist <= FIRE_DELIVER_RADIUS && carryingWood;

    if (inRange !== this.promptVisible) {
      this.promptVisible = inRange;
      this.promptContainer.setVisible(inRange);
    }
    if (inRange) {
      const cam = this.scene.cameras.main;
      this.promptContainer.setPosition(
        this.x - cam.scrollX,
        this.y - cam.scrollY - FIRE_RADIUS * this.baseScale - 24,
      );
    }
    return inRange;
  }

  /** Burst of flame and sparks when wood is added */
  onWoodAdded(): void {
    // Flare up outer, mid and core flames
    this.scene.tweens.add({
      targets: [this.flameOuterC, this.flameOuterL, this.flameOuterR],
      scaleX: 1.45,
      scaleY: 1.55,
      duration: 160,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    this.scene.tweens.add({
      targets: [this.flameMidC, this.flameCore, this.flameHotTip],
      scaleX: 1.6,
      scaleY: 1.7,
      duration: 140,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    // Radiant burst
    this.scene.tweens.add({
      targets: [this.glowOuter, this.glowInner],
      scale: 1.4,
      alpha: 0.6,
      duration: 180,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    // Spawn burst of celebratory embers
    for (let i = 0; i < 12; i++) {
      this.spawnSingleEmber(true);
    }
  }

  extinguish(): void {
    if (this.isExtinguished) return;
    this.isExtinguished = true;

    // Stop ember generation
    this.emberTimer?.destroy();

    // Kill all active flame tweens
    this.scene.tweens.killTweensOf(this.flameOuterC);
    this.scene.tweens.killTweensOf(this.flameOuterL);
    this.scene.tweens.killTweensOf(this.flameOuterR);
    this.scene.tweens.killTweensOf(this.flameMidC);
    this.scene.tweens.killTweensOf(this.flameMidL);
    this.scene.tweens.killTweensOf(this.flameMidR);
    this.scene.tweens.killTweensOf(this.flameCore);
    this.scene.tweens.killTweensOf(this.flameHotTip);
    this.scene.tweens.killTweensOf(this.glowOuter);
    this.scene.tweens.killTweensOf(this.glowInner);

    // Turn flames into charred smoking ash colors
    this.flameOuterC.setFillStyle(0x424242, 0.7);
    this.flameOuterL.setFillStyle(0x303030, 0.6);
    this.flameOuterR.setFillStyle(0x303030, 0.6);
    this.flameMidC.setFillStyle(0x212121, 0.7);
    this.flameMidL.setFillStyle(0x212121, 0.6);
    this.flameMidR.setFillStyle(0x212121, 0.6);
    this.flameCore.setFillStyle(0x1a1a1a, 0.5);
    this.flameHotTip.setFillStyle(0x111111, 0.3);
    this.glowOuter.setFillStyle(0x212121, 0.05);
    this.glowInner.setFillStyle(0x333333, 0.05);

    // Shrink and fade
    this.scene.tweens.add({
      targets: this.container,
      scale: FIRE_MIN_SCALE * 0.35,
      alpha: 0.45,
      duration: 1000,
      ease: "Power2",
    });
  }

  destroy(): void {
    this.emberTimer?.destroy();
    this.container.destroy();
    this.promptContainer.destroy();
  }

  private startFlicker(): void {
    // 1. Center outer flame oscillation
    this.scene.tweens.add({
      targets: this.flameOuterC,
      scaleX: { from: 1, to: 0.86 },
      scaleY: { from: 1, to: 1.14 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 2. Left and right flame tongues (staggered dancing motion)
    this.scene.tweens.add({
      targets: this.flameOuterL,
      scaleX: { from: 1, to: 0.8 },
      scaleY: { from: 1, to: 1.2 },
      angle: { from: -8, to: 4 },
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.flameOuterR,
      scaleX: { from: 1, to: 0.8 },
      scaleY: { from: 1, to: 1.2 },
      angle: { from: 8, to: -4 },
      duration: 240,
      yoyo: true,
      repeat: -1,
      delay: 50,
      ease: "Sine.easeInOut",
    });

    // 3. Mid flame core breathing
    this.scene.tweens.add({
      targets: this.flameMidC,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 0.88 },
      duration: 180,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 70,
    });

    // 4. White-hot center high-frequency flicker
    this.scene.tweens.add({
      targets: this.flameHotTip,
      scale: { from: 0.85, to: 1.25 },
      alpha: { from: 0.75, to: 1 },
      duration: 120,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 5. Ambient glow breathing
    this.scene.tweens.add({
      targets: this.glowOuter,
      alpha: { from: 0.10, to: 0.24 },
      scale: { from: 0.95, to: 1.08 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: this.glowInner,
      alpha: { from: 0.20, to: 0.36 },
      scale: { from: 0.98, to: 1.12 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 100,
    });
  }

  private startSparks(): void {
    // Regularly generate rising sparks / glowing embers
    this.emberTimer = this.scene.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        if (!this.isExtinguished) {
          this.spawnSingleEmber(false);
        }
      },
    });
  }

  private spawnSingleEmber(isBurst: boolean): void {
    const colors = [0xffd54f, 0xff9800, 0xff5722, 0xffeb3b];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Phaser.Math.FloatBetween(1.5, 3.2);

    const startX = Phaser.Math.Between(-14, 14);
    const startY = Phaser.Math.Between(-4, 10);
    const ember = this.scene.add.arc(startX, startY, size, 0, 360, false, color, 0.9);
    this.embersGroup.add(ember);

    const targetY = startY - (isBurst ? Phaser.Math.Between(50, 90) : Phaser.Math.Between(30, 65));
    const targetX = startX + Phaser.Math.Between(-18, 18);

    this.scene.tweens.add({
      targets: ember,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.3,
      duration: isBurst ? Phaser.Math.Between(450, 750) : Phaser.Math.Between(600, 950),
      ease: "Cubic.easeOut",
      onComplete: () => {
        ember.destroy();
      },
    });
  }
}