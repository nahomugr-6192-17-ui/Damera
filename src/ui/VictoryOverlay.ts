// ============================================================
// VictoryOverlay.ts — scale-only button hover
// Keeps game visible; shows Amharic message + celebration chars
// ============================================================

import Phaser from "phaser";

interface CelebChar { container: Phaser.GameObjects.Container; tween: Phaser.Tweens.Tween; }

export class VictoryOverlay {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private celebChars: CelebChar[] = [];

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

    // Semi-transparent overlay — game world stays visible
    const overlay = scene.add.rectangle(cx, H / 2, W, H, 0x001100, 0.45)
      .setScrollFactor(0).setDepth(100);
    this.elements.push(overlay);

    // Celebration characters around the fire
    this.spawnCelebChars(fireX, fireY);

    // Amharic: "እንኳን ለብርሃነ መስቀሉ በሰላም አደረሳችሁ!"
    const amharic = scene.add.text(
      cx, H * 0.18,
      "\u12A5\u1295\u12B3\u1295 \u1208\u1265\u122D\u1203\u1290\n\u1218\u1235\u1240\u1209 \u1260\u1230\u120B\u121D\n\u12A0\u12F0\u1228\u1233\u127D\u1201!", {
        fontSize: "28px",
        fontFamily: '"Noto Sans Ethiopic", sans-serif',
        color: "#00ff66",
        stroke: "#003300",
        strokeThickness: 3,
        align: "center",
        lineSpacing: 8,
      }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102);
    this.elements.push(amharic);

    scene.tweens.add({
      targets: amharic,
      scaleX: { from: 1, to: 1.04 },
      scaleY: { from: 1, to: 1.04 },
      duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    // English subtitle
    const eng = scene.add.text(cx, H * 0.46, "Happy Meskel Celebration! \uD83C\uDF89", {
      fontSize: "17px", fontFamily: "Nunito, sans-serif",
      color: "#ffee88", fontStyle: "bold",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102);
    this.elements.push(eng);

    this.makeButton(scene, cx, H * 0.60, "PLAY AGAIN", 0x2e7d32, onPlayAgain);
    this.makeButton(scene, cx, H * 0.73, "MAIN MENU",  0x1565c0, onMainMenu);
  }

  private spawnCelebChars(fireX: number, fireY: number): void {
    const positions = [
      { ox: -80, oy: -60 }, { ox:  80, oy: -60 },
      { ox: -100, oy: 10 }, { ox: 100, oy:  10 },
      { ox: -55,  oy: 65 }, { ox:  55, oy:  65 },
    ];
    const colors = [0xf4a261, 0xe76f51, 0xffd166, 0x06d6a0, 0x118ab2, 0xa8dadc];

    positions.forEach((pos, i) => {
      const wx   = fireX + pos.ox;
      const wy   = fireY + pos.oy;
      const col  = colors[i % colors.length];
      const head = this.scene.add.arc(0, -18, 8, 0, 360, false, 0xf4c994);
      const body = this.scene.add.rectangle(0,   0, 12, 20, col);
      const armL = this.scene.add.rectangle(-12, -8, 16, 5, col).setAngle(-40);
      const armR = this.scene.add.rectangle( 12, -8, 16, 5, col).setAngle( 40);

      const c = this.scene.add.container(wx, wy, [body, head, armL, armR]).setDepth(9);

      const tween = this.scene.tweens.add({
        targets:  c,
        y:        { from: wy, to: wy - 18 },
        duration: 380 + i * 40,
        yoyo: true, repeat: -1, ease: "Sine.easeOut", delay: i * 80,
      });

      this.celebChars.push({ container: c, tween });
      this.elements.push(c);
    });
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string, color: number,
    cb: () => void,
  ): void {
    const btnW = 220, btnH = 54;

    const gfx = scene.add.graphics().setScrollFactor(0).setDepth(102);
    gfx.fillStyle(color);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

    const txt = scene.add.text(0, 0, label, {
      fontSize: "20px", fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);

    const btn = scene.add.container(x, y, [gfx, txt]);
    btn.setSize(btnW, btnH).setScrollFactor(0).setDepth(102);
    btn.setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => { scene.tweens.add({ targets: btn, scale: 1.06, duration: 80 }); });
    btn.on("pointerout",  () => { scene.tweens.add({ targets: btn, scale: 1.00, duration: 80 }); });
    btn.on("pointerdown", () => { scene.tweens.add({ targets: btn, scale: 0.96, duration: 60 }); });
    btn.on("pointerup",   cb);

    this.elements.push(btn);
  }

  destroy(): void {
    this.celebChars.forEach(c => c.tween.stop());
    this.elements.forEach(e => e.destroy());
    this.celebChars = [];
    this.elements   = [];
  }
}