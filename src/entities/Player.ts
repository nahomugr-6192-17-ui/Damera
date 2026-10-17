// ============================================================
// Player.ts
// Movement pipeline (in priority order):
//   1. Keyboard (WASD / arrow keys)
//   2. Virtual joystick (window.__jx / __jy - mobile overlay)
// Tap-to-move is intentionally removed - touch/click on screen
// must NOT trigger gameplay actions (joystick handles mobile).
// ============================================================

import Phaser from 'phaser';
import {
  PLAYER_SPEED, MUD_SPEED_MULTIPLIER, PLAYER_SIZE,
  MAP_WIDTH, MAP_HEIGHT,
} from '../config/GameConfig';

export class Player {
  public sprite: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;

  // Character body parts
  private shadow:        Phaser.GameObjects.Ellipse;
  private legL:          Phaser.GameObjects.Container;
  private legR:          Phaser.GameObjects.Container;
  private torso:         Phaser.GameObjects.Container;
  private tunicMain:     Phaser.GameObjects.Rectangle;
  private armL:          Phaser.GameObjects.Container;
  private armR:          Phaser.GameObjects.Container;
  private head:          Phaser.GameObjects.Container;
  private woodBundle:    Phaser.GameObjects.Container;
  private woodBadge:     Phaser.GameObjects.Container;

  private cursors:     Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd:        Record<string, Phaser.Input.Keyboard.Key> = {};
  private inMud:       boolean = false;
  private _carryingWood: boolean = false;
  private _frozen:       boolean = false;

  // Animation state
  private walkPhase: number = 0;
  private isMoving: boolean = false;
  private idleTime: number = 0;

