// ============================================================
// GameScene.ts
// INPUT DESIGN:
//   Movement  : keyboard (WASD/arrows) + virtual joystick
//   Collect   : SPACE or ENTER (when near wood, not carrying)
//   Deliver   : SPACE or ENTER (when carrying + near fire)
//   Mobile    : PICK/DROP button  (same smart-action)
//
//   NO general pointerdown/touch → gameplay action.
//   NO automatic delivery on proximity.
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
  FIRE_DELIVER_RADIUS, WOOD_COLLECT_RADIUS,
} from "../config/GameConfig";

// ── Map data ─────────────────────────────────────────────────

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

const NORMAL_WOOD: { x: number; y: number }[] = [
  { x: 200, y: 280 }, { x: 450, y: 270 }, { x: 630, y: 230 }, { x: 920, y: 280 },
  { x: 200, y: 510 }, { x: 430, y: 490 }, { x: 700, y: 520 }, { x: 920, y: 450 },
  { x: 500, y: 600 },
];

const MUD_WOOD: { x: number; y: number }[] = [
  { x: 380, y: 605 },  // zone 0
  { x: 600, y: 565 },  // zone 1
  { x: 810, y: 630 },  // zone 2
  { x: 250, y: 775 },  // zone 3
  { x: 900, y: 765 },  // zone 4 first
  { x: 940, y: 785 },  // zone 4 second (HARD only)
];

const FIRE_X = 150;
const FIRE_Y = 820;

const TREE_COLLIDE_R = 22;
const PLAYER_R = 14;

