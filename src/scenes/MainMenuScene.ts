// ============================================================
// MainMenuScene.ts
// The game title screen — Ethiopian Meskel Celebration Theme.
// ============================================================

import Phaser from "phaser";
import { TelegramService } from "../services/TelegramService";

export class MainMenuScene extends Phaser.Scene {
  private emberTimer?: Phaser.Time.TimerEvent;

  constructor() { super({ key: "MainMenuScene" }); }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ── 1. Atmospheric Dusk Sky & Forest Background ──────────
    const bg = this.add.graphics();
    // Dusk twilight gradient into warm fire-lit earth
    bg.fillGradientStyle(0x0c2410, 0x0c2410, 0x1b4d22, 0x243e18, 1);
    bg.fillRect(0, 0, W, H);

    // Warm ground silhouette
    const ground = this.add.graphics();
    ground.fillStyle(0x132a13, 1);
    ground.fillEllipse(cx, H + 40, W * 1.3, 160);

    // ── 2. Decorative Forest Silhouette (Background & Foreground Trees) ──
    // Distant background trees (darker/foggy)
    this.drawDecorTree(90, H * 0.44, 32, true);
    this.drawDecorTree(W - 85, H * 0.46, 30, true);
    this.drawDecorTree(cx - 240, H * 0.48, 26, true);
    this.drawDecorTree(cx + 250, H * 0.50, 28, true);

    // Foreground lush trees
    this.drawDecorTree(55, H * 0.70, 42, false);
    this.drawDecorTree(W - 60, H * 0.72, 38, false);
    this.drawDecorTree(145, H * 0.85, 34, false);
    this.drawDecorTree(W - 145, H * 0.86, 35, false);

    // ── 3. Ethiopian Traditional Motif (Tibeb Pattern Top Border) ────
    this.drawTibebBorder(W);

    // ── 4. Central Glowing ደመራ Bonfire ───────────────────────
    const fireY = H * 0.22;

