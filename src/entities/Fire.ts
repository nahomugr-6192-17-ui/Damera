// ============================================================
// Fire.ts
// The ችቦ (chibo) fire object.
// Flickers via a repeating tween. Shows "Add Wood" prompt when
// player is nearby and carrying wood.
// ============================================================

import Phaser from 'phaser';
import { FIRE_RADIUS, FIRE_DELIVER_RADIUS } from '../config/GameConfig';

export class Fire {
  public container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  // Visual layers (largest → smallest)
  private outerFlame: Phaser.GameObjects.Arc;
  private midFlame:   Phaser.GameObjects.Arc;
  private coreFlame:  Phaser.GameObjects.Arc;
  private glow:       Phaser.GameObjects.Arc;

  // Prompt shown when player can deliver wood
  private promptText: Phaser.GameObjects.Text;
  private promptVisible: boolean = false;

  // Stack pole visuals (the ችቦ poles forming an inverted cone)
  private poles: Phaser.GameObjects.Rectangle[] = [];

  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // ── ችቦ poles (brown sticks meeting at top) ───────────────
    const poleColor = 0x5d3a1a;
    const makePolePair = (angle: number): Phaser.GameObjects.Rectangle => {
      const pole = scene.add.rectangle(0, 0, 6, FIRE_RADIUS * 1.6, poleColor);
      pole.setOrigin(0.5, 1);
      pole.setAngle(angle);
      pole.setPosition(
        Math.sin(Phaser.Math.DegToRad(angle)) * 10,
        FIRE_RADIUS * 0.3
      );
      return pole;
    };
    this.poles = [-30, -15, 0, 15, 30].map(a => makePolePair(a));

    // ── Fire glow (large soft circle) ────────────────────────
    this.glow = scene.add.arc(0, 0, FIRE_RADIUS * 1.4, 0, 360, false, 0xff8800, 0.18);

    // ── Outer flame ──────────────────────────────────────────
    this.outerFlame = scene.add.arc(0, 0, FIRE_RADIUS, 0, 360, false, 0xff4500);

    // ── Mid flame ────────────────────────────────────────────
    this.midFlame = scene.add.arc(0, -4, FIRE_RADIUS * 0.65, 0, 360, false, 0xff8c00);

    // ── Core flame ───────────────────────────────────────────
    this.coreFlame = scene.add.arc(0, -8, FIRE_RADIUS * 0.35, 0, 360, false, 0xffee00);

    // ── "Add Wood" prompt ────────────────────────────────────
    this.promptText = scene.add.text(0, -FIRE_RADIUS - 20, '🪵 Add Wood', {
      fontSize: '14px',
      fontFamily: 'Nunito, sans-serif',
      color: '#ffffff',
      backgroundColor: '#cc4400cc',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setVisible(false).setDepth(25);

    // ── Assemble container ────────────────────────────────────
    this.container = scene.add.container(x, y, [
      this.glow,
      ...this.poles,
      this.outerFlame,
      this.midFlame,
      this.coreFlame,
    ]);
    this.container.setDepth(8);

    // ── Flicker animation ─────────────────────────────────────
    this.startFlicker();
  }

  private startFlicker(): void {
    // Outer flame pulses size and alpha
    this.scene.tweens.add({
      targets: this.outerFlame,
      scaleX: { from: 1, to: 0.88 },
      scaleY: { from: 1, to: 0.8 },
      alpha:  { from: 1, to: 0.75 },
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Core flame pulses slightly out of phase
    this.scene.tweens.add({
      targets: this.coreFlame,
      scaleX: { from: 1, to: 1.2 },
      scaleY: { from: 1, to: 0.85 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 80,
    });

    // Glow pulses slowly
    this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.18, to: 0.32 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Call each frame.
   * @param playerX       world-space player position
   * @param playerY       world-space player position
   * @param carryingWood  whether the player is holding a wood bundle
   * @returns true if player is in delivery range AND carrying wood
   */
  update(playerX: number, playerY: number, carryingWood: boolean): boolean {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const inRange = dist <= FIRE_DELIVER_RADIUS && carryingWood;

    if (inRange !== this.promptVisible) {
      this.promptVisible = inRange;
      this.promptText.setVisible(inRange);
    }

    if (inRange) {
      this.promptText.setPosition(this.x, this.y - FIRE_RADIUS - 16);
    }

    return inRange;
  }

  /** Visual burst when wood is delivered (flash brighter briefly) */
  onWoodAdded(): void {
    this.scene.tweens.add({
      targets: [this.outerFlame, this.midFlame, this.coreFlame],
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 120,
      yoyo: true,
      ease: 'Power2',
    });
  }

  destroy(): void {
    this.container.destroy();
    this.promptText.destroy();
  }
}
