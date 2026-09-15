// ============================================================
// VictoryOverlay.ts
// Shown when the player delivers all required wood.
// Keeps the game scene visible underneath a semi-transparent
// overlay. Shows Amharic celebration text and spawns simple
// celebration characters around the fire.
// ============================================================

import Phaser from 'phaser';

interface CelebChar {
  container: Phaser.GameObjects.Container;
  tweenY: Phaser.Tweens.Tween;
}

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

    // ── Light semi-transparent overlay (keep scene visible) ──
    const overlay = scene.add
      .rectangle(cx, H / 2, W, H, 0x001100, 0.45)
      .setScrollFactor(0)
      .setDepth(100);
    this.elements.push(overlay);

    // ── Spawn celebration characters around the fire ──────────
    this.spawnCelebChars(fireX, fireY);

    // ── Main Amharic victory message ─────────────────────────
    // Uses Noto Sans Ethiopic loaded via index.html
    const amharicMsg = scene.add
      .text(cx, H * 0.20, 'እንኳን ለብርሃነ\nመስቀሉ በሰላም\nአደረሳችሁ!', {
        fontSize: '28px',
        fontFamily: '"Noto Sans Ethiopic", sans-serif',
        color: '#00ff66',
        stroke: '#003300',
        strokeThickness: 3,
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(102);
    this.elements.push(amharicMsg);

    // ── English subtitle ─────────────────────────────────────
    const engSub = scene.add
      .text(cx, H * 0.46, 'Happy Meskel Celebration! 🎉', {
        fontSize: '16px',
        fontFamily: 'Nunito, sans-serif',
        color: '#ffee88',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(102);
    this.elements.push(engSub);

    // Pulse the Amharic text
    scene.tweens.add({
      targets: amharicMsg,
      scaleX: { from: 1, to: 1.04 },
      scaleY: { from: 1, to: 1.04 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── PLAY AGAIN button ────────────────────────────────────
    this.makeButton(scene, cx, H * 0.60, 'PLAY AGAIN', 0x2e7d32, onPlayAgain);

    // ── MAIN MENU button ─────────────────────────────────────
    this.makeButton(scene, cx, H * 0.73, 'MAIN MENU', 0x1565c0, onMainMenu);
  }

  /** Spawn 6 simple celebration figures around the fire */
  private spawnCelebChars(fireX: number, fireY: number): void {
    const positions = [
      { ox: -80, oy: -60 },
      { ox:  80, oy: -60 },
      { ox: -100, oy:  10 },
      { ox:  100, oy:  10 },
      { ox: -55,  oy:  65 },
      { ox:  55,  oy:  65 },
    ];

    const colors = [0xf4a261, 0xe76f51, 0xffd166, 0x06d6a0, 0x118ab2, 0xa8dadc];

    positions.forEach((pos, i) => {
      const wx = fireX + pos.ox;
      const wy = fireY + pos.oy;
      const bodyColor = colors[i % colors.length];

      // Simple person: head + body
      const head = this.scene.add.arc(0, -18, 8, 0, 360, false, 0xf4c994);
      const body = this.scene.add.rectangle(0, 0, 12, 20, bodyColor);
      // Arms raised
      const armL = this.scene.add.rectangle(-12, -8, 16, 5, bodyColor).setAngle(-40);
      const armR = this.scene.add.rectangle( 12, -8, 16, 5, bodyColor).setAngle( 40);

      const container = this.scene.add.container(wx, wy, [body, head, armL, armR]);
      container.setDepth(9);

      // Jumping / bouncing tween with staggered delay
      const tween = this.scene.tweens.add({
        targets: container,
        y: { from: wy, to: wy - 18 },
        duration: 380 + i * 40,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeOut',
        delay: i * 80,
      });

      this.celebChars.push({ container, tweenY: tween });
      this.elements.push(container);
    });
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    color: number,
    callback: () => void,
  ): void {
    const btnW = 220, btnH = 54;

    const bg = scene.add
      .rectangle(x, y, btnW, btnH, color, 1)
      .setScrollFactor(0)
      .setDepth(102)
      .setInteractive({ useHandCursor: true });

    const txt = scene.add
      .text(x, y, label, {
        fontSize: '20px',
        fontFamily: 'Fredoka One, Nunito, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(103);

    bg.on('pointerdown', callback);
    bg.on('pointerover',  () => bg.setAlpha(0.8));
    bg.on('pointerout',   () => bg.setAlpha(1.0));

    this.elements.push(bg, txt);
  }

  destroy(): void {
    this.celebChars.forEach(c => c.tweenY.stop());
    this.elements.forEach(e => e.destroy());
    this.celebChars = [];
    this.elements = [];
  }
}
