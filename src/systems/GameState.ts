// ============================================================
// GameState.ts
// Tracks the current state of a gameplay session.
// ============================================================

/** All possible states the gameplay session can be in */
export enum GameStatus {
  PLAYING   = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY   = 'VICTORY',
}

/** Mutable state for one gameplay session */
export interface GameState {
  status: GameStatus;
  /** How many wood bundles have been delivered to the fire */
  woodDelivered: number;
  /** Total wood needed to win (from LevelConfig) */
  requiredWood: number;
  /** Remaining time in seconds */
  timeRemaining: number;
  /** Whether the player is currently carrying a wood bundle */
  carryingWood: boolean;
}

/** Create a fresh game state for a new level */
export function createGameState(timeSeconds: number, requiredWood: number): GameState {
  return {
    status: GameStatus.PLAYING,
    woodDelivered: 0,
    requiredWood,
    timeRemaining: timeSeconds,
    carryingWood: false,
  };
}
