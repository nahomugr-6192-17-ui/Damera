// ============================================================
// GameScene.ts
// ============================================================

import Phaser from "phaser";
import { Player }          from "../entities/Player";
import { Wood }            from "../entities/Wood";
import { Fire }            from "../entities/Fire";
import { Mud }             from "../entities/Mud";
import { HUD }             from "../ui/HUD";
import { GameOverOverlay } from "../ui/GameOverOverlay";
import { VictoryOverlay }  from "../ui/VictoryOverlay";
import { GameStatus, createGameState } from "../systems/GameState";
import type { GameState }  from "../systems/GameState";
import { LEVELS }          from "../config/LevelConfig";
import type { DifficultyKey } from "../config/LevelConfig";
import {
  MAP_WIDTH, MAP_HEIGHT, WOOD_TIME_BONUS,
  COLOR_TREE_TRUNK, COLOR_TREE_CANOPY,
} from "../config/GameConfig";

// ── Map data ────────────────────────────────────────────────

const TREE_POSITIONS = [
  { x: 120, y: 180 }, { x: 260, y: 140 }, { x: 400, y: 200 }, { x: 550, y: 160 }, { x: 700, y: 130 },
  { x: 850, y: 190 }, { x: 1000, y: 150 }, { x: 140, y: 420 }, { x: 320, y: 380 }, { x: 480, y: 430 },
  { x: 650, y: 390 }, { x: 820, y: 410 }, { x: 980, y: 370 }, { x: 100, y: 650 }, { x: 280, y: 620 },
  { x: 440, y: 670 }, { x: 600, y: 640 }, { x: 760, y: 680 },
];

const MUD_ZONES = [
  { x: 300, y: 580, w: 160, h: 80 }, { x: 550, y: 540, w: 140, h: 70 },
  { x: 720, y: 600, w: 180, h: 90 }, { x: 200, y: 750, w: 120, h: 65 },
  { x: 850, y: 740, w: 130, h: 75 },
];

// Normal-ground wood positions (verified > 50px from every tree and fire).
// 9 positions — enough to serve HARD's 9 normal woods (15 - 6 mud).
const NORMAL_WOOD: { x: number; y: number }[] = [
  { x: 200, y: 280 }, { x: 450, y: 270 }, { x: 630, y: 230 }, { x: 920, y: 280 },
  { x: 200, y: 510 }, { x: 430, y: 490 }, { x: 700, y: 520 }, { x: 920, y: 450 },
  { x: 500, y: 600 },
];

// Mud-zone wood positions — one per mud zone + one extra in zone 4 (index 5)
// for HARD's 6th mud wood.  Distribution:
//   EASY  (2 mud): zones 0, 1
//   MEH   (4 mud): zones 0, 1, 2, 3
//   HARD  (6 mud): zones 0, 1, 2, 3, 4 (×1), 4 (×1 extra)
const MUD_WOOD: { x: number; y: number }[] = [
  { x: 380, y: 605 },  // zone 0
  { x: 600, y: 565 },  // zone 1
  { x: 810, y: 630 },  // zone 2
  { x: 250, y: 775 },  // zone 3
  { x: 900, y: 765 },  // zone 4  (first)
  { x: 940, y: 785 },  // zone 4  (second — used only for HARD)
];

const FIRE_X = 150;
const FIRE_Y = 820;

// Tree collision radius (trunk area — smaller than visual canopy)
const TREE_COLLIDE_R = 22;
// Player collision radius (roughly PLAYER_SIZE * 0.45)
const PLAYER_R = 14;