  get speed(): number {
    return this.inMud ? PLAYER_SPEED * MUD_SPEED_MULTIPLIER : PLAYER_SPEED;
  }
  get carryingWood(): boolean { return this._carryingWood; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Palette: Ethiopian traditional attire (Netela/Tibeb tunic with green/gold/red trim)
    const SKIN_COLOR    = 0xa26238; // Rich warm brown skin
    const HAIR_COLOR    = 0x1a120c; // Dark curls
    const TUNIC_COLOR   = 0xf5f3ea; // Natural cotton white/cream
    const TUNIC_BORDER  = 0x2e7d32; // Ethiopian green trim
    const GOLD_ACCENT   = 0xfbc02d; // Gold embroidery
    const RED_ACCENT    = 0xc62828; // Crimson border
    const PANTS_COLOR   = 0x3e2723; // Dark earthy trousers
    const SHOE_COLOR    = 0x271c19; // Leather shoes

    // ── 1. Ground Shadow ──────────────────────────────────────
    this.shadow = scene.add.ellipse(0, 16, 26, 10, 0x000000, 0.32);

    // ── 2. Legs & Feet ────────────────────────────────────────
    // Left Leg
    const legLThigh = scene.add.rectangle(0, 5, 5, 12, PANTS_COLOR);
    const footL     = scene.add.rectangle(1, 11, 7, 4, SHOE_COLOR);
    this.legL = scene.add.container(-5, 4, [legLThigh, footL]);

    // Right Leg
    const legRThigh = scene.add.rectangle(0, 5, 5, 12, PANTS_COLOR);
    const footR     = scene.add.rectangle(1, 11, 7, 4, SHOE_COLOR);
    this.legR = scene.add.container(5, 4, [legRThigh, footR]);

    // ── 3. Torso & Traditional Tunic ──────────────────────────
    // Tunic main body
    this.tunicMain = scene.add.rectangle(0, -2, 18, 18, TUNIC_COLOR);
    // Ethiopian Tibeb embroidery stripes at chest & hem
    const tibebGreen = scene.add.rectangle(0, -5, 18, 3, TUNIC_BORDER);
    const tibebGold  = scene.add.rectangle(0, -2, 18, 2, GOLD_ACCENT);
    const tibebRed   = scene.add.rectangle(0, 1, 18, 2, RED_ACCENT);
    // Belt / sash
    const sash = scene.add.rectangle(0, 5, 18, 3, 0x4e342e);

    this.torso = scene.add.container(0, 0, [this.tunicMain, tibebGreen, tibebGold, tibebRed, sash]);

    // ── 4. Arms & Hands ───────────────────────────────────────
    // Left Arm
    const sleeveL = scene.add.rectangle(0, 4, 5, 8, TUNIC_COLOR);
    const foreArmL= scene.add.rectangle(0, 8, 4, 7, SKIN_COLOR);
    this.armL = scene.add.container(-11, -8, [sleeveL, foreArmL]);

    // Right Arm
    const sleeveR = scene.add.rectangle(0, 4, 5, 8, TUNIC_COLOR);
    const foreArmR= scene.add.rectangle(0, 8, 4, 7, SKIN_COLOR);
    this.armR = scene.add.container(11, -8, [sleeveR, foreArmR]);

    // ── 5. Head & Face ────────────────────────────────────────
    // Neck
    const neck = scene.add.rectangle(0, -10, 6, 5, SKIN_COLOR);
    // Face
    const face = scene.add.ellipse(0, -17, 14, 15, SKIN_COLOR);
    // Hair (curled crown)
    const hairBase = scene.add.arc(0, -20, 8, 180, 360, false, HAIR_COLOR);
    const hairPuffL = scene.add.circle(-6, -19, 4, HAIR_COLOR);
    const hairPuffR = scene.add.circle(6, -19, 4, HAIR_COLOR);
    const hairPuffT = scene.add.circle(0, -23, 4.5, HAIR_COLOR);

    // Eyes
    const eyeL = scene.add.rectangle(-3, -17, 2.5, 3, 0xffffff);
    const pupilL = scene.add.circle(-2.5, -17, 1.2, 0x111111);
    const eyeR = scene.add.rectangle(3, -17, 2.5, 3, 0xffffff);
    const pupilR = scene.add.circle(3.5, -17, 1.2, 0x111111);

    // Friendly smile
    const smile = scene.add.arc(0, -13, 3, 20, 160, false, 0x5a2d10);

    // Headband / traditional accent
    const headband = scene.add.rectangle(0, -20, 15, 2.5, GOLD_ACCENT);

    this.head = scene.add.container(0, 0, [
      neck, face, hairBase, hairPuffL, hairPuffR, hairPuffT,
      headband, eyeL, pupilL, eyeR, pupilR, smile
    ]);

    // ── 6. Wood Bundle (Shown when carrying wood) ─────────────
    const log1 = scene.add.rectangle(0, -4, 22, 6, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
    const log2 = scene.add.rectangle(1, 1, 20, 6, 0x7a4e2d).setStrokeStyle(1, 0x5a3010);
    const log3 = scene.add.rectangle(-1, 6, 22, 6, 0x8b5e3c).setStrokeStyle(1, 0x5a3010);
    // Rope tie
    const rope1 = scene.add.rectangle(-5, 1, 3, 17, 0xfbc02d);
    const rope2 = scene.add.rectangle(5, 1, 3, 17, 0xfbc02d);
    this.woodBundle = scene.add.container(0, -2, [log1, log2, log3, rope1, rope2]);
    this.woodBundle.setVisible(false);

    // ── 7. Overhead Wood Badge / Floating Indicator ───────────
    const badgeGlow = scene.add.circle(0, 0, 10, 0xffb300, 0.4);
    const badgeIcon = scene.add.text(0, 0, '🪵', { fontSize: '13px' }).setOrigin(0.5);
    this.woodBadge = scene.add.container(0, -34, [badgeGlow, badgeIcon]);
    this.woodBadge.setVisible(false);

    // Assemble the complete character
    this.sprite = scene.add.container(x, y, [
      this.shadow,
      this.legL,
      this.legR,
      this.torso,
      this.armL,
      this.armR,
      this.head,
      this.woodBundle,
      this.woodBadge,
    ]);
    this.sprite.setDepth(10);

    // Keyboard only — NO pointerdown/touch handler here.
    // Tap-to-move removed: touch must not trigger gameplay.
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up:    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  update(_time: number, delta: number): void {
    if (this._frozen) {
      this.resetLimbsToIdle();
      return;
    }

    const dt = delta / 1000;
    let vx = 0;
    let vy = 0;

    // ── 1. Keyboard ─────────────────────────────────────────
    const left  = this.cursors?.left.isDown  || this.wasd['left']?.isDown;
    const right = this.cursors?.right.isDown || this.wasd['right']?.isDown;
    const up    = this.cursors?.up.isDown    || this.wasd['up']?.isDown;
    const down  = this.cursors?.down.isDown  || this.wasd['down']?.isDown;

    if (left || right || up || down) {
      if (left)  vx = -1;
      if (right) vx =  1;
      if (up)    vy = -1;
      if (down)  vy =  1;
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    }

    // ── 2. Virtual joystick (mobile overlay) ─────────────────
    // Reads window.__jx / __jy; only when keyboard not in use.
    if (vx === 0 && vy === 0) {
      const g = window as unknown as Record<string, number>;
      const jx = g.__jx ?? 0;
      const jy = g.__jy ?? 0;
      if (Math.abs(jx) > 0.05 || Math.abs(jy) > 0.05) {
        vx = jx; vy = jy;
        const mag = Math.sqrt(vx * vx + vy * vy);
        if (mag > 1) { vx /= mag; vy /= mag; }
      }
    }

    // ── 3. Apply movement ────────────────────────────────────
    this.isMoving = (vx !== 0 || vy !== 0);
    if (this.isMoving) {
      this.sprite.x += vx * this.speed * dt;
      this.sprite.y += vy * this.speed * dt;

      // Facing direction (horizontal orientation)
      if (vx < -0.05) {
        this.sprite.setScale(-1, 1);
        this.woodBadge.setScale(-1, 1); // Keep badge facing forward
      } else if (vx > 0.05) {
        this.sprite.setScale(1, 1);
        this.woodBadge.setScale(1, 1);
      }
    }

    // ── 4. Character Animation (Walk & Idle) ──────────────────
    this.animateCharacter(delta, this.isMoving);

    // ── 5. Clamp to map bounds ────────────────────────────────
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 20, MAP_WIDTH  - 20);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 20, MAP_HEIGHT - 20);
  }

