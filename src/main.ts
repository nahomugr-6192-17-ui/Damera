// ============================================================
// main.ts — Phaser game entry point
// Scale.RESIZE fills the full viewport on every device so the
// game is properly playable on mobile, tablet and desktop.
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

  // RESIZE: canvas always fills the full browser viewport.
  // Every scene reads this.scale.width / this.scale.height to
  // position UI so it works on any screen size.
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },

  scene: [BootScene, MainMenuScene, HowToPlayScene, LevelSelectScene, GameScene],

  render: {
    antialias:    true,
    pixelArt:     false,
    roundPixels:  false,
  },
};

new Phaser.Game(config);