// ── Scene ────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private fire!: Fire;
  private woodItems: Wood[] = [];
  private mudZones: Mud[] = [];
  private hud!: HUD;
  private endOverlay!: GameOverOverlay | VictoryOverlay | null;
  private state!: GameState;
  private levelKey!: DifficultyKey;
  private treeColliders: { x: number; y: number; r: number }[] = [];
  private lastCountdownSecond: number = -1;
  private gameOverVoiceTimer?: Phaser.Time.TimerEvent;

  constructor() { super({ key: "GameScene" }); }

  create(): void {
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    this.levelKey = (this.registry.get("selectedLevel") as DifficultyKey) ?? "EASY";
    const cfg = LEVELS[this.levelKey];
    this.state = createGameState(cfg.time, cfg.requiredWood);
    this.endOverlay = null;
    this.lastCountdownSecond = -1;
    this.stopAudioAndTimers();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopAudioAndTimers());
    this.treeColliders = [];
    this.woodItems = [];
    this.mudZones = [];

    // Grass
    const ts = 64;
    for (let tx = 0; tx < MAP_WIDTH; tx += ts)
      for (let ty = 0; ty < MAP_HEIGHT; ty += ts)
        this.add.image(tx + ts / 2, ty + ts / 2, "grass").setDisplaySize(ts, ts).setDepth(0);

    // Mud
    MUD_ZONES.forEach(({ x, y, w, h }) => this.mudZones.push(new Mud(this, x, y, w, h)));

    // Trees + collision bodies
    TREE_POSITIONS.forEach(({ x, y }, index) => {
      const r = 34 + (index % 4) * 3; // Deterministic natural size variation

      // 1. Soft tree base shadow
      this.add.ellipse(x, y + r * 0.95, r * 1.5, r * 0.55, 0x000000, 0.22).setDepth(4);

      // 2. Trunk with root flare and branches
      const trunkColor = (index % 2 === 0) ? 0x4e3014 : 0x5d3a1a;
      // Main trunk
      const trunk = this.add.rectangle(x, y + r * 0.55, r * 0.32, r * 0.95, trunkColor).setDepth(5);
      // Left and right root flares
      this.add.triangle(x - r * 0.16, y + r * 0.95, x - r * 0.32, y + r * 1.0, x - r * 0.16, y + r * 0.75, x - r * 0.16, y + r * 1.0, trunkColor).setDepth(5);
      this.add.triangle(x + r * 0.16, y + r * 0.95, x + r * 0.32, y + r * 1.0, x + r * 0.16, y + r * 0.75, x + r * 0.16, y + r * 1.0, trunkColor).setDepth(5);
      // Bark streak
      this.add.rectangle(x - 2, y + r * 0.55, 2, r * 0.7, 0x36200c).setDepth(5);

      // 3. Layered Foliage Clusters inside a Container for gentle breeze animation
      const foliageGroup = this.add.container(x, y);
      foliageGroup.setDepth(6);

      // Palette variations between trees (some vibrant spring green, some deep forest)
      const isLush = index % 3 === 0;
      const cShadow = isLush ? 0x1b5e20 : 0x205224;
      const cMid = isLush ? 0x2e7d32 : 0x2e7333;
      const cLight = isLush ? 0x388e3c : 0x3d8c42;
      const cSun = isLush ? 0x43a047 : 0x4caf50;
      const cTopGleam = isLush ? 0x66bb6a : 0x81c784;

      // Bottom back shadow canopy
      const clusterBackL = this.add.circle(-r * 0.42, r * 0.15, r * 0.52, cShadow);
      const clusterBackR = this.add.circle(r * 0.42, r * 0.15, r * 0.52, cShadow);
      // Main body dome
      const clusterBody = this.add.circle(0, 0, r * 0.75, cMid);
      // Sunlit front clusters
      const clusterFrontL = this.add.circle(-r * 0.28, -r * 0.12, r * 0.55, cLight);
      const clusterFrontR = this.add.circle(r * 0.28, -r * 0.10, r * 0.50, cLight);
      // Upper crown & sunlight specular
      const clusterCrown = this.add.circle(0, -r * 0.35, r * 0.52, cSun);
      const clusterHighlight = this.add.circle(-r * 0.15, -r * 0.45, r * 0.28, cTopGleam);

      foliageGroup.add([
        clusterBackL, clusterBackR, clusterBody,
        clusterFrontL, clusterFrontR, clusterCrown, clusterHighlight
      ]);

      // Subtle breeze swaying tween with staggered duration
      this.tweens.add({
        targets: foliageGroup,
        angle: { from: -1.2, to: 1.2 },
        scaleY: { from: 1, to: 0.985 },
        duration: 2600 + (index % 5) * 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: (index * 140) % 1000,
      });

      this.treeColliders.push({ x, y, r: TREE_COLLIDE_R });
    });

    // Decorative Adey Abeba wildflower patches (sparse, in open glades)
    const DECOR_FLOWERS = [
      { x: 300, y: 150 }, { x: 780, y: 260 }, { x: 180, y: 340 },
      { x: 520, y: 350 }, { x: 860, y: 340 }, { x: 340, y: 720 }, { x: 670, y: 750 },
    ];
    DECOR_FLOWERS.forEach(({ x, y }) => {
      // 3 tiny flowers grouped
      for (let f = 0; f < 3; f++) {
        const fx = x + (f === 0 ? 0 : f === 1 ? -6 : 7);
        const fy = y + (f === 0 ? -4 : 4);
        this.add.circle(fx, fy, 3.2, 0xffeb3b).setDepth(1);
        this.add.circle(fx, fy, 1.4, 0xff6f00).setDepth(1);
      }
    });

    // Wood bundles (normal ground + mud, per difficulty)
    const normalCount = cfg.requiredWood - cfg.mudWoodCount;
    const woodPositions = [
      ...NORMAL_WOOD.slice(0, normalCount),
      ...MUD_WOOD.slice(0, cfg.mudWoodCount),
    ];
    woodPositions.forEach(({ x, y }) => this.woodItems.push(new Wood(this, x, y)));

    // Fire
    this.fire = new Fire(this, FIRE_X, FIRE_Y);

    // Decorative Ethiopian title plaque for ደመራ
    const dameraPlacard = this.add.container(FIRE_X, FIRE_Y + 62).setDepth(9);
    const placardGfx = this.add.graphics();
    placardGfx.fillStyle(0x1a0f05, 0.88);
    placardGfx.fillRoundedRect(-42, -14, 84, 28, 6);
    placardGfx.lineStyle(1.5, 0xffb300, 0.9);
    placardGfx.strokeRoundedRect(-42, -14, 84, 28, 6);
    const placardTxt = this.add.text(0, 0, "ደመራ", {
      fontSize: "17px",
      fontFamily: '"Noto Sans Ethiopic", "Fredoka One", Nunito, sans-serif',
      color: "#ffee58",
      fontStyle: "bold",
    }).setOrigin(0.5);
    dameraPlacard.add([placardGfx, placardTxt]);

    // Player
    this.player = new Player(this, MAP_WIDTH / 2, MAP_HEIGHT / 2);

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // HUD
    this.hud = new HUD(this, cfg.requiredWood);

    // ── Keyboard action keys ──────────────────────────────────
    // SPACE = collect wood (when not carrying + near wood)
    // ENTER = deliver wood (when carrying + near fire)
    // Both also do the smart-action in the other case:
    //   - If carrying and SPACE: tries delivery
    //   - If not carrying and ENTER: tries collect
    // This unified handleAction() keeps the UX simple.
    const actionHandler = () => this.handleAction();
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on("down", actionHandler);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on("down", actionHandler);

    // NO general this.input.on("pointerdown", ...) — touch must NOT trigger actions.
    // The joystick uses its own touchmove/touchend listeners in index.html.
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

    // Countdown warning sound — final 10 seconds (10 down to 1)
    if (this.state.timeRemaining <= 10 && this.state.timeRemaining > 0) {
      const currentSec = Math.ceil(this.state.timeRemaining);
      if (this.lastCountdownSecond !== currentSec) {
        this.lastCountdownSecond = currentSec;
        if (this.cache.audio.has("countdown_tick")) {
          this.sound.play("countdown_tick", { volume: 0.75 });
        }
      }
    } else {
      this.lastCountdownSecond = -1;
    }

    // Mud slowdown
    const inMud = this.mudZones.some(m => m.containsPoint(this.player.x, this.player.y));
    this.player.setInMud(inMud);

    // Movement
    this.player.update(time, delta);

    // Tree collision
    this.resolveTreeCollisions();

    // Wood proximity prompts (no auto-collect)
    if (!this.player.carryingWood) {
      for (const w of this.woodItems) { if (!w.isCollected) w.update(this.player.x, this.player.y); }
    } else {
      this.woodItems.forEach(w => { if (!w.isCollected) w.update(9999, 9999); });
    }

    // Fire visual update — shows "press ENTER/DROP" prompt when in range.
    // NOT used for automatic delivery — delivery is only via handleAction().
    this.fire.update(this.player.x, this.player.y, this.player.carryingWood);

    // Sync carrying state to mobile UI button label
    (window as unknown as Record<string, boolean>).__isCarryingWood = this.player.carryingWood;

    // Mobile PICK/DROP button — explicit player action, same as keyboard
    const w = window as unknown as Record<string, boolean>;
    if (w.__actionPressed) {
      w.__actionPressed = false;
      this.handleAction();
    }

    this.hud.update(this.state);
  }

  /**
   * Unified explicit action:
   *   NOT carrying → try collect nearest wood in range
   *   Carrying     → try deliver to fire ONLY if within FIRE_DELIVER_RADIUS
   *
   * Called by: SPACE key, ENTER key, mobile PICK/DROP button.
   * Never called by proximity alone.
   */
  private handleAction(): void {
    if (this.state.status !== GameStatus.PLAYING) return;

    if (!this.player.carryingWood) {
      // ── Collect: find nearest wood in range ─────────────────
      for (const w of this.woodItems) {
        if (w.isCollected) continue;
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y) <= WOOD_COLLECT_RADIUS) {
          w.collect();
          this.player.pickUpWood();
          this.state.carryingWood = true;
          if (this.cache.audio.has("pickup_hoy")) {
            this.sound.play("pickup_hoy", { volume: 0.85 });
          }
          break;
        }
      }
    } else {
      // ── Deliver: only if close enough to fire ───────────────
      const distToFire = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this.fire.x, this.fire.y
      );
      if (distToFire <= FIRE_DELIVER_RADIUS) {
        this.deliverWood();
      }
      // If too far from fire: player keeps carrying — no action.
    }
  }

  private resolveTreeCollisions(): void {
    for (const tree of this.treeColliders) {
      const dx = this.player.sprite.x - tree.x;
      const dy = this.player.sprite.y - tree.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minD = PLAYER_R + tree.r;
      if (dist < minD && dist > 0) {
        const push = minD - dist;
        this.player.sprite.x += (dx / dist) * push;
        this.player.sprite.y += (dy / dist) * push;
      }
    }
    this.player.sprite.x = Phaser.Math.Clamp(this.player.sprite.x, 20, MAP_WIDTH - 20);
    this.player.sprite.y = Phaser.Math.Clamp(this.player.sprite.y, 20, MAP_HEIGHT - 20);
  }

  private deliverWood(): void {
    this.player.deliverWood();
    this.state.carryingWood = false;
    this.state.woodDelivered += 1;
    this.fire.onWoodAdded();
    if (this.cache.audio.has("fire_whoosh")) {
      this.sound.play("fire_whoosh", { volume: 0.65 });
    }
    this.fire.growFromWood(this.state.woodDelivered, this.state.requiredWood);
    this.state.timeRemaining += WOOD_TIME_BONUS;   // +8 s on successful delivery only
    if (this.state.woodDelivered >= this.state.requiredWood) this.triggerVictory();
  }

  private triggerGameOver(): void {
    this.state.status = GameStatus.GAME_OVER;
    this.lastCountdownSecond = -1;
    this.sound.stopByKey("countdown_tick");
    this.player.freeze();
    this.fire.extinguish();
    this.tweens.pauseAll();

    // 1. Play fire extinguishing sound ('TUSH! / PSSSH!')
    if (this.cache.audio.has("fire_extinguish")) {
      this.sound.play("fire_extinguish", { volume: 0.85 });
    }

    // 2. Play Amharic voice line immediately after extinguishing sound finishes (~880ms)
    this.gameOverVoiceTimer = this.time.delayedCall(880, () => {
      if (this.state.status === GameStatus.GAME_OVER && this.cache.audio.has("gameover_amharic")) {
        this.sound.play("gameover_amharic", { volume: 0.95 });
      }
    });

    this.endOverlay = new GameOverOverlay(this, this.state.woodDelivered, this.state.requiredWood,
      () => this.restartLevel(), () => this.goMainMenu());
  }

  private triggerVictory(): void {
    this.state.status = GameStatus.VICTORY;
    this.lastCountdownSecond = -1;
    this.sound.stopByKey("countdown_tick");
    this.player.freeze();

    // Play authentic Ethiopian group ululation ('እልልልልል!')
    if (this.cache.audio.has("victory_ululation")) {
      this.sound.play("victory_ululation", { volume: 0.90 });
    }

    this.endOverlay = new VictoryOverlay(this, this.fire.x, this.fire.y,
      () => this.restartLevel(), () => this.goMainMenu());
  }

  private stopAudioAndTimers(): void {
    this.lastCountdownSecond = -1;
    this.gameOverVoiceTimer?.destroy();
    this.gameOverVoiceTimer = undefined;
    if (this.sound) {
      this.sound.stopByKey("countdown_tick");
      this.sound.stopByKey("fire_extinguish");
      this.sound.stopByKey("gameover_amharic");
      this.sound.stopByKey("victory_ululation");
    }
  }

  private restartLevel(): void {
    this.stopAudioAndTimers();
    this.hideMobileControls();
    this.endOverlay?.destroy?.();
    this.scene.restart();
  }
  private goMainMenu(): void {
    this.stopAudioAndTimers();
    this.endOverlay?.destroy?.();
    this.scene.start("MainMenuScene");
  }
  private hideMobileControls(): void {
    const mc = document.getElementById('mobile-controls');
    if (mc) mc.style.display = 'none';
  }
}