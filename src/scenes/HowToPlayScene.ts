// ============================================================
// HowToPlayScene.ts — 2-column landscape layout (960×540)
//   Left  (0-470):  flow icons + game steps
//   Right (490-960): controls table + mud warning
// ============================================================

import Phaser from "phaser";

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: "HowToPlayScene" }); }

  create(): void {
    const W  = this.scale.width;   // 960
    const H  = this.scale.height;  // 540
    const cx = W / 2;
    const COL = W / 2; // column split x

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // Vertical divider
    const div = this.add.graphics();
    div.lineStyle(1, 0xffffff, 0.12);
    div.lineBetween(COL, 20, COL, H - 60);

    // Title spanning full width
    this.add.text(cx, 14, "HOW TO PLAY", {
      fontSize: "26px", fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffee58", stroke: "#5d2a00", strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // ── LEFT COLUMN: flow icons + steps ────────────────────
    const lcx = COL / 2; // left column center x

    // Flow icons row
    const iconY = 82;
    const sp    = COL / 4;
    this.drawMiniTree(sp * 0.5 + 8,  iconY, 16);
    this.add.text(sp * 0.5 + 8, iconY + 22, "\uD83C\uDF32 Forest", { fontSize: "11px", fontFamily: "Nunito,sans-serif", color: "#a5d6a7" }).setOrigin(0.5);
    this.add.text(sp * 1.2, iconY - 2, "\u2192", { fontSize: "20px", fontFamily: "Nunito,sans-serif", color: "#ffee58" }).setOrigin(0.5);
    this.drawMiniWood(sp * 1.9, iconY);
    this.add.text(sp * 1.9, iconY + 22, "\uD83E\uDE93 Wood", { fontSize: "11px", fontFamily: "Nunito,sans-serif", color: "#a5d6a7" }).setOrigin(0.5);
    this.add.text(sp * 2.6, iconY - 2, "\u2192", { fontSize: "20px", fontFamily: "Nunito,sans-serif", color: "#ffee58" }).setOrigin(0.5);
    this.drawMiniFire(sp * 3.3, iconY);
    this.add.text(sp * 3.3, iconY + 22, "\uD83D\uDD25 \u12f3\u1218\u122b", { fontSize: "11px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif', color: "#a5d6a7" }).setOrigin(0.5);

    // Game steps
    const steps = [
      "1. Move your farmer around the forest.",
      "2. Find and collect wood bundles.",
      "3. Carry the wood back to the \u12f3\u1218\u122b.",
      "4. Add wood to keep the fire alive (+3 sec!).",
      "5. Complete the goal before time runs out!",
    ];
    let sy = 126;
    steps.forEach(step => {
      this.add.text(12, sy, step, {
        fontSize: "13px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif',
        color: "#e8f5e9", wordWrap: { width: COL - 24 },
      }).setOrigin(0, 0);
      sy += 28;
    });

    // Mud warning (left column bottom)
    const mudBgL = this.add.graphics();
    mudBgL.fillStyle(0x7b5c2e, 0.65);
    mudBgL.fillRoundedRect(12, sy + 8, COL - 24, 44, 8);
    this.add.text(20, sy + 16, "\u26A0  Mud slows you down — avoid it when in a hurry!", {
      fontSize: "12px", fontFamily: "Nunito, sans-serif",
      color: "#ffe082", fontStyle: "bold", wordWrap: { width: COL - 40 },
    }).setOrigin(0, 0);

    // ── RIGHT COLUMN: controls table ───────────────────────
    const tableX = COL + 16;
    const tableW = W - tableX - 16;
    const rowH   = 32;
    const col1W  = tableW * 0.44;

    // Section header
    const hdrBg = this.add.graphics();
    hdrBg.fillStyle(0x1a6b1a, 0.9);
    hdrBg.fillRoundedRect(tableX, 56, tableW, 28, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.add.text(tableX + tableW / 2, 70, "\uD83C\uDFAE  CONTROLS", {
      fontSize: "14px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffee58",
    }).setOrigin(0.5);

    const rows: [string, string][] = [
      ["W / \u2191",            "Move Up"],
      ["S / \u2193",            "Move Down"],
      ["A / \u2190",            "Move Left"],
      ["D / \u2192",            "Move Right"],
      ["Space / Enter",         "Pick up / Deliver wood"],
      ["Joystick (mobile)",     "Move player"],
      ["PICK / DROP (mobile)",  "Pick up or deliver"],
    ];

    const rowBg = this.add.graphics();
    let ry = 84;
    rows.forEach(([key, action], i) => {
      const isOdd = i % 2 === 1;
      const isLast = i === rows.length - 1;
      rowBg.fillStyle(isOdd ? 0x1e4620 : 0x256427, 0.85);
      rowBg.fillRoundedRect(tableX, ry, tableW, rowH, { tl: 0, tr: 0, bl: isLast ? 10 : 0, br: isLast ? 10 : 0 });
      rowBg.fillStyle(0x0a3d0c, 0.6);
      rowBg.fillRect(tableX, ry, col1W, rowH);

      this.add.text(tableX + col1W / 2, ry + rowH / 2, key, {
        fontSize: "12px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffee58",
      }).setOrigin(0.5);

      this.add.text(tableX + col1W + (tableW - col1W) / 2, ry + rowH / 2, action, {
        fontSize: "12px", fontFamily: "Nunito, sans-serif", color: "#e8f5e9",
      }).setOrigin(0.5);

      ry += rowH;
    });

    // BACK button (centered bottom)
    this.makeBackButton(cx, H - 32);
  }

  private makeBackButton(x: number, y: number): void {
    const btnW = 180, btnH = 40;
    const gfx  = this.add.graphics();
    gfx.fillStyle(0x424242);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    const txt = this.add.text(0, 0, "\u2190 BACK", {
      fontSize: "17px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffffff",
    }).setOrigin(0.5);
    const c = this.add.container(x, y, [gfx, txt]);
    c.setSize(btnW, btnH).setInteractive({ useHandCursor: true });
    c.on("pointerover",  () => this.tweens.add({ targets: c, scale: 1.06, duration: 80 }));
    c.on("pointerout",   () => this.tweens.add({ targets: c, scale: 1.00, duration: 80 }));
    c.on("pointerdown",  () => this.tweens.add({ targets: c, scale: 0.96, duration: 60 }));
    c.on("pointerup",    () => this.scene.start("MainMenuScene"));
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
    this.add.arc(x, y,     14, 0, 360, false, 0xff4500);
    this.add.arc(x, y - 3,  9, 0, 360, false, 0xff8c00);
    this.add.arc(x, y - 6,  5, 0, 360, false, 0xffee00);
  }
}