// ============================================================
// GameOverOverlay.ts — Atmospheric burnt charcoal vignette
// Preserves red GAME OVER title and Amharic proverb.
// ============================================================

import Phaser from "phaser";

export class GameOverOverlay {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private ashTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    woodDelivered: number,
    requiredWood: number,
    onPlayAgain: () => void,
    onMainMenu: () => void,
  ) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const cx = W / 2;

    // ── 1. Dark Vignette Overlay ──────────────────────────────
    const overlay = scene.add.rectangle(cx, H / 2, W, H, 0x0a0a0a, 0.88)
      .setScrollFactor(0).setDepth(100);
    this.elements.push(overlay);

    // Fade-in effect
    scene.tweens.add({
      targets: overlay,
      alpha: { from: 0.3, to: 0.90 },
      duration: 500,
      ease: "Power2",
    });

    // ── 2. Drifting Ash & Dimming Ember Specks ─────────────────
    this.startDriftingAsh(W, H);

    // ── 3. Central Game Over Card ─────────────────────────────
    const cardW = Math.min(560, W - 40);
    const cardH = 340;
    const cardY = H * 0.48;

    const cardGfx = scene.add.graphics().setScrollFactor(0).setDepth(101);
    // Dark charred container body
    cardGfx.fillStyle(0x181818, 0.94);
    cardGfx.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 18);
    // Dark burnt-red outline
    cardGfx.lineStyle(2, 0xd32f2f, 0.85);
    cardGfx.strokeRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 18);
    this.elements.push(cardGfx);

    // Title: GAME OVER
    const title = scene.add.text(cx, cardY - 120, "GAME OVER", {
      fontSize: "44px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ff3333",
      stroke: "#5a0000",
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 3, color: "#ff000044", blur: 14, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.elements.push(title);

    // Amharic proverb: "ደመራው ካልበራ ዓመቱ እንዴት ሊበራ ነው?"
    const sub = scene.add.text(cx, cardY - 60, "«ደመራው ካልበራ ዓመቱ እንዴት ሊበራ ነው?»", {
      fontSize: "19px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#ffab91",
      fontStyle: "italic",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.elements.push(sub);

    // Stats Panel Box
    const statW = cardW - 60, statH = 68;
    const statGfx = scene.add.graphics().setScrollFactor(0).setDepth(102);
    statGfx.fillStyle(0x0e0e0e, 0.8);
    statGfx.fillRoundedRect(cx - statW / 2, cardY - 20, statW, statH, 10);
    statGfx.lineStyle(1, 0x424242, 0.6);
    statGfx.strokeRoundedRect(cx - statW / 2, cardY - 20, statW, statH, 10);
    this.elements.push(statGfx);

    const progress = scene.add.text(cx, cardY + 14,
      `🪵 Wood Delivered:  ${woodDelivered} / ${requiredWood}    •    ⏱️ Time: 00:00`, {
      fontSize: "15px",
      fontFamily: "Nunito, sans-serif",
      color: "#e0e0e0",
      fontStyle: "bold",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
    this.elements.push(progress);

    // ── 4. Action Buttons ────────────────────────────────────
    this.makeButton(scene, cx - 120, cardY + 105, "▶  PLAY AGAIN", 0x2e7d32, 0x1b5e20, 0x81c784, onPlayAgain);
    this.makeButton(scene, cx + 120, cardY + 105, "🏠  MAIN MENU", 0x37474f, 0x212121, 0x90a4ae, onMainMenu);
  }

  private startDriftingAsh(W: number, H: number): void {
    this.ashTimer = this.scene.time.addEvent({
      delay: 240,
      loop: true,
      callback: () => {
        const ash = this.scene.add.circle(
          Phaser.Math.Between(20, W - 20),
          -10,
          Phaser.Math.FloatBetween(1.5, 3),
          Phaser.Utils.Array.GetRandom([0x757575, 0x9e9e9e, 0xff5722]),
          0.65
        ).setScrollFactor(0).setDepth(101);

        this.scene.tweens.add({
          targets: ash,
          x: ash.x + Phaser.Math.Between(-30, 30),
          y: H + 15,
          alpha: 0,
          duration: Phaser.Math.Between(3500, 5500),
          ease: "Sine.easeIn",
          onComplete: () => ash.destroy(),
        });
      },
    });
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    colorTop: number, colorBot: number,
    borderColor: number,
    cb: () => void
  ): void {
    const btnW = 200, btnH = 48;

    const gfx = scene.add.graphics().setScrollFactor(0).setDepth(103);
    // Shadow
    gfx.fillStyle(0x000000, 0.4);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2 + 3, btnW, btnH, 12);

    // Body
    gfx.fillGradientStyle(colorTop, colorTop, colorBot, colorBot, 1);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

    // Border
    gfx.lineStyle(1.8, borderColor, 0.85);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

    // Specular
    gfx.fillStyle(0xffffff, 0.15);
    gfx.fillRoundedRect(-btnW / 2 + 4, -btnH / 2 + 3, btnW - 8, btnH * 0.38, 8);

    const txt = scene.add.text(0, 0, label, {
      fontSize: "17px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104);

    const btn = scene.add.container(x, y, [gfx, txt]);
    btn.setSize(btnW, btnH).setScrollFactor(0).setDepth(103);
    btn.setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => scene.tweens.add({ targets: btn, scale: 1.05, duration: 80 }));
    btn.on("pointerout", () => scene.tweens.add({ targets: btn, scale: 1.00, duration: 80 }));
    btn.on("pointerup", () => {
      if (scene.cache.audio.has("ui_click")) {
        scene.sound.play("ui_click", { volume: 0.75 });
      }
      cb();
    });

    this.elements.push(btn);
  }

  destroy(): void {
    this.ashTimer?.destroy();
    this.elements.forEach(e => e.destroy());
    this.elements = [];
  }
}