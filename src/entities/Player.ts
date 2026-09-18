// ============================================================
// Player.ts
// The farmer/player character.
// Supports tap-to-move (mobile + desktop) and keyboard movement.
// ============================================================

import Phaser from 'phaser';
import {
  PLAYER_SPEED, MUD_SPEED_MULTIPLIER, PLAYER_SIZE,
  COLOR_PLAYER_BODY, COLOR_PLAYER_SHIRT, COLOR_WOOD,
  TAP_MIN_DISTANCE, MAP_WIDTH, MAP_HEIGHT,
} from '../config/GameConfig';

export class Player {
  public sprite: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private body: Phaser.GameObjects.Arc;
  private shirt: Phaser.GameObjects.Rectangle;
  private woodIndicator: Phaser.GameObjects.Arc;

  // Movement state
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> = {};
  private targetX: number = 0;
  private targetY: number = 0;
  private isTapMoving: boolean = false;
  private inMud: boolean = false;
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

    // ── Build visual from simple shapes ─────────────────────
    // Head (circle)
    this.body = scene.add.arc(0, -PLAYER_SIZE * 0.6, PLAYER_SIZE * 0.45, 0, 360, false, COLOR_PLAYER_BODY);

    // Shirt/body (rectangle)
    this.shirt = scene.add.rectangle(0, 0, PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.75, COLOR_PLAYER_SHIRT);

    // Wood bundle indicator shown when carrying (small brown circle above head)
    this.woodIndicator = scene.add.arc(0, -PLAYER_SIZE * 1.3, 8, 0, 360, false, COLOR_WOOD);
    this.woodIndicator.setVisible(false);

    // Group everything into a container
    this.sprite = scene.add.container(x, y, [this.shirt, this.body, this.woodIndicator]);
    this.sprite.setDepth(10);

    this.targetX = x;
    this.targetY = y;

    // ── Keyboard input ───────────────────────────────────────
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up:    scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left:  scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // ── Tap / click to move ──────────────────────────────────
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Convert screen pointer to world coordinates
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

  /** Call this every frame from GameScene.update() */
  update(_time: number, delta: number): void {
    const dt = delta / 1000; // convert ms → seconds
    let vx = 0;
    let vy = 0;

    // ── Keyboard overrides tap-move ──────────────────────────
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

      // Normalise diagonal
      if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
      }

      this.sprite.x += vx * this.speed * dt;
      this.sprite.y += vy * this.speed * dt;
    }

    // ── Tap-to-move ──────────────────────────────────────────
    if (this.isTapMoving) {
      const dx = this.targetX - this.sprite.x;
      const dy = this.targetY - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        this.isTapMoving = false;
      } else {
        const step = this.speed * dt;
        const ratio = Math.min(step / dist, 1);
        this.sprite.x += dx * ratio;
        this.sprite.y += dy * ratio;
      }
    }

    // ── Clamp to map bounds ──────────────────────────────────
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 20, MAP_WIDTH  - 20);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 20, MAP_HEIGHT - 20);
  }

  /** Call when player enters a mud zone */
  setInMud(value: boolean): void {
    this.inMud = value;
    // Tint body slightly brown to signal mud
    this.shirt.setFillStyle(value ? 0x8b6914 : COLOR_PLAYER_SHIRT);
  }

  /** Pick up a wood bundle */
  pickUpWood(): void {
    this._carryingWood = true;
    this.woodIndicator.setVisible(true);
  }

  /** Drop / deliver the wood bundle */
  deliverWood(): void {
    this._carryingWood = false;
    this.woodIndicator.setVisible(false);
  }

  /** Stop all movement (used on game-over / victory) */
  freeze(): void {
    this.isTapMoving = false;
    this._frozen = true;
    // NOTE: do NOT touch scene.input.keyboard.enabled here — that is a
    // global flag that persists across scene restarts and breaks the
    // keyboard on subsequent playthroughs (especially on Hard level).
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
