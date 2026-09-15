// ============================================================
// GameConfig.ts
// Global game constants shared across all scenes and entities.
// Tune these values to adjust feel without searching everywhere.
// ============================================================

/** Phaser canvas logical width (scales to fit screen) */
export const GAME_WIDTH = 480;

/** Phaser canvas logical height */
export const GAME_HEIGHT = 854;

/** Map world width in pixels (larger than canvas → camera scrolls) */
export const MAP_WIDTH = 960;

/** Map world height in pixels */
export const MAP_HEIGHT = 960;

// ── Player ──────────────────────────────────────────────────
/** Normal movement speed (pixels per second) */
export const PLAYER_SPEED = 160;

/** Speed multiplier while walking through mud (0–1) */
export const MUD_SPEED_MULTIPLIER = 0.45;

// ── Interaction radii ────────────────────────────────────────
/** Distance (px) at which a "Collect" prompt appears near wood */
export const WOOD_COLLECT_RADIUS = 48;

/** Distance (px) at which "Add Wood" prompt appears near fire */
export const FIRE_DELIVER_RADIUS = 64;

// ── Tap-to-move ──────────────────────────────────────────────
/** Minimum pixel distance from player before starting a move */
export const TAP_MIN_DISTANCE = 10;

// ── Visual sizes ─────────────────────────────────────────────
export const PLAYER_SIZE = 28;
export const WOOD_SIZE = 22;
export const FIRE_RADIUS = 36;
export const TREE_RADIUS = 32;
export const MUD_ALPHA = 0.55;

// ── Colours ──────────────────────────────────────────────────
export const COLOR_GRASS_DARK  = 0x3a7d3a;
export const COLOR_GRASS_LIGHT = 0x4caf50;
export const COLOR_MUD         = 0x7b5c2e;
export const COLOR_FIRE_CORE   = 0xff6b00;
export const COLOR_FIRE_OUTER  = 0xff3300;
export const COLOR_WOOD        = 0x8b5e3c;
export const COLOR_PLAYER_BODY = 0xf4a261;
export const COLOR_PLAYER_SHIRT= 0x2196f3;
export const COLOR_TREE_TRUNK  = 0x5d3a1a;
export const COLOR_TREE_CANOPY = 0x2e7d32;