  private animateCharacter(delta: number, isMoving: boolean): void {
    const dt = delta / 1000;

    if (isMoving) {
      // Advance walk cycle (faster when not in mud)
      const walkSpeed = this.inMud ? 9 : 14;
      this.walkPhase += dt * walkSpeed;

      const legSwing = Math.sin(this.walkPhase) * 14;   // degrees of leg swing
      const armSwing = Math.cos(this.walkPhase) * 18;   // degrees of arm swing
      const bob = Math.abs(Math.sin(this.walkPhase)) * 3; // vertical body bounce

      // Alternating legs
      this.legL.setAngle(legSwing);
      this.legL.y = 4 - Math.max(0, legSwing * 0.15);
      this.legR.setAngle(-legSwing);
      this.legR.y = 4 - Math.max(0, -legSwing * 0.15);

      // Torso & Head vertical bounce
      this.torso.y = -bob;
      this.head.y = -bob * 1.2;

      // Arms: if carrying wood, hold bundle securely; otherwise swing
      if (this._carryingWood) {
        this.armL.setAngle(-45);
        this.armR.setAngle(45);
        this.woodBundle.y = -2 - bob;
      } else {
        this.armL.setAngle(-armSwing);
        this.armR.setAngle(armSwing);
      }

      // Overhead badge gentle bounce
      if (this._carryingWood) {
        this.woodBadge.y = -34 - bob + Math.sin(this.walkPhase * 2) * 2;
      }
    } else {
      // Idle animation: gentle breathing cycle
      this.idleTime += dt * 3;
      const breathe = Math.sin(this.idleTime) * 1.2;

      this.resetLimbsToIdle();
      this.torso.y = breathe * 0.5;
      this.head.y = breathe;

      if (this._carryingWood) {
        this.armL.setAngle(-35);
        this.armR.setAngle(35);
        this.woodBundle.y = -2 + breathe;
        this.woodBadge.y = -34 + Math.sin(this.idleTime) * 2;
      }
    }
  }

  private resetLimbsToIdle(): void {
    this.legL.setAngle(0);
    this.legL.y = 4;
    this.legR.setAngle(0);
    this.legR.y = 4;
    if (!this._carryingWood) {
      this.armL.setAngle(0);
      this.armR.setAngle(0);
    }
  }

  setInMud(value: boolean): void {
    this.inMud = value;
    // Mud visual feedback: subtle earthy tint on tunic hem
    this.tunicMain.setFillStyle(value ? 0x8d6e63 : 0xf5f3ea);
  }

  pickUpWood(): void {
    this._carryingWood = true;
    this.woodBundle.setVisible(true);
    this.woodBadge.setVisible(true);
    // Arm pose for carrying
    this.armL.setAngle(-40);
    this.armR.setAngle(40);
  }

  deliverWood(): void {
    this._carryingWood = false;
    this.woodBundle.setVisible(false);
    this.woodBadge.setVisible(false);
    this.resetLimbsToIdle();
  }

  freeze(): void {
    this._frozen = true;
    this.resetLimbsToIdle();
  }

  destroy(): void { this.sprite.destroy(); }
}