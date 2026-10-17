// ============================================================
// HowToPlayScene.ts — 2-column landscape layout (960×540)
//   Left  (0-470):  flow icons + game steps + mud warning
//   Right (490-960): controls table with colored badges
// ============================================================

import Phaser from "phaser";
import { WOOD_TIME_BONUS } from "../config/GameConfig";

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: "HowToPlayScene" }); }

  create(): void {
    const W = this.scale.width;   // 960
    const H = this.scale.height;  // 540
    const cx = W / 2;
    const COL = W / 2; // column split x

    // ── 1. Background & Tibeb Border ─────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0c2410, 0x0c2410, 0x1b4d22, 0x243e18, 1);
    bg.fillRect(0, 0, W, H);

    this.drawTibebBorder(W);

    // Title
    this.add.text(cx, 16, "HOW TO PLAY", {
      fontSize: "26px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffee58",
      stroke: "#4a1c00",
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // ── 2. LEFT COLUMN CARD: Objective & Steps ───────────────
    const cardL = this.add.graphics();
    const lX = 20, lY = 60, lW = COL - 30, lH = H - 120;
    cardL.fillStyle(0x000000, 0.35);
    cardL.fillRoundedRect(lX, lY + 4, lW, lH, 14);
    cardL.fillStyle(0x1b3b1e, 0.88);
    cardL.fillRoundedRect(lX, lY, lW, lH, 14);
    cardL.lineStyle(1.5, 0x43a047, 0.7);
    cardL.strokeRoundedRect(lX, lY, lW, lH, 14);

    // Flow icons row
    const iconY = lY + 34;
    const sp = lW / 4;
    this.drawMiniTree(lX + sp * 0.6, iconY, 16);
    this.add.text(lX + sp * 0.6, iconY + 22, "🌲 Forest", { fontSize: "11px", fontFamily: "Nunito,sans-serif", color: "#c8e6c9", fontStyle: "bold" }).setOrigin(0.5);

    this.add.text(lX + sp * 1.35, iconY - 2, "➔", { fontSize: "18px", color: "#ffee58" }).setOrigin(0.5);

    this.drawMiniWood(lX + sp * 2.05, iconY);
    this.add.text(lX + sp * 2.05, iconY + 22, "🪵 Wood", { fontSize: "11px", fontFamily: "Nunito,sans-serif", color: "#c8e6c9", fontStyle: "bold" }).setOrigin(0.5);

    this.add.text(lX + sp * 2.75, iconY - 2, "➔", { fontSize: "18px", color: "#ffee58" }).setOrigin(0.5);

    this.drawMiniFire(lX + sp * 3.4, iconY);
    this.add.text(lX + sp * 3.4, iconY + 22, "🔥 ደመራ", { fontSize: "11px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif', color: "#ffee58", fontStyle: "bold" }).setOrigin(0.5);

    // Game steps
    const steps = [
      "1. Move your farmer around the forest.",
      "2. Find and collect wood bundles.",
      "3. Carry the wood back to the ደመራ.",
      `4. Add wood to keep the fire alive (+${WOOD_TIME_BONUS}s bonus!).`,
      "5. Complete the goal before time runs out!",
    ];
    let sy = lY + 84;
    steps.forEach(step => {
      this.add.text(lX + 16, sy, step, {
        fontSize: "13px",
        fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
        color: "#f1f8e9",
        wordWrap: { width: lW - 32 },
      }).setOrigin(0, 0);
      sy += 28;
    });

    // Mud warning banner
    const mudBg = this.add.graphics();
    mudBg.fillStyle(0x4e342e, 0.85);
    mudBg.fillRoundedRect(lX + 14, sy + 6, lW - 28, 44, 8);
    mudBg.lineStyle(1, 0xffb74d, 0.8);
    mudBg.strokeRoundedRect(lX + 14, sy + 6, lW - 28, 44, 8);

    this.add.text(lX + 24, sy + 14, "⚠️  Mud slows you down — avoid it when in a hurry!", {
      fontSize: "12px",
      fontFamily: "Nunito, sans-serif",
      color: "#ffe082",
      fontStyle: "bold",
      wordWrap: { width: lW - 48 },
    }).setOrigin(0, 0);

    // ── 3. RIGHT COLUMN: Controls Table ───────────────────────
    const rX = COL + 10, rY = 60, rW = W - rX - 20, rH = H - 120;
    const cardR = this.add.graphics();
    cardR.fillStyle(0x000000, 0.35);
    cardR.fillRoundedRect(rX, rY + 4, rW, rH, 14);
    cardR.fillStyle(0x17381b, 0.88);
    cardR.fillRoundedRect(rX, rY, rW, rH, 14);
    cardR.lineStyle(1.5, 0x43a047, 0.7);
    cardR.strokeRoundedRect(rX, rY, rW, rH, 14);

    // Controls Header Banner
    const hdrBg = this.add.graphics();
    hdrBg.fillStyle(0x2e7d32, 1);
    hdrBg.fillRoundedRect(rX, rY, rW, 32, { tl: 14, tr: 14, bl: 0, br: 0 });
    this.add.text(rX + rW / 2, rY + 16, "🎮  GAME CONTROLS", {
      fontSize: "14px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
      letterSpacing: 1,
    }).setOrigin(0.5);

    const rows: [string, string][] = [
      ["W / ↑", "Move Up"],
      ["S / ↓", "Move Down"],
      ["A / ←", "Move Left"],
      ["D / →", "Move Right"],
      ["Space / Enter", "Collect wood / Deliver to ደመራ"],
      ["Joystick (mobile)", "Move player continuously"],
      ["PICK button (mobile)", "Collect nearby wood"],
      ["DROP button (mobile)", "Deliver wood to ደመራ"],
    ];

    const rowH = 32;
    const col1W = rW * 0.44;
    let ry = rY + 34;

    rows.forEach(([key, action], i) => {
      const isOdd = i % 2 === 1;
      const isLast = i === rows.length - 1;

      const rowGfx = this.add.graphics();
      rowGfx.fillStyle(isOdd ? 0x112b14 : 0x183b1c, 0.9);
      rowGfx.fillRoundedRect(rX, ry, rW, rowH, { tl: 0, tr: 0, bl: isLast ? 14 : 0, br: isLast ? 14 : 0 });

      // Key column background badge
      rowGfx.fillStyle(0x000000, 0.3);
      rowGfx.fillRect(rX, ry, col1W, rowH);

      this.add.text(rX + col1W / 2, ry + rowH / 2, key, {
        fontSize: "12px",
        fontFamily: "Fredoka One, Nunito, sans-serif",
        color: "#ffee58",
      }).setOrigin(0.5);

      this.add.text(rX + col1W + (rW - col1W) / 2, ry + rowH / 2, action, {
        fontSize: "12px",
        fontFamily: "Nunito, sans-serif",
        color: "#e8f5e9",
      }).setOrigin(0.5);

      ry += rowH;
    });

    // ── 4. BACK Button ───────────────────────────────────────
    this.makeBackButton(cx, H - 30);
  }

  private drawTibebBorder(W: number): void {
    const bar = this.add.graphics();
    const colors = [0x2e7d32, 0xfbc02d, 0xc62828];
    const segW = 16;
    const numSegs = Math.ceil(W / segW);
    for (let i = 0; i < numSegs; i++) {
      bar.fillStyle(colors[i % colors.length], 0.85);
      bar.fillRect(i * segW, 0, segW, 4);
    }
  }

  private makeBackButton(x: number, y: number): void {
    const btnW = 180, btnH = 42;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2 + 2, btnW, btnH, 12);
    gfx.fillStyle(0x263238, 0.95);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
    gfx.lineStyle(1.5, 0x78909c, 0.8);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

    const txt = this.add.text(0, 0, "◀  BACK", {
      fontSize: "16px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#eceff1",
    }).setOrigin(0.5);

    const c = this.add.container(x, y, [gfx, txt]);
    c.setSize(btnW, btnH).setInteractive({ useHandCursor: true });
    c.on("pointerover", () => this.tweens.add({ targets: c, scale: 1.05, duration: 80 }));
    c.on("pointerout", () => this.tweens.add({ targets: c, scale: 1.00, duration: 80 }));
    c.on("pointerup", () => {
      if (this.cache.audio.has("ui_click")) {
        this.sound.play("ui_click", { volume: 0.75 });
      }
      this.scene.start("MainMenuScene");
    });
  }

  private drawMiniTree(x: number, y: number, r: number): void {
    this.add.rectangle(x, y + r * 0.7, 5, r, 0x5d3a1a);
    this.add.arc(x, y, r, 0, 360, false, 0x2e7d32);
    this.add.arc(x, y - r * 0.2, r * 0.6, 0, 360, false, 0x43a047);
  }
  private drawMiniWood(x: number, y: number): void {
    this.add.rectangle(x, y - 4, 24, 6, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
    this.add.rectangle(x, y + 2, 20, 6, 0x7a4e2d).setStrokeStyle(1, 0x5a3010);
    this.add.rectangle(x, y + 8, 24, 6, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
  }
  private drawMiniFire(x: number, y: number): void {
    this.add.arc(x, y, 14, 0, 360, false, 0xff4500);
    this.add.arc(x, y - 3, 9, 0, 360, false, 0xff8c00);
    this.add.arc(x, y - 6, 5, 0, 360, false, 0xffee00);
  }
}