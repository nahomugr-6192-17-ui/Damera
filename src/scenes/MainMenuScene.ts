// ============================================================
// MainMenuScene.ts
// The game title screen.
// ============================================================

import Phaser from "phaser";

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: "MainMenuScene" }); }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // -- Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // -- Decorative trees
    this.drawDecorTree(80,     H * 0.35, 38);
    this.drawDecorTree(W - 70, H * 0.38, 34);
    this.drawDecorTree(50,     H * 0.65, 30);
    this.drawDecorTree(W - 55, H * 0.68, 28);
    this.drawDecorTree(cx - 150, H * 0.78, 26);
    this.drawDecorTree(cx + 145, H * 0.80, 28);

    // -- Fire glow
    const glow = this.add.arc(cx, H * 0.22, 70, 0, 360, false, 0xff6600, 0.22);
    this.tweens.add({ targets: glow, alpha: { from: 0.22, to: 0.42 }, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // -- Fire icon
    const fireOuter = this.add.arc(cx, H * 0.22,      32, 0, 360, false, 0xff4500);
    const fireMid   = this.add.arc(cx, H * 0.22 - 5,  20, 0, 360, false, 0xff8c00);
    const fireCore  = this.add.arc(cx, H * 0.22 - 10, 10, 0, 360, false, 0xffee00);
    this.tweens.add({ targets: [fireOuter, fireMid, fireCore], scaleX: { from: 1, to: 0.9 }, scaleY: { from: 1, to: 0.85 }, duration: 300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // -- Main title: ዳmeラ
    this.add.text(cx, H * 0.34, "\u12f3\u1218\u122b", {
      fontSize: "52px",
      fontFamily: '"Noto Sans Ethiopic", "Fredoka One", Nunito, sans-serif',
      color: "#ffee58",
      stroke: "#5d2a00",
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 6, fill: true },
    }).setOrigin(0.5);

    // -- Tagline
    this.add.text(cx, H * 0.46, "Keep the Fire Burning", {
      fontSize: "18px",
      fontFamily: "Nunito, sans-serif",
      color: "#c8e6c9",
      fontStyle: "italic",
    }).setOrigin(0.5);

    // -- PLAY button
    this.makeButton(cx, H * 0.605, "PLAY", 0xe65100, 0xbf360c, () => {
      this.scene.start("LevelSelectScene");
    });

    // -- HOW TO PLAY button
    this.makeButton(cx, H * 0.73, "HOW TO PLAY", 0x1565c0, 0x0d47a1, () => {
      this.scene.start("HowToPlayScene");
    });

    // -- Version
    this.add.text(cx, H - 18, "Phase 1 Prototype \u2022 \u12f3\u1218\u122b", {
      fontSize: "11px", fontFamily: "Nunito, sans-serif", color: "#66bb6a",
    }).setOrigin(0.5, 1);
  }

  /** Button using a Container so scale-hover works from center */
  private makeButton(x: number, y: number, label: string, colorTop: number, colorBot: number, cb: () => void): void {
    const btnW = 240, btnH = 62;

    const gfx = this.add.graphics();
    gfx.fillGradientStyle(colorTop, colorTop, colorBot, colorBot, 1);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 16);

    const txt = this.add.text(0, 0, label, {
      fontSize: "24px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
      stroke: "#00000044",
      strokeThickness: 2,
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [gfx, txt]);
    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });

    // Scale-only hover — no position change
    container.on("pointerover", () => {
      this.tweens.add({ targets: container, scale: 1.06, duration: 80, ease: "Power1" });
    });
    container.on("pointerout", () => {
      this.tweens.add({ targets: container, scale: 1.00, duration: 80, ease: "Power1" });
    });
    container.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 60, ease: "Power1" });
    });
    container.on("pointerup", cb);
  }

  private drawDecorTree(x: number, y: number, r: number): void {
    this.add.rectangle(x, y + r * 0.6, r * 0.35, r * 0.8, 0x5d3a1a);
    this.add.arc(x, y, r,          0, 360, false, 0x2e7d32);
    this.add.arc(x, y, r * 0.7,   0, 360, false, 0x388e3c);
    this.add.arc(x, y - r * 0.2, r * 0.45, 0, 360, false, 0x43a047);
  }
}