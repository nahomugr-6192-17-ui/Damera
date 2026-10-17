// ============================================================
// VictoryOverlay.ts — Authentic Ethiopian Meskel Celebration
// Full human NPCs in traditional Habesha attire with dancing
// and cheering animations, Adey Abeba confetti, and styled blessing.
// ============================================================

import Phaser from "phaser";

interface CelebNPC {
  container: Phaser.GameObjects.Container;
  tweens: Phaser.Tweens.Tween[];
}

export class VictoryOverlay {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private celebNPCs: CelebNPC[] = [];
  private confettiTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    fireX: number,
    fireY: number,
    onPlayAgain: () => void,
    onMainMenu: () => void,
  ) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const cx = W / 2;

    // ── 1. Semi-transparent celebration vignette ──────────────
    // Game world remains visible behind the warm overlay
    const overlay = scene.add.rectangle(cx, H / 2, W, H, 0x051a08, 0.52)
      .setScrollFactor(0).setDepth(100);
    this.elements.push(overlay);

    // ── 2. Spawn Ethiopian Human NPCs celebrating around fire ──
    this.spawnCelebNPCs(fireX, fireY);

    // ── 3. Falling Adey Abeba Petals & Golden Confetti ────────
    this.startCelebrationConfetti(W, H);

    // ── 4. Main Amharic Blessing Banner ───────────────────────
    // Glassmorphic banner container
    const bannerW = Math.min(680, W - 40);
    const bannerH = 155;
    const bannerY = H * 0.22;

    const bannerGfx = scene.add.graphics().setScrollFactor(0).setDepth(102);
    // Dark glowing backdrop
    bannerGfx.fillStyle(0x0c2410, 0.92);
    bannerGfx.fillRoundedRect(cx - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 18);
    // Gold ornamental border
    bannerGfx.lineStyle(2.5, 0xffd54f, 0.9);
    bannerGfx.strokeRoundedRect(cx - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 18);

    // Ethiopian top accent strip on banner
    const colors = [0x2e7d32, 0xfbc02d, 0xc62828];
    const segW = 16;
    for (let i = 0; i < Math.ceil(bannerW / segW); i++) {
      bannerGfx.fillStyle(colors[i % colors.length], 0.9);
      bannerGfx.fillRect(cx - bannerW / 2 + i * segW, bannerY - bannerH / 2, segW, 4);
    }
    this.elements.push(bannerGfx);

    // Amharic Blessing: "እንኳን ለብርሃነ መስቀሉ በሰላም አደረሳችሁ!"
    const amharic = scene.add.text(
      cx, bannerY - 32,
      "እንኳን ለብርሃነ መስቀሉ በሰላም አደረሳችሁ!", {
      fontSize: "26px",
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: "#ffee58",
      stroke: "#3e1c00",
      strokeThickness: 5,
      align: "center",
    }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(103);
    this.elements.push(amharic);

    // Gentle celebratory breathing pulse on the blessing
    scene.tweens.add({
      targets: amharic,
      scale: { from: 1, to: 1.035 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // English celebration subtitle
    const eng = scene.add.text(
      cx, bannerY + 14,
      "✨ Happy Meskel Feast! The ደመራ Fire Burns Bright! 🌼", {
      fontSize: "15px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#c8e6c9",
    }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(103);
    this.elements.push(eng);

    // ── 5. Action Buttons ────────────────────────────────────
    this.makeButton(scene, cx - 125, H * 0.72, "▶  PLAY AGAIN", 0x2e7d32, 0x1b5e20, 0x81c784, onPlayAgain);
    this.makeButton(scene, cx + 125, H * 0.72, "🏠  MAIN MENU", 0x4e342e, 0x2d1b17, 0xd7ccc8, onMainMenu);
  }

  /**
   * Spawns recognizable human NPCs in traditional Ethiopian Habesha Kemis
   * around the burning ደመራ bonfire with celebratory dancing/waving animations.
   */
  private spawnCelebNPCs(fireX: number, fireY: number): void {
    const npcConfigs = [
      { ox: -85, oy: -50, tibeb: 0x2e7d32, pose: "wave" },   // Top-left
      { ox: 85, oy: -50, tibeb: 0xc62828, pose: "cheer" },  // Top-right
      { ox: -105, oy: 15, tibeb: 0xfbc02d, pose: "clap" },   // Mid-left
      { ox: 105, oy: 15, tibeb: 0x0288d1, pose: "wave" },   // Mid-right
      { ox: -60, oy: 70, tibeb: 0x7b1fa2, pose: "cheer" },  // Bottom-left
      { ox: 60, oy: 70, tibeb: 0xe65100, pose: "clap" },   // Bottom-right
    ];

    const skinTones = [0xa26238, 0x935128, 0xb87333, 0x8a4b22, 0x9e5b30, 0xa96b3d];

    npcConfigs.forEach((cfg, i) => {
      const wx = fireX + cfg.ox;
      const wy = fireY + cfg.oy;
      const skin = skinTones[i % skinTones.length];
      const hair = 0x1a120c;

      // 1. Shadow
      const shadow = this.scene.add.ellipse(0, 16, 22, 8, 0x000000, 0.32);

      // 2. Legs & Feet
      const legL = this.scene.add.rectangle(-4, 9, 4, 10, 0x3e2723);
      const legR = this.scene.add.rectangle(4, 9, 4, 10, 0x3e2723);

      // 3. Traditional Habesha White Kemis / Tunic with Tibeb Hem
      const dress = this.scene.add.rectangle(0, -1, 18, 18, 0xf5f3ea);
      const tibebStrip1 = this.scene.add.rectangle(0, -3, 18, 2.5, cfg.tibeb);
      const tibebStrip2 = this.scene.add.rectangle(0, 5, 18, 2.5, 0xfbc02d);
      const torso = this.scene.add.container(0, 0, [dress, tibebStrip1, tibebStrip2]);

      // 4. Arms (Posed for celebration)
      const armL = this.scene.add.rectangle(-10, -8, 4, 12, skin);
      const armR = this.scene.add.rectangle(10, -8, 4, 12, skin);
      armL.setOrigin(0.5, 0);
      armR.setOrigin(0.5, 0);

      // Initial celebration arm poses
      if (cfg.pose === "wave") {
        armL.setAngle(-135);
        armR.setAngle(135);
      } else if (cfg.pose === "cheer") {
        armL.setAngle(-150);
        armR.setAngle(45);
      } else {
        armL.setAngle(-45);
        armR.setAngle(45);
      }

      // 5. Head & Smiling Face
      const head = this.scene.add.ellipse(0, -15, 13, 14, skin);
      const hairCrown = this.scene.add.arc(0, -18, 7, 180, 360, false, hair);
      const hairL = this.scene.add.circle(-5, -17, 3.5, hair);
      const hairR = this.scene.add.circle(5, -17, 3.5, hair);
      const eyeL = this.scene.add.circle(-2.5, -15, 1.2, 0x111111);
      const eyeR = this.scene.add.circle(2.5, -15, 1.2, 0x111111);
      const smile = this.scene.add.arc(0, -12, 2.5, 20, 160, false, 0x5a2d10);
      const headGroup = this.scene.add.container(0, 0, [head, hairCrown, hairL, hairR, eyeL, eyeR, smile]);

      // Adey Abeba flower held by cheering NPCs
      const flower = this.scene.add.circle(armR.x + 4, armR.y - 12, 4, 0xffeb3b);
      const flowerCore = this.scene.add.circle(armR.x + 4, armR.y - 12, 1.8, 0xff6f00);
      const flowerGroup = this.scene.add.container(0, 0, [flower, flowerCore]);
      flowerGroup.setVisible(cfg.pose === "cheer" || cfg.pose === "wave");

      const npcContainer = this.scene.add.container(wx, wy, [
        shadow, legL, legR, torso, armL, armR, headGroup, flowerGroup
      ]).setDepth(9);

      // Jumping & dancing animation
      const jumpTween = this.scene.tweens.add({
        targets: npcContainer,
        y: { from: wy, to: wy - 20 },
        duration: 360 + (i % 3) * 60,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeOut",
        delay: i * 90,
      });

      // Joyful arm waving animation
      const armTween = this.scene.tweens.add({
        targets: [armL, armR],
        angle: { from: -140, to: -110 },
        duration: 220,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 50,
      });

      this.celebNPCs.push({ container: npcContainer, tweens: [jumpTween, armTween] });
      this.elements.push(npcContainer);
    });
  }

  /** Floating celebratory Adey Abeba petals and gold sparks */
  private startCelebrationConfetti(W: number, H: number): void {
    this.confettiTimer = this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const petal = this.scene.add.circle(
          Phaser.Math.Between(20, W - 20),
          -10,
          Phaser.Math.FloatBetween(2.5, 4.5),
          Phaser.Utils.Array.GetRandom([0xffeb3b, 0xffd54f, 0xff9800, 0x81c784, 0xff5252]),
          0.88
        ).setScrollFactor(0).setDepth(101);

        this.scene.tweens.add({
          targets: petal,
          x: petal.x + Phaser.Math.Between(-40, 40),
          y: H + 20,
          angle: 360,
          duration: Phaser.Math.Between(3000, 5000),
          ease: "Sine.easeInOut",
          onComplete: () => petal.destroy(),
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
    cb: () => void,
  ): void {
    const btnW = 210, btnH = 52;

    const gfx = scene.add.graphics().setScrollFactor(0).setDepth(103);
    // Shadow
    gfx.fillStyle(0x000000, 0.4);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2 + 3, btnW, btnH, 14);

    // Gradient body
    gfx.fillGradientStyle(colorTop, colorTop, colorBot, colorBot, 1);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);

    // Border
    gfx.lineStyle(2, borderColor, 0.9);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);

    // Specular highlight
    gfx.fillStyle(0xffffff, 0.16);
    gfx.fillRoundedRect(-btnW / 2 + 4, -btnH / 2 + 3, btnW - 8, btnH * 0.4, 10);

    const txt = scene.add.text(0, 0, label, {
      fontSize: "19px",
      fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
      stroke: "#00000055",
      strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104);

    const btn = scene.add.container(x, y, [gfx, txt]);
    btn.setSize(btnW, btnH).setScrollFactor(0).setDepth(103);
    btn.setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => { scene.tweens.add({ targets: btn, scale: 1.05, duration: 80 }); });
    btn.on("pointerout", () => { scene.tweens.add({ targets: btn, scale: 1.00, duration: 80 }); });
    btn.on("pointerup", () => {
      if (scene.cache.audio.has("ui_click")) {
        scene.sound.play("ui_click", { volume: 0.75 });
      }
      cb();
    });

    this.elements.push(btn);
  }

  destroy(): void {
    this.confettiTimer?.destroy();
    this.celebNPCs.forEach(npc => npc.tweens.forEach(t => t.stop()));
    this.elements.forEach(e => e.destroy());
    this.celebNPCs = [];
    this.elements = [];
  }
}