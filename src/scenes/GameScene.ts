// ============================================================
// GameScene.ts — main gameplay loop
// Timer: counts DOWN. Wood delivery: +3s + fire grows.
// ============================================================
import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Wood } from "../entities/Wood";
import { Fire } from "../entities/Fire";
import { Mud } from "../entities/Mud";
import { HUD } from "../ui/HUD";
import { GameOverOverlay } from "../ui/GameOverOverlay";
import { VictoryOverlay } from "../ui/VictoryOverlay";
import { GameStatus, createGameState } from "../systems/GameState";
import type { GameState } from "../systems/GameState";
import { LEVELS } from "../config/LevelConfig";
import type { DifficultyKey } from "../config/LevelConfig";
import {
  MAP_WIDTH, MAP_HEIGHT, WOOD_TIME_BONUS,
  COLOR_TREE_TRUNK, COLOR_TREE_CANOPY,
} from "../config/GameConfig";

const TREE_POSITIONS = [
  { x: 120, y: 180 }, { x: 260, y: 140 }, { x: 400, y: 200 }, { x: 550, y: 160 }, { x: 700, y: 130 },
  { x: 850, y: 190 }, { x: 1000, y: 150 }, { x: 140, y: 420 }, { x: 320, y: 380 }, { x: 480, y: 430 },
  { x: 650, y: 390 }, { x: 820, y: 410 }, { x: 980, y: 370 }, { x: 100, y: 650 }, { x: 280, y: 620 },
  { x: 440, y: 670 }, { x: 600, y: 640 }, { x: 760, y: 680 },
];
const WOOD_POSITIONS = [
  { x: 220, y: 220 }, { x: 380, y: 170 }, { x: 540, y: 240 }, { x: 700, y: 180 }, { x: 860, y: 220 },
  { x: 180, y: 460 }, { x: 360, y: 420 }, { x: 520, y: 480 }, { x: 680, y: 430 }, { x: 840, y: 460 },
  { x: 160, y: 700 }, { x: 340, y: 660 }, { x: 500, y: 720 }, { x: 660, y: 680 }, { x: 820, y: 710 },
  { x: 980, y: 400 }, { x: 960, y: 220 }, { x: 950, y: 600 },
];
const MUD_ZONES = [
  { x: 300, y: 580, w: 160, h: 80 }, { x: 550, y: 540, w: 140, h: 70 }, { x: 720, y: 600, w: 180, h: 90 },
  { x: 200, y: 750, w: 120, h: 65 }, { x: 850, y: 740, w: 130, h: 75 },
];
const FIRE_X = 150;
const FIRE_Y = 820;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private fire!: Fire;
  private woodItems: Wood[] = [];
  private mudZones: Mud[] = [];
  private hud!: HUD;
  private endOverlay!: GameOverOverlay | VictoryOverlay | null;
  private state!: GameState;
  private levelKey!: DifficultyKey;

  constructor() { super({ key: "GameScene" }); }

  create(): void {
    this.levelKey = (this.registry.get("selectedLevel") as DifficultyKey) ?? "EASY";
    const cfg = LEVELS[this.levelKey];
    this.state = createGameState(cfg.time, cfg.requiredWood);
    this.endOverlay = null;

    // Tiled grass background
    const ts = 64;
    for (let tx = 0; tx < MAP_WIDTH; tx += ts)
      for (let ty = 0; ty < MAP_HEIGHT; ty += ts)
        this.add.image(tx + ts / 2, ty + ts / 2, "grass").setDisplaySize(ts, ts).setDepth(0);

    // Mud zones
    MUD_ZONES.forEach(({ x, y, w, h }) => this.mudZones.push(new Mud(this, x, y, w, h)));

    // Procedural trees
    TREE_POSITIONS.forEach(({ x, y }) => {
      const r = Phaser.Math.Between(28, 42);
      this.add.rectangle(x, y + r * 0.7, r * 0.38, r * 0.9, COLOR_TREE_TRUNK).setDepth(5);
      this.add.arc(x, y, r, 0, 360, false, COLOR_TREE_CANOPY).setDepth(6);
      this.add.arc(x, y, r * 0.72, 0, 360, false, 0x388e3c).setDepth(6);
      this.add.arc(x, y - r * 0.22, r * 0.48, 0, 360, false, 0x43a047).setDepth(6);
    });

    // Wood bundles
    WOOD_POSITIONS.slice(0, cfg.woodCount).forEach(({ x, y }) => this.woodItems.push(new Wood(this, x, y)));

    // Fire
    this.fire = new Fire(this, FIRE_X, FIRE_Y);
    this.add.text(FIRE_X, FIRE_Y + 60, "\u12f3\u1218\u122b", {
      fontSize: "18px", fontFamily: '"Noto Sans Ethiopic",Nunito,sans-serif',
      color: "#ffee58", stroke: "#5d2a00", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9);

    // Player
    this.player = new Player(this, MAP_WIDTH / 2, MAP_HEIGHT / 2);

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // HUD
    this.hud = new HUD(this, cfg.requiredWood);

    // Input
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on("down", () => this.tryCollectOrDeliver());
    this.input.on("pointerdown", () => this.tryCollectOrDeliver());

    // Show mobile controls only during gameplay
    this.showMobileControls();
  }

  update(time: number, delta: number): void {
    if (this.state.status !== GameStatus.PLAYING) return;

    // Timer counts DOWN each frame
    this.state.timeRemaining -= delta / 1000;
    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.triggerGameOver();
      return;
    }

    const inMud = this.mudZones.some(m => m.containsPoint(this.player.x, this.player.y));
    this.player.setInMud(inMud);
    this.player.update(time, delta);

    if (!this.player.carryingWood) {
      for (const w of this.woodItems) { if (!w.isCollected) w.update(this.player.x, this.player.y); }
    } else {
      this.woodItems.forEach(w => { if (!w.isCollected) w.update(9999, 9999); });
    }

    // Auto-deliver wood when player walks into fire range while carrying wood
    const nearFire = this.fire.update(this.player.x, this.player.y, this.player.carryingWood);
    if (nearFire && this.player.carryingWood) {
      this.deliverWood();
    }
    // Sync carrying state to mobile UI button label
    (window as unknown as Record<string, boolean>).__isCarryingWood = this.player.carryingWood;

    // Mobile action button — read one-shot press
    const w = window as unknown as Record<string, boolean>;
    if (w.__actionPressed) {
      w.__actionPressed = false;
      this.tryCollectOrDeliver();
    }

    this.hud.update(this.state);
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
    // Delivery is handled automatically in update() when player walks into fire range
  }

  private deliverWood(): void {
    this.player.deliverWood();
    this.state.carryingWood = false;
    this.state.woodDelivered += 1;

    // Fire grows based on woods delivered
    this.fire.onWoodAdded();
    this.fire.growFromWood(this.state.woodDelivered, this.state.requiredWood);

    // +3 seconds added to timer on every successful delivery
    this.state.timeRemaining += WOOD_TIME_BONUS;

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

  private restartLevel(): void { this.hideMobileControls(); this.endOverlay?.destroy?.(); this.scene.restart(); }
  private goMainMenu(): void { this.endOverlay?.destroy?.(); this.scene.start("MainMenuScene"); }
  /** Show the HTML mobile controls overlay */
  private showMobileControls(): void {
    const mc = document.getElementById('mobile-controls');
    if (!mc) return;
    // Only show on touch/small screens
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch || window.innerWidth <= 900) mc.style.display = 'block';
  }

  /** Hide the HTML mobile controls overlay */
  private hideMobileControls(): void {
    const mc = document.getElementById('mobile-controls');
    if (mc) mc.style.display = 'none';
  }

}