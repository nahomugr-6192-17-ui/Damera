// ============================================================
// LevelSelectScene.ts — landscape 3-column card layout (960×540)
// ============================================================

import Phaser from "phaser";
import { LEVELS } from "../config/LevelConfig";
import type { DifficultyKey } from "../config/LevelConfig";

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super({ key: "LevelSelectScene" }); }

  create(): void {
    const W  = this.scale.width;   // 960
    const H  = this.scale.height;  // 540
    const cx = W / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1b5e20, 0x1b5e20, 0x2e7d32, 0x33691e, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    this.add.text(cx, 18, "CHOOSE DIFFICULTY", {
      fontSize: "28px", fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffee58", stroke: "#5d2a00", strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this.add.text(cx, 58, "How hard do you want the challenge?", {
      fontSize: "14px", fontFamily: "Nunito, sans-serif",
      color: "#c8e6c9", fontStyle: "italic",
    }).setOrigin(0.5, 0);

    // ── 3 cards side by side (landscape layout) ─────────────
    const PAD    = 20;
    const cardW  = Math.floor((W - PAD * 4) / 3); // ≈ 300px each
    const cardH  = H - 155;                        // ≈ 385px, leaves room for title+button
    const cardY  = 85 + cardH / 2;                 // vertical center of card area

    const cardData: { key: DifficultyKey; color: number; accent: number; icon: string }[] = [
      { key: "EASY", color: 0x2e7d32, accent: 0x1b5e20, icon: "\uD83C\uDF3F" },
      { key: "MEH",  color: 0xe65100, accent: 0xbf360c, icon: "\uD83D\uDD25" },
      { key: "HARD", color: 0xb71c1c, accent: 0x7f0000, icon: "\u26A1" },
    ];

    cardData.forEach(({ key, color, accent, icon }, i) => {
      const cfg  = LEVELS[key];
      const cardX = PAD + i * (cardW + PAD) + cardW / 2; // card center x

      const gfx = this.add.graphics();
      gfx.fillGradientStyle(color, color, accent, accent, 1);
      gfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      gfx.lineStyle(2, 0xffffff, 0.15);
      gfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);

      // Icon
      const iconTxt = this.add.text(0, -cardH / 2 + 22, icon, {
        fontSize: "32px",
      }).setOrigin(0.5, 0);

      // Level name
      const nameTxt = this.add.text(0, -cardH / 2 + 68, cfg.label, {
        fontSize: "26px", fontFamily: "Fredoka One, Nunito, sans-serif",
        color: "#ffffff", stroke: "#00000055", strokeThickness: 2,
      }).setOrigin(0.5, 0);

      // Description
      const descTxt = this.add.text(0, -cardH / 2 + 112, cfg.description, {
        fontSize: "13px", fontFamily: "Nunito, sans-serif",
        color: "#ffffffcc", wordWrap: { width: cardW - 24 }, align: "center",
      }).setOrigin(0.5, 0);

      // Stats
      const mins = Math.floor(cfg.time / 60);
      const secs = cfg.time % 60;
      const tStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      const statTxt = this.add.text(0, cardH / 2 - 64,
        `\u23F1 ${tStr}\n\uD83E\uDE93 ${cfg.requiredWood} woods\n+3s per delivery`, {
        fontSize: "14px", fontFamily: "Nunito, sans-serif",
        color: "#ffe082", fontStyle: "bold", align: "center",
      }).setOrigin(0.5, 0);

      const card = this.add.container(cardX, cardY, [gfx, iconTxt, nameTxt, descTxt, statTxt]);
      card.setSize(cardW, cardH);
      card.setInteractive({ useHandCursor: true });

      card.on("pointerover",  () => this.tweens.add({ targets: card, scale: 1.04, duration: 80, ease: "Power1" }));
      card.on("pointerout",   () => this.tweens.add({ targets: card, scale: 1.00, duration: 80, ease: "Power1" }));
      card.on("pointerdown",  () => this.tweens.add({ targets: card, scale: 0.97, duration: 60, ease: "Power1" }));
      card.on("pointerup", () => {
        this.registry.set("selectedLevel", key);
        this.scene.start("GameScene");
      });
    });

    // BACK button (centered bottom)
    const backGfx = this.add.graphics();
    backGfx.fillStyle(0x37474f);
    backGfx.fillRoundedRect(-90, -22, 180, 44, 10);
    const backTxt = this.add.text(0, 0, "\u2190 BACK", {
      fontSize: "18px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffffff",
    }).setOrigin(0.5);
    const backBtn = this.add.container(cx, H - 34, [backGfx, backTxt]);
    backBtn.setSize(180, 44).setInteractive({ useHandCursor: true });
    backBtn.on("pointerover",  () => this.tweens.add({ targets: backBtn, scale: 1.06, duration: 80 }));
    backBtn.on("pointerout",   () => this.tweens.add({ targets: backBtn, scale: 1.00, duration: 80 }));
    backBtn.on("pointerup",    () => this.scene.start("MainMenuScene"));
  }
}