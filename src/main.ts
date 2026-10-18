// ============================================================
// main.ts — Phaser game entry point
//
// SCALING STRATEGY (one authoritative system):
//   Phaser.Scale.FIT + autoCenter: CENTER_BOTH
//   Fixed logical resolution: 960 × 540 (16:9 landscape)
//
//   Phaser scales the canvas to fit the physical viewport while
//   maintaining the aspect ratio and centering automatically.
//   All scenes use 960 × 540 as their coordinate space — no
//   resize events needed, no CSS fighting the scale manager.
// ============================================================

import Phaser from "phaser";
import { BootScene }         from "./scenes/BootScene";
import { SplashScreenScene } from "./scenes/SplashScreenScene";
import { MainMenuScene }     from "./scenes/MainMenuScene";
import { HowToPlayScene }    from "./scenes/HowToPlayScene";
import { LevelSelectScene }  from "./scenes/LevelSelectScene";
import { GameScene }         from "./scenes/GameScene";
import { TelegramService }   from "./services/TelegramService";
import { AnalyticsService }  from "./services/AnalyticsService";
import { calculateGameDimensions } from "./config/GameConfig";

// 1. Initialize Telegram Mini App features (expand, header colors, fullscreen)
const telegram = TelegramService.getInstance();
telegram.init();

// 2. Initialize in-game telemetry & lifecycle analytics
const analytics = AnalyticsService.getInstance();
analytics.init();

// 2. Compute initial adaptive game dimensions
const initialDims = calculateGameDimensions();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#1b5e20",

  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      initialDims.width,
    height:     initialDims.height,
  },

  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },

  scene: [BootScene, SplashScreenScene, MainMenuScene, HowToPlayScene, LevelSelectScene, GameScene],

  render: {
    antialias:   true,
    pixelArt:    false,
    roundPixels: false,
  },
};

const game = new Phaser.Game(config);
(window as any).__game = game;

// 3. Responsive scaling handler for viewport changes, phone rotation, and Telegram events
function handleGameResize(): void {
  if (!game || !game.scale) return;
  const { width, height } = calculateGameDimensions();
  if (game.scale.gameSize.width !== width || game.scale.gameSize.height !== height) {
    game.scale.setGameSize(width, height);
  }
  game.scale.refresh();
}

// Multi-stage scheduled recalculation handling asynchronous mobile orientation reflows
function scheduleGameResize(): void {
  handleGameResize();
  requestAnimationFrame(handleGameResize);
  setTimeout(handleGameResize, 100);
  setTimeout(handleGameResize, 250);
  setTimeout(handleGameResize, 450);
  setTimeout(handleGameResize, 700);
}

window.addEventListener("resize", scheduleGameResize);
window.addEventListener("orientationchange", scheduleGameResize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", scheduleGameResize);
}
if (window.screen?.orientation) {
  window.screen.orientation.addEventListener("change", scheduleGameResize);
}
telegram.onViewportChange(scheduleGameResize);