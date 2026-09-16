// ============================================================
// HowToPlayScene.ts — improved font sizes, ዳmeラ terminology
// ============================================================

import Phaser from "phaser";

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: "HowToPlayScene" }); }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    this.add.text(cx, 26, "HOW TO PLAY", {
      fontSize: "32px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffee58",
      stroke: "#5d2a00",
      strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // Visual flow row
    const iconY = H * 0.22;
    const sp    = W / 4;

    this.drawMiniTree(sp * 0.6, iconY, 20);
    this.add.text(sp * 0.6, iconY + 30, "\uD83C\uDF32 Forest", {
      fontSize: "14px", fontFamily: "Nunito, sans-serif", color: "#a5d6a7"
    }).setOrigin(0.5);

    this.add.text(sp * 1.2, iconY - 2, "\u2192", {
      fontSize: "26px", fontFamily: "Nunito, sans-serif", color: "#ffee58"
    }).setOrigin(0.5);

    this.drawMiniWood(sp * 1.8, iconY);
    this.add.text(sp * 1.8, iconY + 30, "\uD83E\uDE93 Wood", {
      fontSize: "14px", fontFamily: "Nunito, sans-serif", color: "#a5d6a7"
    }).setOrigin(0.5);

    this.add.text(sp * 2.4, iconY - 2, "\u2192", {
      fontSize: "26px", fontFamily: "Nunito, sans-serif", color: "#ffee58"
    }).setOrigin(0.5);

    this.drawMiniFire(sp * 3.0, iconY);
    this.add.text(sp * 3.0, iconY + 30, "\uD83D\uDD25 \u12f3\u1218\u122b", {
      fontSize: "14px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#a5d6a7",
    }).setOrigin(0.5);

    // Player icon
    this.drawMiniPlayer(cx, iconY + 75);
    this.add.text(cx, iconY + 100, "\uD83D\uDC68\u200D\uD83C\uDF3E You!", {
      fontSize: "14px", fontFamily: "Nunito, sans-serif", color: "#ffe082"
    }).setOrigin(0.5);

    // Steps
    const steps = [
      "1.  Move your farmer around the forest.",
      "2.  Find and collect wood bundles.",
      "3.  Carry the wood back to the \u12f3\u1218\u122b.",
      "4.  Add wood to the fire (+3 seconds each!).",
      "5.  Complete the objective before time runs out!",
    ];

    const startY = H * 0.52;
    steps.forEach((step, i) => {
      this.add.text(cx, startY + i * 34, step, {
        fontSize: "16px",
        fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
        color: "#e8f5e9",
        wordWrap: { width: W - 48 },
      }).setOrigin(0.5, 0);
    });

    // Mud warning box
    const mudY = startY + steps.length * 34 + 14;
    const mudBg = this.add.graphics();
    mudBg.fillStyle(0x7b5c2e, 0.65);
    mudBg.fillRoundedRect(20, mudY, W - 40, 62, 10);

    this.add.text(cx, mudY + 10, "\u26A0 Mud slows you down.", {
      fontSize: "17px",
      fontFamily: "Nunito, sans-serif",
      color: "#ffe082",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    this.add.text(cx, mudY + 34, "Try to avoid it when you are in a hurry.", {
      fontSize: "14px",
      fontFamily: "Nunito, sans-serif",
      color: "#d7ccc8",
    }).setOrigin(0.5, 0);

    // BACK button
    const btnY = H - 56;
    this.makeBackButton(cx, btnY);
  }

  private makeBackButton(x: number, y: number): void {
    const btnW = 200, btnH = 50;

    const gfx = this.add.graphics();
    gfx.fillStyle(0x424242);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

    const txt = this.add.text(0, 0, "\u2190 BACK", {
      fontSize: "20px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [gfx, txt]);
    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });

    container.on("pointerover", () => {
      this.tweens.add({ targets: container, scale: 1.06, duration: 80, ease: "Power1" });
    });
    container.on("pointerout", () => {
      this.tweens.add({ targets: container, scale: 1.00, duration: 80, ease: "Power1" });
    });
    container.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 60, ease: "Power1" });
    });
    container.on("pointerup", () => this.scene.start("MainMenuScene"));
  }

  private drawMiniTree(x: number, y: number, r: number): void {
    this.add.rectangle(x, y + r * 0.7, 6, r, 0x5d3a1a);
    this.add.arc(x, y, r, 0, 360, false, 0x2e7d32);
    this.add.arc(x, y - r * 0.2, r * 0.6, 0, 360, false, 0x43a047);
  }

  private drawMiniWood(x: number, y: number): void {
    this.add.rectangle(x, y - 5, 28, 7, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
    this.add.rectangle(x, y + 3, 24, 7, 0x7a4e2d).setStrokeStyle(1, 0x5a3010);
    this.add.rectangle(x, y + 11, 28, 7, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
  }

  private drawMiniFire(x: number, y: number): void {
    this.add.arc(x, y,      16, 0, 360, false, 0xff4500);
    this.add.arc(x, y - 4,  10, 0, 360, false, 0xff8c00);
    this.add.arc(x, y - 8,   6, 0, 360, false, 0xffee00);
  }

  private drawMiniPlayer(x: number, y: number): void {
    this.add.arc(x, y - 14, 8, 0, 360, false, 0xf4a261);
    this.add.rectangle(x, y, 12, 18, 0x2196f3);
  }
}