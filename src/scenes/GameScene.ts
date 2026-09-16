// ============================================================
// GameScene.ts
// Main gameplay scene. Orchestrates the map, player, wood,
// fire, mud zones, HUD, timer, and end-game states.
// ============================================================

import Phaser from 'phaser';
import { Player }           from '../entities/Player';
import { Wood }             from '../entities/Wood';
import { Fire }             from '../entities/Fire';
import { Mud }              from '../entities/Mud';
import { HUD }              from '../ui/HUD';
import { GameOverOverlay }  from '../ui/GameOverOverlay';
import { VictoryOverlay }   from '../ui/VictoryOverlay';
import { GameStatus, createGameState } from '../systems/GameState';
import type { GameState } from '../systems/GameState';
import { LEVELS } from '../config/LevelConfig';
import type { DifficultyKey } from '../config/LevelConfig';
import { MAP_WIDTH, MAP_HEIGHT, WOOD_TIME_BONUS } from '../config/GameConfig';

// ── Fixed map layout data ────────────────────────────────────

const TREE_POSITIONS: { x: number; y: number; r: number }[] = [
  { x: 120,  y: 180,  r: 36 },
  { x: 260,  y: 140,  r: 32 },
  { x: 420,  y: 160,  r: 38 },
  { x: 620,  y: 130,  r: 34 },
  { x: 780,  y: 190,  r: 30 },
  { x: 880,  y: 140,  r: 36 },
  { x: 90,   y: 380,  r: 34 },
  { x: 200,  y: 480,  r: 28 },
  { x: 340,  y: 360,  r: 32 },
  { x: 500,  y: 320,  r: 38 },
  { x: 700,  y: 350,  r: 30 },
  { x: 860,  y: 380,  r: 34 },
  { x: 130,  y: 620,  r: 30 },
  { x: 310,  y: 680,  r: 36 },
  { x: 480,  y: 600,  r: 28 },
  { x: 650,  y: 640,  r: 34 },
  { x: 820,  y: 590,  r: 30 },
  { x: 920,  y: 680,  r: 28 },
  { x: 200,  y: 820,  r: 32 },
  { x: 420,  y: 840,  r: 36 },
  { x: 600,  y: 800,  r: 30 },
  { x: 780,  y: 840,  r: 34 },
  { x: 900,  y: 880,  r: 28 },
];

const WOOD_POSITIONS: { x: number; y: number }[] = [
  { x: 300,  y: 170 },
  { x: 550,  y: 200 },
  { x: 750,  y: 160 },
  { x: 850,  y: 300 },
  { x: 160,  y: 430 },
  { x: 440,  y: 400 },
  { x: 620,  y: 420 },
  { x: 800,  y: 440 },
  { x: 250,  y: 600 },
  { x: 560,  y: 560 },
  { x: 720,  y: 700 },
  { x: 350,  y: 770 },
  { x: 870,  y: 750 },
  { x: 480,  y: 880 },
  { x: 680,  y: 870 },
  { x: 100,  y: 700 },
  { x: 930,  y: 510 },
  { x: 140,  y: 290 },
];

const MUD_ZONES: { x: number; y: number; w: number; h: number }[] = [
  { x: 360, y: 280, w: 140, h: 80  },
  { x: 580, y: 480, w: 160, h: 90  },
  { x: 230, y: 540, w: 130, h: 70  },
  { x: 720, y: 580, w: 150, h: 80  },
  { x: 460, y: 730, w: 130, h: 70  },
];

// Fire position (near player start, left-centre area)
const FIRE_X = 180;
const FIRE_Y = 750;

// Player start position (near the fire)
const PLAYER_START_X = 200;
const PLAYER_START_Y = 680;

export class GameScene extends Phaser.Scene {
  // Entities
  private player!: Player;
  private woodItems: Wood[] = [];
  private fire!: Fire;
  private mudZones: Mud[] = [];

  // UI
  private hud!: HUD;
  private endOverlay: GameOverOverlay | VictoryOverlay | null = null;

