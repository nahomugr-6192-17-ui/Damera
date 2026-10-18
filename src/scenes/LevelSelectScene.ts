// ============================================================
// LevelSelectScene.ts — Landscape 3-column card layout (960×540)
// Authentic Ethiopian Meskel themed difficulty cards
// ============================================================

import Phaser from "phaser";
import { LEVELS } from "../config/LevelConfig";
import type { DifficultyKey } from "../config/LevelConfig";
import { WOOD_TIME_BONUS } from "../config/GameConfig";

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super({ key: "LevelSelectScene" }); }

  create(): void {
    const W = this.scale.width;   // 960
    const H = this.scale.height;  // 540
    const cx = W / 2;

    // ── 1. Atmospheric Background ────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0c2410, 0x0c2410, 0x1b4d22, 0x243e18, 1);
    bg.fillRect(0, 0, W, H);

    // Top Tibeb Pattern Border
    this.drawTibebBorder(W);

    // ── 2. Screen Title & Subtitle ────────────────────────────
    this.add.text(cx, 18, "CHOOSE DIFFICULTY", {
      fontSize: "28px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffee58",
      stroke: "#4a1c00",
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.add.text(cx, 54, "Select your challenge to prepare the Meskel feast", {
      fontSize: "14px",
      fontFamily: "Nunito, sans-serif",
      color: "#c8e6c9",
      fontStyle: "italic",
    }).setOrigin(0.5, 0);

    // ── 3. Three Difficulty Cards Side-by-Side ────────────────
    const PAD = 22;
    const cardW = Math.min(300, Math.floor((W - PAD * 4) / 3)); // capped at 300px for ideal card proportions
    const totalCardsW = 3 * cardW + 2 * PAD;
    const startX = (W - totalCardsW) / 2 + cardW / 2;
    const cardH = Math.min(350, H - 150);
    const cardY = 82 + cardH / 2;

    const cardData: {
      key: DifficultyKey;
      colorTop: number;
      colorBot: number;
      borderColor: number;
      icon: string;
      tagline: string;
    }[] = [
        {
          key: "EASY",
          colorTop: 0x2e7d32,
          colorBot: 0x1b5e20,
          borderColor: 0x81c784,
          icon: "🌿",
          tagline: "Relaxed Celebration",
        },
        {
          key: "MEH",
          colorTop: 0xe65100,
          colorBot: 0xbf360c,
          borderColor: 0xffb74d,
          icon: "🔥",
          tagline: "Standard Meskel",
        },
        {
          key: "HARD",
          colorTop: 0xb71c1c,
          colorBot: 0x7f0000,
          borderColor: 0xe57373,
          icon: "⚡",
          tagline: "Intense Gathering",
        },
      ];

    cardData.forEach(({ key, colorTop, colorBot, borderColor, icon, tagline }, i) => {
      const cfg = LEVELS[key];
      const cardX = startX + i * (cardW + PAD);

      // Card Background with drop shadow and border
      const gfx = this.add.graphics();
      // Drop shadow
      gfx.fillStyle(0x000000, 0.4);
      gfx.fillRoundedRect(-cardW / 2, -cardH / 2 + 5, cardW, cardH, 16);

      // Card body gradient
      gfx.fillGradientStyle(colorTop, colorTop, colorBot, colorBot, 0.95);
      gfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);

      // Card outer glowing border
      gfx.lineStyle(2, borderColor, 0.85);
      gfx.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);

      // Top specular highlight
      gfx.fillStyle(0xffffff, 0.12);
      gfx.fillRoundedRect(-cardW / 2 + 4, -cardH / 2 + 4, cardW - 8, cardH * 0.35, 12);

      // Icon Pill Background
      const iconPill = this.add.graphics();
      iconPill.fillStyle(0x000000, 0.28);
      iconPill.fillCircle(0, -cardH / 2 + 42, 28);
      iconPill.lineStyle(2, borderColor, 0.8);
      iconPill.strokeCircle(0, -cardH / 2 + 42, 28);

      // Icon
      const iconTxt = this.add.text(0, -cardH / 2 + 42, icon, {
        fontSize: "30px",
      }).setOrigin(0.5);

      // Level name
      const nameTxt = this.add.text(0, -cardH / 2 + 82, cfg.label, {
        fontSize: "26px",
        fontFamily: "Fredoka One, Nunito, sans-serif",
        color: "#ffffff",
        stroke: "#00000066",
        strokeThickness: 3,
      }).setOrigin(0.5, 0);

      // Tagline
      const tagTxt = this.add.text(0, -cardH / 2 + 116, tagline, {
        fontSize: "12px",
        fontFamily: "Nunito, sans-serif",
        color: "#ffee58",
        fontStyle: "bold",
      }).setOrigin(0.5, 0);

      // Description
      const descTxt = this.add.text(0, -cardH / 2 + 138, cfg.description, {
        fontSize: "13px",
        fontFamily: "Nunito, sans-serif",
        color: "#e8f5e9",
        wordWrap: { width: cardW - 32 },
        align: "center",
        lineSpacing: 2,
      }).setOrigin(0.5, 0);

      // Stats Panel Box (reduced gap: positioned directly below subheading description)
      const statBox = this.add.graphics();
      const sbW = cardW - 32, sbH = 92;
      const sbY = -cardH / 2 + 175;
      statBox.fillStyle(0x000000, 0.35);
      statBox.fillRoundedRect(-sbW / 2, sbY, sbW, sbH, 10);
      statBox.lineStyle(1, 0xffffff, 0.15);
      statBox.strokeRoundedRect(-sbW / 2, sbY, sbW, sbH, 10);

      const mins = Math.floor(cfg.time / 60);
      const secs = cfg.time % 60;
      const tStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      const statTxt = this.add.text(0, sbY + 12,
        `⏱️ Time Limit:  ${tStr}\n🪵 Required:  ${cfg.requiredWood} woods\n✨ Bonus:  +${WOOD_TIME_BONUS}s per drop`, {
        fontSize: "13px",
        fontFamily: "Nunito, sans-serif",
        color: "#ffe082",
        fontStyle: "bold",
        lineSpacing: 7,
        align: "center",
      }).setOrigin(0.5, 0);

      // "SELECT" Pill Button at bottom of card
      const selBtnGfx = this.add.graphics();
      const selBtnW = cardW - 48, selBtnH = 38;
      const selBtnY = sbY + sbH + 32;
      selBtnGfx.fillStyle(0xffffff, 0.22);
      selBtnGfx.fillRoundedRect(-selBtnW / 2, selBtnY - selBtnH / 2, selBtnW, selBtnH, 10);
      selBtnGfx.lineStyle(1.5, 0xffffff, 0.6);
      selBtnGfx.strokeRoundedRect(-selBtnW / 2, selBtnY - selBtnH / 2, selBtnW, selBtnH, 10);

      const selBtnTxt = this.add.text(0, selBtnY, "SELECT  ➔", {
        fontSize: "15px",
        fontFamily: "Fredoka One, Nunito, sans-serif",
        color: "#ffffff",
      }).setOrigin(0.5);

      const card = this.add.container(cardX, cardY, [
        gfx, iconPill, iconTxt, nameTxt, tagTxt, descTxt,
        statBox, statTxt, selBtnGfx, selBtnTxt,
      ]);
      card.setSize(cardW, cardH);
      card.setInteractive({ useHandCursor: true });

      // Hover feedback
      card.on("pointerover", () => {
        this.tweens.add({ targets: card, scale: 1.035, duration: 90, ease: "Power2" });
      });
      card.on("pointerout", () => {
        this.tweens.add({ targets: card, scale: 1.00, duration: 90, ease: "Power2" });
      });
      card.on("pointerdown", () => {
        this.tweens.add({ targets: card, scale: 0.97, duration: 60, ease: "Power2" });
      });
      card.on("pointerup", () => {
        if (this.cache.audio.has("ui_click")) {
          this.sound.play("ui_click", { volume: 0.75 });
        }
        this.registry.set("selectedLevel", key);
        this.scene.start("GameScene");
      });
    });

    // ── 4. BACK Button (Centered bottom) ─────────────────────
    const backBtnW = 180, backBtnH = 42;
    const backGfx = this.add.graphics();
    backGfx.fillStyle(0x000000, 0.35);
    backGfx.fillRoundedRect(-backBtnW / 2, -backBtnH / 2 + 2, backBtnW, backBtnH, 12);
    backGfx.fillStyle(0x263238, 0.95);
    backGfx.fillRoundedRect(-backBtnW / 2, -backBtnH / 2, backBtnW, backBtnH, 12);
    backGfx.lineStyle(1.5, 0x78909c, 0.8);
    backGfx.strokeRoundedRect(-backBtnW / 2, -backBtnH / 2, backBtnW, backBtnH, 12);

    const backTxt = this.add.text(0, 0, "◀  BACK", {
      fontSize: "16px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#eceff1",
    }).setOrigin(0.5);

    const backBtn = this.add.container(cx, H - 30, [backGfx, backTxt]);
    backBtn.setSize(backBtnW, backBtnH).setInteractive({ useHandCursor: true });

    backBtn.on("pointerover", () => this.tweens.add({ targets: backBtn, scale: 1.05, duration: 80 }));
    backBtn.on("pointerout", () => this.tweens.add({ targets: backBtn, scale: 1.00, duration: 80 }));
    backBtn.on("pointerdown", () => this.tweens.add({ targets: backBtn, scale: 0.95, duration: 60 }));
    backBtn.on("pointerup", () => {
      if (this.cache.audio.has("ui_click")) {
        this.sound.play("ui_click", { volume: 0.75 });
      }
      this.scene.start("MainMenuScene");
    });
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
}