// ── Scene ───────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private player!:    Player;
  private fire!:      Fire;
  private woodItems:  Wood[] = [];
  private mudZones:   Mud[]  = [];
  private hud!:       HUD;
  private endOverlay!: GameOverOverlay | VictoryOverlay | null;
  private state!:     GameState;
  private levelKey!:  DifficultyKey;

  // Collision bodies for trees (manual circle–circle collision)
  private treeColliders: { x: number; y: number; r: number }[] = [];

  constructor() { super({ key: "GameScene" }); }

  create(): void {
    // Safety: keyboard may have been disabled in a previous session
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    this.levelKey = (this.registry.get("selectedLevel") as DifficultyKey) ?? "EASY";
    const cfg     = LEVELS[this.levelKey];
    this.state    = createGameState(cfg.time, cfg.requiredWood);
    this.endOverlay = null;
    this.treeColliders = [];
    this.woodItems     = [];
    this.mudZones      = [];

    // Grass background
    const ts = 64;
    for (let tx = 0; tx < MAP_WIDTH; tx += ts)
      for (let ty = 0; ty < MAP_HEIGHT; ty += ts)
        this.add.image(tx + ts / 2, ty + ts / 2, "grass").setDisplaySize(ts, ts).setDepth(0);

    // Mud zones
    MUD_ZONES.forEach(({ x, y, w, h }) => this.mudZones.push(new Mud(this, x, y, w, h)));

    // Trees — visual + collision body
    TREE_POSITIONS.forEach(({ x, y }) => {
      const r = Phaser.Math.Between(28, 42);
      // Visual layers
      this.add.rectangle(x, y + r * 0.7, r * 0.38, r * 0.9, COLOR_TREE_TRUNK).setDepth(5);
      this.add.arc(x, y, r,              0, 360, false, COLOR_TREE_CANOPY).setDepth(6);
      this.add.arc(x, y, r * 0.72,      0, 360, false, 0x388e3c).setDepth(6);
      this.add.arc(x, y - r * 0.22, r * 0.48, 0, 360, false, 0x43a047).setDepth(6);
      // Collision circle (represents physical trunk/base — smaller than canopy)
      this.treeColliders.push({ x, y, r: TREE_COLLIDE_R });
    });

    // Wood positions: normal ground + mud, per difficulty
    const normalCount  = cfg.requiredWood - cfg.mudWoodCount;
    const woodPositions = [
      ...NORMAL_WOOD.slice(0, normalCount),
      ...MUD_WOOD.slice(0, cfg.mudWoodCount),
    ];
    woodPositions.forEach(({ x, y }) => this.woodItems.push(new Wood(this, x, y)));

    // Fire (ዳmeラ)
    this.fire = new Fire(this, FIRE_X, FIRE_Y);
    this.add.text(FIRE_X, FIRE_Y + 60, "\u12f3\u1218\u122b", {
      fontSize: "18px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif',
      color: "#ffee58", stroke: "#5d2a00", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9);

    // Player (starts at map centre)
    this.player = new Player(this, MAP_WIDTH / 2, MAP_HEIGHT / 2);

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // HUD
    this.hud = new HUD(this, cfg.requiredWood);

    // Input — Space / Enter = pick or deliver
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on("down", () => this.tryCollectOrDeliver());
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      .on("down", () => this.tryCollectOrDeliver());
    this.input.on("pointerdown", () => this.tryCollectOrDeliver());
  }

  update(time: number, delta: number): void {
    if (this.state.status !== GameStatus.PLAYING) return;

    // Timer
    this.state.timeRemaining -= delta / 1000;
    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.triggerGameOver();
      return;
    }

    // Mud detection
    const inMud = this.mudZones.some(m => m.containsPoint(this.player.x, this.player.y));
    this.player.setInMud(inMud);

    // Player movement
    this.player.update(time, delta);

    // Tree collision resolution (manual circle-circle push-out)
    this.resolveTreeCollisions();

    // Wood prompts
    if (!this.player.carryingWood) {
      for (const w of this.woodItems) { if (!w.isCollected) w.update(this.player.x, this.player.y); }
    } else {
      this.woodItems.forEach(w => { if (!w.isCollected) w.update(9999, 9999); });
    }

    // Auto-deliver when in fire range while carrying
    const nearFire = this.fire.update(this.player.x, this.player.y, this.player.carryingWood);
    if (nearFire && this.player.carryingWood) this.deliverWood();

    // Sync carrying state to mobile UI
    (window as unknown as Record<string, boolean>).__isCarryingWood = this.player.carryingWood;

    // Mobile action button
    const w = window as unknown as Record<string, boolean>;
    if (w.__actionPressed) {
      w.__actionPressed = false;
      this.tryCollectOrDeliver();
    }

    this.hud.update(this.state);
  }

  /** Push player out of any overlapping tree collision circles */
  private resolveTreeCollisions(): void {
    for (const tree of this.treeColliders) {
      const dx   = this.player.sprite.x - tree.x;
      const dy   = this.player.sprite.y - tree.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minD = PLAYER_R + tree.r;
      if (dist < minD && dist > 0) {
        const push = minD - dist;
        this.player.sprite.x += (dx / dist) * push;
        this.player.sprite.y += (dy / dist) * push;
      }
    }
    // Re-clamp after push-out
    this.player.sprite.x = Phaser.Math.Clamp(this.player.sprite.x, 20, MAP_WIDTH  - 20);
    this.player.sprite.y = Phaser.Math.Clamp(this.player.sprite.y, 20, MAP_HEIGHT - 20);
  }

  tryCollectOrDeliver(): void {
    if (this.state.status !== GameStatus.PLAYING) return;
    if (!this.player.carryingWood) {
      for (const w of this.woodItems) {
        if (w.isCollected) continue;
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) <= 48) {
          w.collect();
          this.player.pickUpWood();
          this.state.carryingWood = true;
          break;
        }
      }
    }
  }

  private deliverWood(): void {
    this.player.deliverWood();
    this.state.carryingWood    = false;
    this.state.woodDelivered  += 1;
    this.fire.onWoodAdded();
    this.fire.growFromWood(this.state.woodDelivered, this.state.requiredWood);
    this.state.timeRemaining  += WOOD_TIME_BONUS; // +3 s on delivery only
    if (this.state.woodDelivered >= this.state.requiredWood) this.triggerVictory();
  }

  private triggerGameOver(): void {
    this.state.status = GameStatus.GAME_OVER;
    this.player.freeze();
    this.fire.extinguish();
    this.tweens.pauseAll();
    this.endOverlay = new GameOverOverlay(this, this.state.woodDelivered, this.state.requiredWood,
      () => this.restartLevel(), () => this.goMainMenu());
  }

  private triggerVictory(): void {
    this.state.status = GameStatus.VICTORY;
    this.player.freeze();
    this.endOverlay = new VictoryOverlay(this, this.fire.x, this.fire.y,
      () => this.restartLevel(), () => this.goMainMenu());
  }

  private restartLevel(): void {
    this.hideMobileControls();
    this.endOverlay?.destroy?.();
    this.scene.restart();
  }
  private goMainMenu(): void {
    this.endOverlay?.destroy?.();
    this.scene.start("MainMenuScene");
  }
  private hideMobileControls(): void {
    const mc = document.getElementById('mobile-controls');
    if (mc) mc.style.display = 'none';
  }
}