  // State
  private state!: GameState;
  private levelKey!: DifficultyKey;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // ── Get selected level from registry ─────────────────────
    this.levelKey = (this.registry.get('selectedLevel') as DifficultyKey) ?? 'MEH';
    const cfg     = LEVELS[this.levelKey];

    // ── Initial game state ───────────────────────────────────
    this.state = createGameState(cfg.requiredWood, cfg.time);

    // ── World bounds for the camera ──────────────────────────
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBackgroundColor('#4caf50');

    // ── Draw tiled grass background ──────────────────────────
    this.buildBackground();

    // ── Mud zones (draw first so they appear under everything) ─
    MUD_ZONES.forEach(m => {
      this.mudZones.push(new Mud(this, m.x, m.y, m.w, m.h));
    });

    // ── Trees ─────────────────────────────────────────────────
    TREE_POSITIONS.forEach(t => this.drawTree(t.x, t.y, t.r));

    // ── Wood bundles (limited to woodCount for this level) ───
    const woodToPlace = WOOD_POSITIONS.slice(0, cfg.woodCount);
    woodToPlace.forEach(pos => {
      this.woodItems.push(new Wood(this, pos.x, pos.y));
    });

    // ── Fire / ችቦ ─────────────────────────────────────────────
    this.fire = new Fire(this, FIRE_X, FIRE_Y);

    // Draw a small cleared area around the fire
    const clearGfx = this.add.graphics();
    clearGfx.fillStyle(0xd4a762, 0.55);
    clearGfx.fillCircle(FIRE_X, FIRE_Y, 60);
    clearGfx.setDepth(1);

    // ── "ችቦ" label near the fire ──────────────────────────────
    this.add.text(FIRE_X, FIRE_Y + 56, 'ችቦ', {
      fontSize: '14px',
      fontFamily: '"Noto Sans Ethiopic", Nunito, sans-serif',
      color: '#ff8800',
      stroke: '#1a0000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(12);

    // ── Player ───────────────────────────────────────────────
    this.player = new Player(this, PLAYER_START_X, PLAYER_START_Y);

    // ── Camera follows player ─────────────────────────────────
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // ── HUD (fixed to camera) ─────────────────────────────────
    this.hud = new HUD(this, cfg.requiredWood);

    // ── Input: keyboard shortcut (Space) ────────────────────
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => {
      this.tryCollectOrDeliver();
    });

    // ── Input: pointer tap → collect or deliver ───────────────
    // The Player already moves to the tap point. After the move
    // tween starts we also check if a nearby interaction is valid.
    this.input.on('pointerdown', () => {
      this.tryCollectOrDeliver();
    });
  }

  update(time: number, delta: number): void {
    // Don't update during end-game states
    if (this.state.status !== GameStatus.PLAYING) return;

    // ── Countdown timer ──────────────────────────────────────
    this.state.timeRemaining -= delta / 1000;

    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.triggerGameOver();
      return;
    }

    // ── Mud detection ─────────────────────────────────────────
    const inMud = this.mudZones.some(m =>
      m.containsPoint(this.player.x, this.player.y)
    );
    this.player.setInMud(inMud);

    // ── Player movement ───────────────────────────────────────
    this.player.update(time, delta);

    // ── Wood proximity & auto-collect on tap ─────────────────
    if (!this.player.carryingWood) {
      for (const wood of this.woodItems) {
        if (wood.isCollected) continue;
        const inRange = wood.update(this.player.x, this.player.y);
        // Auto-collect when player walks close enough and taps
        // (The tap event fires tryCollectOrDeliver, but we also
        //  handle it here for pointer-down events near wood)
        void inRange; // interaction handled via pointer in tryCollectOrDeliver
      }
    } else {
      // Hide all prompts while carrying
      this.woodItems.forEach(w => !w.isCollected && w.update(9999, 9999));
    }

    // ── Fire proximity ────────────────────────────────────────
    this.fire.update(this.player.x, this.player.y, this.player.carryingWood);

