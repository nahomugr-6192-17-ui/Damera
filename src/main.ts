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
import { BootScene }        from "./scenes/BootScene";
import { MainMenuScene }    from "./scenes/MainMenuScene";
import { HowToPlayScene }   from "./scenes/HowToPlayScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameScene }        from "./scenes/GameScene";
import { TelegramService }  from "./services/TelegramService";
import { calculateGameDimensions } from "./config/GameConfig";

// 1. Initialize Telegram Mini App features (expand, header colors, fullscreen)
const telegram = TelegramService.getInstance();
telegram.init();

// 2. Compute initial adaptive game dimensions
const initialDims = calculateGameDimensions();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#2e7d32",

  scale: {
    mode:       Phaser.Scale.EXPAND,   // Expands to fill screen, maintains aspect ratio without letterboxing
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      960,
    height:     540,
  },

  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },

  scene: [BootScene, MainMenuScene, HowToPlayScene, LevelSelectScene, GameScene],

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
  const { width, height } = calculateGameDimensions();
  console.log("[Resize] Viewport:", window.innerWidth, "x", window.innerHeight, "Target:", width, "x", height, "Current:", game.scale.width, "x", game.scale.height);
  if (game.scale.width !== width || game.scale.height !== height) {
    game.scale.resize(width, height);
  }
}

window.addEventListener("resize", handleGameResize);
window.addEventListener("orientationchange", () => {
  setTimeout(handleGameResize, 150);
});
telegram.onViewportChange(handleGameResize);