// ============================================================
// main.ts
// Phaser game entry point. Creates the game instance and
// registers all scenes.
// ============================================================

import Phaser from 'phaser';
import { BootScene }        from './scenes/BootScene';
import { MainMenuScene }    from './scenes/MainMenuScene';
import { HowToPlayScene }   from './scenes/HowToPlayScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene }        from './scenes/GameScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,        // WebGL if available, fallback to Canvas
  width: GAME_WIDTH,        // Logical canvas width  (480 px)
  height: GAME_HEIGHT,      // Logical canvas height (854 px — ~9:16 mobile)
  parent: 'game-container', // Mount into the div in index.html

  backgroundColor: '#2e7d32',

  // Scale to fill the screen while keeping aspect ratio
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // Physics not used for movement (we do it manually), but
  // keeping the block here makes it easy to add later.
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  // Register every scene in load order
  scene: [
    BootScene,
    MainMenuScene,
    HowToPlayScene,
    LevelSelectScene,
    GameScene,
  ],

  // Improve text rendering on high-DPI (retina) screens
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};

// Create the Phaser game — it auto-starts at BootScene
new Phaser.Game(config);
