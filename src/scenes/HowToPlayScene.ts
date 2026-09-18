// ============================================================
// HowToPlayScene.ts — includes keyboard controls table
// ============================================================

import Phaser from "phaser";

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: "HowToPlayScene" }); }

  create(): void {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    this.add.text(cx, 18, "HOW TO PLAY", {
      fontSize: "28px", fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffee58", stroke: "#5d2a00", strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // ── Flow icons row ──────────────────────────────────────
    const iconY = H * 0.19;
    const sp    = W / 4;
    this.drawMiniTree(sp * 0.6, iconY, 18);
    this.add.text(sp * 0.6, iconY + 26, "\uD83C\uDF32 Forest",     { fontSize: "12px", fontFamily: "Nunito,sans-serif", color: "#a5d6a7" }).setOrigin(0.5);
    this.add.text(sp * 1.2,  iconY - 2, "\u2192",                 { fontSize: "22px", fontFamily: "Nunito,sans-serif", color: "#ffee58" }).setOrigin(0.5);
    this.drawMiniWood(sp * 1.8, iconY);
    this.add.text(sp * 1.8, iconY + 26, "\uD83E\uDE93 Wood",       { fontSize: "12px", fontFamily: "Nunito,sans-serif", color: "#a5d6a7" }).setOrigin(0.5);
    this.add.text(sp * 2.4,  iconY - 2, "\u2192",                 { fontSize: "22px", fontFamily: "Nunito,sans-serif", color: "#ffee58" }).setOrigin(0.5);
    this.drawMiniFire(sp * 3.0, iconY);
    this.add.text(sp * 3.0, iconY + 26, "\uD83D\uDD25 \u12f3\u1218\u122b", {
      fontSize: "12px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif', color: "#a5d6a7",
    }).setOrigin(0.5);

    // ── Game steps ──────────────────────────────────────────
    const steps = [
      "1. Move your farmer around the forest.",
      "2. Find and collect wood bundles.",
      "3. Carry the wood back to the \u12f3\u1218\u122b (fire).",
      "4. Add wood to keep the fire alive (+3 sec each!).",
      "5. Complete the objective before time runs out!",
    ];

    let y = H * 0.37;
    steps.forEach(step => {
      this.add.text(cx, y, step, {
        fontSize: "14px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif',
        color: "#e8f5e9", wordWrap: { width: W - 40 },
      }).setOrigin(0.5, 0);
      y += 28;
    });

    // ── Controls table (40% width, centered) ────────────────
    y += 10;
    const tableW    = W * 0.40;
    const tableX    = 16; // left-aligned with a small margin
    const rowH      = 30;
    const col1W     = tableW * 0.42;

    // Section header
    const hdrBg = this.add.graphics();
    hdrBg.fillStyle(0x1a6b1a, 0.9);
    hdrBg.fillRoundedRect(tableX, y, tableW, 28, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.add.text(cx, y + 14, "\uD83C\uDFAE  CONTROLS", {
      fontSize: "15px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffee58",
    }).setOrigin(0.5);
    y += 28;

    // Table rows: [key/control,  action]
    const rows: [string, string][] = [
      ["W / \u2191",           "Move Up"],
      ["S / \u2193",           "Move Down"],
      ["A / \u2190",           "Move Left"],
      ["D / \u2192",           "Move Right"],
      ["Space / Enter",        "Pick up wood / Deliver to fire"],
      ["Joystick (mobile)",    "Move player"],
      ["PICK button (mobile)", "Pick up wood or deliver to fire"],
    ];

    const rowBg  = this.add.graphics();
    rows.forEach(([key, action], i) => {
      const ry    = y + i * rowH;
      const isOdd = i % 2 === 1;

      // Row background
      rowBg.fillStyle(isOdd ? 0x1e4620 : 0x256427, 0.85);
      const isLast = i === rows.length - 1;
      rowBg.fillRoundedRect(tableX, ry, tableW, rowH, {
        tl: 0, tr: 0,
        bl: isLast ? 10 : 0, br: isLast ? 10 : 0,
      });

      // Key cell (left, highlighted)
      rowBg.fillStyle(0x0a3d0c, 0.6);
      rowBg.fillRect(tableX, ry, col1W, rowH);

      // Key text
      this.add.text(tableX + col1W / 2, ry + rowH / 2, key, {
        fontSize: "13px", fontFamily: "Fredoka One, Nunito, sans-serif",
        color: "#ffee58",
      }).setOrigin(0.5);

      // Action text
      this.add.text(tableX + col1W + (tableW - col1W) / 2, ry + rowH / 2, action, {
        fontSize: "13px", fontFamily: "Nunito, sans-serif",
        color: "#e8f5e9",
      }).setOrigin(0.5);
    });

    y += rows.length * rowH + 10;

    // ── Mud warning ─────────────────────────────────────────
    const mudBg = this.add.graphics();
    mudBg.fillStyle(0x7b5c2e, 0.65);
    mudBg.fillRoundedRect(tableX, y, tableW, 48, 10);
    this.add.text(tableX + 8, y + 8, "\u26A0  Mud slows you down \u2014 avoid it when in a hurry!", {
      fontSize: "13px", fontFamily: "Nunito, sans-serif",
      color: "#ffe082", fontStyle: "bold", wordWrap: { width: tableW - 16 },
    }).setOrigin(0, 0);

    // ── Back button ─────────────────────────────────────────
    this.makeBackButton(cx, H - 42);
  }

  // ── UI helpers ──────────────────────────────────────────

  private makeBackButton(x: number, y: number): void {
    const btnW = 180, btnH = 44;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x424242);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
    const txt = this.add.text(0, 0, "\u2190 BACK", {
      fontSize: "18px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffffff",
    }).setOrigin(0.5);
    const c = this.add.container(x, y, [gfx, txt]);
    c.setSize(btnW, btnH).setInteractive({ useHandCursor: true });
    c.on("pointerover",  () => this.tweens.add({ targets: c, scale: 1.06, duration: 80 }));
    c.on("pointerout",   () => this.tweens.add({ targets: c, scale: 1.00, duration: 80 }));
    c.on("pointerdown",  () => this.tweens.add({ targets: c, scale: 0.96, duration: 60 }));
    c.on("pointerup",    () => this.scene.start("MainMenuScene"));
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
    this.add.arc(x, y,     16, 0, 360, false, 0xff4500);
    this.add.arc(x, y - 4, 10, 0, 360, false, 0xff8c00);
    this.add.arc(x, y - 8,  6, 0, 360, false, 0xffee00);
  }
}