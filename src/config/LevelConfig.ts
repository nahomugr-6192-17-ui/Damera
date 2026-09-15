// ============================================================
// LevelConfig.ts
// Central configuration for all difficulty levels.
// Change values here to adjust difficulty without touching
// game logic files.
// ============================================================

export type DifficultyKey = 'EASY' | 'MEH' | 'HARD';

export interface LevelConfig {
  key: DifficultyKey;
  label: string;
  description: string;
  /** Time limit in seconds */
  time: number;
  /** Number of wood bundles the player must deliver to win */
  requiredWood: number;
  /** Total wood bundles placed on the map */
  woodCount: number;
}

export const LEVELS: Record<DifficultyKey, LevelConfig> = {
  EASY: {
    key: 'EASY',
    label: 'EASY',
    description: 'More time (1 min), fewer woods (6 woods)',
    time: 60,
    requiredWood: 6,
    woodCount: 8,
  },
  MEH: {
    key: 'MEH',
    label: 'MEH',
    description: 'Balanced challenge (40 sec, 10 woods)',
    time: 40,
    requiredWood: 10,
    woodCount: 13,
  },
  HARD: {
    key: 'HARD',
    label: 'HARD',
    description: 'Less time, more woods (25 sec, 15 woods)',
    time: 25,
    requiredWood: 15,
    woodCount: 18,
  },
};