    // ── HUD ──────────────────────────────────────────────────
    this.hud.update(this.state);
  }

  // ── Interaction logic ────────────────────────────────────────

  /** Called when the player taps OR presses Space near an object */
  tryCollectOrDeliver(): void {
    if (this.state.status !== GameStatus.PLAYING) return;

    if (!this.player.carryingWood) {
      // Try to collect a nearby wood bundle
      for (const wood of this.woodItems) {
        if (wood.isCollected) continue;
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, wood.x, wood.y
        );
        if (dist <= 48) {
          wood.collect();
          this.player.pickUpWood();
          this.state.carryingWood = true;
          break;
        }
      }
    } else {
      // Try to deliver wood to the fire
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.fire.x, this.fire.y
      );
      if (dist <= 64) {
        this.deliverWood();
      }
    }
  }

  private deliverWood(): void {
    this.player.deliverWood();
    this.state.carryingWood = false;
    this.state.woodDelivered += 1;
    this.fire.onWoodAdded();

    // Check victory condition
    if (this.state.woodDelivered >= this.state.requiredWood) {
      this.triggerVictory();
    }
  }

  // ── End-game transitions ─────────────────────────────────────

  private triggerGameOver(): void {
    this.state.status = GameStatus.GAME_OVER;
    this.player.freeze();

    // Stop all active tweens (fire flicker etc.) except UI tweens
    this.tweens.pauseAll();

    this.endOverlay = new GameOverOverlay(
      this,
      this.state.woodDelivered,
      this.state.requiredWood,
      () => this.restartLevel(),
      () => this.goMainMenu(),
    );
  }

  private triggerVictory(): void {
    this.state.status = GameStatus.VICTORY;
    this.player.freeze();

    this.endOverlay = new VictoryOverlay(
      this,
      this.fire.x,
      this.fire.y,
      () => this.restartLevel(),
      () => this.goMainMenu(),
    );
  }

  private restartLevel(): void {
    this.endOverlay?.destroy();
    this.endOverlay = null;
    this.cleanupEntities();
    this.tweens.resumeAll();
    this.scene.restart();
  }

  private goMainMenu(): void {
    this.endOverlay?.destroy();
    this.endOverlay = null;
    this.cleanupEntities();
    this.scene.start('MainMenuScene');
  }

  private cleanupEntities(): void {
    this.player?.destroy();
    this.woodItems.forEach(w => w.destroy());
    this.woodItems = [];
    this.fire?.destroy();
    this.mudZones.forEach(m => m.destroy());
    this.mudZones = [];
    this.hud?.destroy();
  }

  // ── Map building helpers ─────────────────────────────────────

  private buildBackground(): void {
    // Tile the generated grass texture across the world
    const cols = Math.ceil(MAP_WIDTH  / 64) + 1;
    const rows = Math.ceil(MAP_HEIGHT / 64) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.add.image(c * 64, r * 64, 'grass').setOrigin(0, 0).setDepth(0);
      }
    }

    // Subtle vignette border
    const vignette = this.add.graphics().setDepth(0);
    vignette.lineStyle(40, 0x1b5e20, 0.5);
    vignette.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  private drawTree(x: number, y: number, r: number): void {
    // Shadow
    this.add.ellipse(x + 6, y + r * 0.8, r * 1.6, r * 0.6, 0x000000, 0.18).setDepth(3);
    // Trunk
    this.add.rectangle(x, y + r * 0.55, r * 0.35, r * 0.9, 0x5d3a1a).setDepth(4);
    // Canopy layers
    this.add.arc(x, y, r,          0, 360, false, 0x2e7d32).setDepth(5);
    this.add.arc(x, y, r * 0.72,   0, 360, false, 0x388e3c).setDepth(5);
    this.add.arc(x, y - r * 0.18, r * 0.48, 0, 360, false, 0x43a047).setDepth(5);
    // Highlight dot
    this.add.arc(x - r * 0.25, y - r * 0.28, r * 0.14, 0, 360, false, 0x66bb6a, 0.6).setDepth(5);
  }
}
