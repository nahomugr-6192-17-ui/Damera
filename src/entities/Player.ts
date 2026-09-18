// ============================================================
// Player.ts
// The farmer/player character.
// Movement pipeline (in priority order):
//   1. Keyboard (WASD / arrow keys)
//   2. Virtual joystick (window.__jx / __jy — mobile overlay)
//   3. Tap-to-move (click/tap on ground)
// ============================================================

import Phaser from 'phaser';
import {
  PLAYER_SPEED, MUD_SPEED_MULTIPLIER, PLAYER_SIZE,
  COLOR_PLAYER_BODY, COLOR_PLAYER_SHIRT, COLOR_WOOD,
  TAP_MIN_DISTANCE, MAP_WIDTH, MAP_HEIGHT,
} from '../config/GameConfig';

export class Player {
  public sprite: Phaser.GameObjects.Container;
  private scene:          Phaser.Scene;
  private body:           Phaser.GameObjects.Arc;
  private shirt:          Phaser.GameObjects.Rectangle;
  private woodIndicator:  Phaser.GameObjects.Arc;

  // Movement state
  private cursors:     Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd:        Record<string, Phaser.Input.Keyboard.Key> = {};
  private targetX:     number  = 0;
  private targetY:     number  = 0;
  private isTapMoving: boolean = false;
  private inMud:       boolean = false;
  private _carryingWood: boolean = false;
  private _frozen:       boolean = false;

  /** Current effective speed (may be reduced by mud) */
  get speed(): number {
    return this.inMud ? PLAYER_SPEED * MUD_SPEED_MULTIPLIER : PLAYER_SPEED;
  }
  get carryingWood(): boolean { return this._carryingWood; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Head
    this.body = scene.add.arc(0, -PLAYER_SIZE * 0.6, PLAYER_SIZE * 0.45, 0, 360, false, COLOR_PLAYER_BODY);
    // Shirt/body
    this.shirt = scene.add.rectangle(0, 0, PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.75, COLOR_PLAYER_SHIRT);
    // Wood indicator
    this.woodIndicator = scene.add.arc(0, -PLAYER_SIZE * 1.3, 8, 0, 360, false, COLOR_WOOD);
    this.woodIndicator.setVisible(false);

    this.sprite = scene.add.container(x, y, [this.shirt, this.body, this.woodIndicator]);
    this.sprite.setDepth(10);

    this.targetX = x;
    this.targetY = y;

    // Keyboard
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up:    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Tap / click to move
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, worldX, worldY);
      if (dist > TAP_MIN_DISTANCE) {
        this.targetX = worldX;
        this.targetY = worldY;
        this.isTapMoving = true;
      }
    });
  }

  /** Call every frame from GameScene.update() */
  update(_time: number, delta: number): void {
    // Frozen: no movement at all (game-over / victory)
    if (this._frozen) return;

    const dt = delta / 1000;
    let vx = 0;
    let vy = 0;

    // ── 1. Keyboard input ────────────────────────────────────
    const left  = this.cursors?.left.isDown  || this.wasd['left']?.isDown;
    const right = this.cursors?.right.isDown || this.wasd['right']?.isDown;
    const up    = this.cursors?.up.isDown    || this.wasd['up']?.isDown;
    const down  = this.cursors?.down.isDown  || this.wasd['down']?.isDown;

    if (left || right || up || down) {
      this.isTapMoving = false;
      if (left)  vx = -1;
      if (right) vx =  1;
      if (up)    vy = -1;
      if (down)  vy =  1;
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    }

    // ── 2. Virtual joystick (mobile HTML overlay) ─────────────
    // Reads window.__jx / __jy (set by touchmove handler in index.html).
    // Only activates when keyboard is not in use — avoids fighting.
    if (vx === 0 && vy === 0) {
      const globals = window as unknown as Record<string, number>;
      const jx = globals.__jx ?? 0;
      const jy = globals.__jy ?? 0;
      if (Math.abs(jx) > 0.05 || Math.abs(jy) > 0.05) {
        this.isTapMoving = false;
        vx = jx;
        vy = jy;
        // Clamp magnitude to 1 (diagonal can exceed 1 in raw joystick output)
        const mag = Math.sqrt(vx * vx + vy * vy);
        if (mag > 1) { vx /= mag; vy /= mag; }
      }
    }

    // ── 3. Apply directional movement (keyboard or joystick) ──
    if (vx !== 0 || vy !== 0) {
      this.sprite.x += vx * this.speed * dt;
      this.sprite.y += vy * this.speed * dt;
    }

    // ── 4. Tap-to-move (fallback when no joystick/keyboard) ───
    if (this.isTapMoving && vx === 0 && vy === 0) {
      const dx = this.targetX - this.sprite.x;
      const dy = this.targetY - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        this.isTapMoving = false;
      } else {
        const step  = this.speed * dt;
        const ratio = Math.min(step / dist, 1);
        this.sprite.x += dx * ratio;
        this.sprite.y += dy * ratio;
      }
    }

    // ── 5. Clamp to map bounds ────────────────────────────────
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 20, MAP_WIDTH  - 20);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 20, MAP_HEIGHT - 20);
  }

  setInMud(value: boolean): void {
    this.inMud = value;
    this.shirt.setFillStyle(value ? 0x8b6914 : COLOR_PLAYER_SHIRT);
  }

  pickUpWood():  void { this._carryingWood = true;  this.woodIndicator.setVisible(true);  }
  deliverWood(): void { this._carryingWood = false; this.woodIndicator.setVisible(false); }

  /** Stop all movement (game-over / victory). Does NOT touch keyboard.enabled. */
  freeze(): void {
    this.isTapMoving = false;
    this._frozen     = true;
  }

  destroy(): void { this.sprite.destroy(); }
}