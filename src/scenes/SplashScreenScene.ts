// ============================================================
// SplashScreenScene.ts — Professional Studio / Publisher Splash Screen
// Features Papa Smurf studio identity, cinematic ember glow,
// smooth transitions, skip handling, and responsive scaling.
// ============================================================

import Phaser from "phaser";

export class SplashScreenScene extends Phaser.Scene {
  private hasTransitioned: boolean = false;
  private emberTimer?: Phaser.Time.TimerEvent;
  private autoTimer?: Phaser.Time.TimerEvent;
  private bgGraphics?: Phaser.GameObjects.Graphics;
  private mainContainer?: Phaser.GameObjects.Container;
  private glowOuter?: Phaser.GameObjects.Arc;
  private glowInner?: Phaser.GameObjects.Arc;
  private skipText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "SplashScreenScene" });
  }

  create(): void {
    // If splash has already been shown this session, jump directly to MainMenuScene
    if (this.registry.get("splashShown")) {
      this.scene.start("MainMenuScene");
      return;
    }
    this.registry.set("splashShown", true);
    this.hasTransitioned = false;

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    // ── 1. Cinematic Dark Forest & Ember Sky Background ───────
    this.bgGraphics = this.add.graphics();
    this.drawBackground(W, H);

    // ── 2. Warm Ceremonial Fire Ambient Glow ──────────────────
    this.glowOuter = this.add.arc(cx, cy - 20, 160, 0, 360, false, 0xff5722, 0.12);
    this.glowInner = this.add.arc(cx, cy - 20, 100, 0, 360, false, 0xffb300, 0.18);

    this.tweens.add({
      targets: [this.glowOuter, this.glowInner],
      scale: { from: 0.94, to: 1.08 },
      alpha: { from: 0.12, to: 0.24 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── 3. Atmospheric Floating Ember Particles ───────────────
    this.startAmbientEmbers(cx, cy);

    // ── 4. Studio Logo Artwork & Typography Container ─────────
    this.mainContainer = this.add.container(cx, cy - 18);
    this.mainContainer.setAlpha(0);
    this.mainContainer.setScale(0.92);

    // Subtle dark badge backdrop with soft glowing outline for the logo
    const logoSize = 190;
    const badgePad = 8;
    const badgeW = logoSize + badgePad * 2;
    const badgeH = (logoSize * (422 / 431)) + badgePad * 2;

    const badgeGfx = this.add.graphics();
    // Drop shadow
    badgeGfx.fillStyle(0x000000, 0.55);
    badgeGfx.fillRoundedRect(-badgeW / 2, -badgeH / 2 + 5, badgeW, badgeH, 24);
    // Dark body
    badgeGfx.fillStyle(0x0a0f0a, 0.92);
    badgeGfx.fillRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 22);
    // Warm golden border
    badgeGfx.lineStyle(1.8, 0xffc107, 0.7);
    badgeGfx.strokeRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 22);

    // Studio Logo Sprite (Original Papa Smurf photo, preserving exact 431x422 aspect ratio)
    const logoSprite = this.add.image(0, 0, "papa_smurf_logo");
    logoSprite.setDisplaySize(logoSize, logoSize * (422 / 431));

    // Cultural / Meskel game tagline below the logo
    const taglineY = badgeH / 2 + 24;
    const tagline = this.add.text(0, taglineY, "Presents  •  ዳመራ — Keep the Fire Burning", {
      fontSize: "13px",
      fontFamily: '"Noto Sans Ethiopic", "Fredoka One", Nunito, sans-serif',
      color: "#c8e6c9",
      fontStyle: "italic",
      letterSpacing: 1,
    }).setOrigin(0.5);

    this.mainContainer.add([badgeGfx, logoSprite, tagline]);

    // ── 5. Skip Prompt (subtle at screen bottom) ───────────────
    this.skipText = this.add.text(cx, H - 22, "Tap or press any key to skip", {
      fontSize: "11px",
      fontFamily: "Nunito, sans-serif",
      color: "#81c784",
    }).setOrigin(0.5).setAlpha(0);

    // ── 6. Entrance Animations & Timing ───────────────────────
    // Camera fade in from black
    this.cameras.main.fadeIn(450, 0, 0, 0);

    // Logo & text container smooth entrance
    this.tweens.add({
      targets: this.mainContainer,
      alpha: 1,
      scale: 1.0,
      duration: 650,
      ease: "Cubic.easeOut",
      delay: 150,
    });

    // Fade in skip text gently
    this.tweens.add({
      targets: this.skipText,
      alpha: 0.6,
      duration: 500,
      delay: 800,
    });

    // Auto-transition to Main Menu after 2.6 seconds
    this.autoTimer = this.time.delayedCall(2600, () => {
      this.goToMainMenu();
    });

    // ── 7. Skip Handling (Keyboard & Touch/Mouse) ──────────────
    const onSkip = () => this.goToMainMenu();
    this.input.keyboard?.once("keydown", onSkip);
    this.input.once("pointerdown", onSkip);

    // ── 8. Responsive Resize Handler ──────────────────────────
    const onResize = () => {
      const newW = this.scale.width;
      const newH = this.scale.height;
      const ncx = newW / 2;
      const ncy = newH / 2;

      this.drawBackground(newW, newH);
      if (this.glowOuter && this.glowInner) {
        this.glowOuter.setPosition(ncx, ncy - 20);
        this.glowInner.setPosition(ncx, ncy - 20);
      }
      if (this.mainContainer) {
        this.mainContainer.setPosition(ncx, ncy - 18);
      }
      if (this.skipText) {
        this.skipText.setPosition(ncx, newH - 22);
      }
    };

    this.scale.on("resize", onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", onResize);
      this.cleanup();
    });
  }

  private drawBackground(w: number, h: number): void {
    if (!this.bgGraphics) return;
    this.bgGraphics.clear();
    // Deep twilight black-green gradient
    this.bgGraphics.fillGradientStyle(0x050f07, 0x050f07, 0x0c2210, 0x142b15, 1);
    this.bgGraphics.fillRect(0, 0, w, h);

    // Subtle Ethiopian Tibeb decorative pattern at top and bottom rims
    const colors = [0x2e7d32, 0xfbc02d, 0xc62828];
    const segW = 16;
    const numSegs = Math.ceil(w / segW);
    for (let i = 0; i < numSegs; i++) {
      const c = colors[i % colors.length];
      this.bgGraphics.fillStyle(c, 0.65);
      this.bgGraphics.fillRect(i * segW, 0, segW, 3);
      this.bgGraphics.fillRect(i * segW, h - 3, segW, 3);
    }
  }

  private startAmbientEmbers(cx: number, cy: number): void {
    this.emberTimer = this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        if (this.hasTransitioned) return;
        const ember = this.add.circle(
          cx + Phaser.Math.Between(-140, 140),
          cy + Phaser.Math.Between(30, 90),
          Phaser.Math.FloatBetween(1.2, 3.0),
          Phaser.Utils.Array.GetRandom([0xffeb3b, 0xff9800, 0xff5722, 0xffc107]),
          0.85
        );

        this.tweens.add({
          targets: ember,
          x: ember.x + Phaser.Math.Between(-35, 35),
          y: ember.y - Phaser.Math.Between(80, 160),
          alpha: 0,
          scale: 0.2,
          duration: Phaser.Math.Between(1100, 1800),
          ease: "Sine.easeOut",
          onComplete: () => ember.destroy(),
        });
      },
    });
  }

  private goToMainMenu(): void {
    if (this.hasTransitioned) return;
    this.hasTransitioned = true;
    this.cleanup();

    this.cameras.main.fadeOut(380, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("MainMenuScene");
    });
  }

  private cleanup(): void {
    this.autoTimer?.destroy();
    this.emberTimer?.destroy();
    this.autoTimer = undefined;
    this.emberTimer = undefined;
  }
}