    // Soft warm ambient pulse
    const ambientGlow = this.add.arc(cx, fireY, 95, 0, 360, false, 0xff5722, 0.16);
    const innerGlow = this.add.arc(cx, fireY - 4, 60, 0, 360, false, 0xff9800, 0.25);
    this.tweens.add({
      targets: [ambientGlow, innerGlow],
      scale: { from: 0.94, to: 1.08 },
      alpha: { from: 0.15, to: 0.32 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Conical wood poles behind flames
    const poleGroup = this.add.container(cx, fireY + 12);
    [-24, -14, -5, 5, 14, 24].forEach((angle) => {
      const p = this.add.rectangle(0, 0, 4.5, 42, 0x5d3a1a);
      p.setOrigin(0.5, 1).setAngle(angle).setStrokeStyle(1, 0x2e1804);
      poleGroup.add(p);
    });

    // Layered animated flame tongues
    const flameOuter = this.add.ellipse(cx, fireY - 2, 38, 52, 0xd50000, 0.85);
    const flameMid = this.add.ellipse(cx, fireY - 6, 26, 40, 0xff6d00, 0.90);
    const flameCore = this.add.ellipse(cx, fireY - 10, 15, 26, 0xffd600, 0.95);
    const flameSpark = this.add.circle(cx, fireY - 12, 5, 0xffffff, 0.95);

    this.tweens.add({
      targets: flameOuter,
      scaleX: { from: 1, to: 0.85 }, scaleY: { from: 1, to: 1.15 },
      duration: 250, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: flameMid,
      scaleX: { from: 1, to: 1.15 }, scaleY: { from: 1, to: 0.88 },
      duration: 210, yoyo: true, repeat: -1, delay: 50, ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: flameCore,
      scale: { from: 0.9, to: 1.15 },
      duration: 170, yoyo: true, repeat: -1, delay: 90, ease: "Sine.easeInOut"
    });

    // Continuous rising embers across the menu
    this.startAmbientEmbers(cx, fireY);

    // ── 5. Main Title: ደመራ ──────────────────────────────────
    const titleText = this.add.text(cx, H * 0.355, "ደመራ", {
      fontSize: "66px",
      fontFamily: '"Noto Sans Ethiopic", "Fredoka One", Nunito, sans-serif',
      color: "#ffee58",
      stroke: "#4a1c00",
      strokeThickness: 7,
      shadow: { offsetX: 0, offsetY: 4, color: "#1a0800", blur: 12, fill: true },
    }).setOrigin(0.5);

    // Subtle golden title breathing animation
    this.tweens.add({
      targets: titleText,
      scale: { from: 1, to: 1.025 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── 6. Tagline & Meskel Floral Accents ────────────────────
    const tagGroup = this.add.container(cx, H * 0.465);
    const tagText = this.add.text(0, 0, "—  KEEP THE FIRE BURNING  —", {
      fontSize: "15px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#c8e6c9",
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Adey Abeba flower icons flanking subtitle
    const flowerL = this.add.text(-135, -1, "🌼", { fontSize: "14px" }).setOrigin(0.5);
    const flowerR = this.add.text(135, -1, "🌼", { fontSize: "14px" }).setOrigin(0.5);
    tagGroup.add([tagText, flowerL, flowerR]);

// ── 7. Action Buttons ────────────────────────────────────
    // PLAY button (Vibrant Warm Amber/Orange with gold highlight)
    this.makeButton(cx, H * 0.61, "▶  PLAY", 0xe65100, 0xbf360c, 0xffd54f, () => {
      // Trigger Telegram fullscreen on user gesture if available
      TelegramService.getInstance().requestFullscreen();
      this.emberTimer?.destroy();
      this.scene.start("LevelSelectScene");
    });

    // HOW TO PLAY button (Forest Emerald with silver/green border)
    this.makeButton(cx, H * 0.74, "📖  HOW TO PLAY", 0x1b5e20, 0x0d3c13, 0xa5d6a7, () => {
      this.emberTimer?.destroy();
      this.scene.start("HowToPlayScene");
    });

    // ── 8. Footer Info ───────────────────────────────────────
    this.add.text(cx, H - 18, "እንኳን ለብርሃነ መስቀሉ በሰላም አደረሳችሁ!  •  Meskel Celebration Game", {
      fontSize: "12px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#81c784",
    }).setOrigin(0.5, 1);

    // Responsive resize handler for orientation change
    let lastW = W;
    let lastH = H;
    const onResize = () => {
      const curW = this.scale.width;
      const curH = this.scale.height;
      if (curW !== lastW || curH !== lastH) {
        lastW = curW;
        lastH = curH;
        this.emberTimer?.destroy();
        this.scene.restart();
      }
    };
    this.scale.on("resize", onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", onResize);
      this.emberTimer?.destroy();
    });
  }

  /** Traditional Ethiopian Tibeb geometric pattern top border */
  private drawTibebBorder(W: number): void {
    const bar = this.add.graphics();
    const colors = [0x2e7d32, 0xfbc02d, 0xc62828]; // Green, Gold, Red
    const segW = 16;
    const numSegs = Math.ceil(W / segW);

    for (let i = 0; i < numSegs; i++) {
      const c = colors[i % colors.length];
      bar.fillStyle(c, 0.85);
      bar.fillRect(i * segW, 0, segW, 5);
      // Small inverted diamond pattern
      bar.fillTriangle(
        i * segW, 5,
        i * segW + segW / 2, 9,
        i * segW + segW, 5
      );
    }
  }

  /** Polished Button with gradient, highlight rim, and scale feedback */
  private makeButton(
    x: number, y: number,
    label: string,
    colorTop: number, colorBot: number,
    borderColor: number,
    cb: () => void
  ): void {
    const btnW = 250, btnH = 58;

    const gfx = this.add.graphics();
    // Shadow
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2 + 4, btnW, btnH, 16);

    // Gradient body
    gfx.fillGradientStyle(colorTop, colorTop, colorBot, colorBot, 1);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);

    // Glowing border rim
    gfx.lineStyle(2, borderColor, 0.9);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);

    // Specular top highlight
    gfx.fillStyle(0xffffff, 0.18);
    gfx.fillRoundedRect(-btnW / 2 + 4, -btnH / 2 + 3, btnW - 8, btnH * 0.4, 12);

    const txt = this.add.text(0, 0, label, {
      fontSize: "22px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
      stroke: "#00000055",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [gfx, txt]);
    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });

    // Smooth hover & click feedback
    container.on("pointerover", () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 90, ease: "Power2" });
    });
    container.on("pointerout", () => {
      this.tweens.add({ targets: container, scale: 1.00, duration: 90, ease: "Power2" });
    });
    container.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.95, duration: 60, ease: "Power2" });
    });
    container.on("pointerup", () => {
      if (this.cache.audio.has("ui_click")) {
        this.sound.play("ui_click", { volume: 0.75 });
      }
      cb();
    });
  }

  /** Atmospheric ambient embers floating upward */
  private startAmbientEmbers(cx: number, fireY: number): void {
    this.emberTimer = this.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        const ember = this.add.circle(
          cx + Phaser.Math.Between(-30, 30),
          fireY + Phaser.Math.Between(-10, 10),
          Phaser.Math.FloatBetween(1.2, 3.2),
          Phaser.Utils.Array.GetRandom([0xffeb3b, 0xff9800, 0xff5722]),
          0.85
        );

        this.tweens.add({
          targets: ember,
          x: ember.x + Phaser.Math.Between(-40, 40),
          y: ember.y - Phaser.Math.Between(70, 160),
          alpha: 0,
          scale: 0.2,
          duration: Phaser.Math.Between(1000, 1700),
          ease: "Sine.easeOut",
          onComplete: () => ember.destroy(),
        });
      },
    });
  }

  private drawDecorTree(x: number, y: number, r: number, isDistant: boolean): void {
    const trunkColor = isDistant ? 0x2d1a0c : 0x4e3014;
    const c1 = isDistant ? 0x143516 : 0x1b5e20;
    const c2 = isDistant ? 0x1a401c : 0x2e7d32;
    const c3 = isDistant ? 0x224d25 : 0x388e3c;

    this.add.rectangle(x, y + r * 0.7, r * 0.3, r * 0.9, trunkColor);
    this.add.arc(x, y + 4, r, 0, 360, false, c1);
    this.add.arc(x, y - 2, r * 0.72, 0, 360, false, c2);
    this.add.arc(x, y - r * 0.25, r * 0.48, 0, 360, false, c3);
  }
}