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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#2e7d32",

  scale: {
    mode:       Phaser.Scale.FIT,       // scale to fit, maintain aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // always centered in viewport
    width:  960,                        // logical game width  (landscape 16:9)
    height: 540,                        // logical game height
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

new Phaser.Game(config);