// ============================================================
// LevelConfig.ts
// ============================================================

export type DifficultyKey = 'EASY' | 'MEH' | 'HARD';

export interface LevelConfig {
  key:          DifficultyKey;
  label:        string;
  description:  string;
  /** Time limit in seconds */
  time:         number;
  /** Number of wood bundles the player must deliver to win */
  requiredWood: number;
  /** Total wood bundles placed on the map (== requiredWood) */
  woodCount:    number;
  /** How many of those woods spawn inside mud zones */
  mudWoodCount: number;
}

export const LEVELS: Record<DifficultyKey, LevelConfig> = {
  EASY: {
    key: 'EASY',
    label: 'EASY',
    description: '60 sec • 6 woods to deliver',
    time:         60,
    requiredWood:  6,
    woodCount:     6,
    mudWoodCount:  2,
  },
  MEH: {
    key: 'MEH',
    label: 'MEH',
    description: '40 sec • 10 woods to deliver',
    time:         40,
    requiredWood: 10,
    woodCount:    10,
    mudWoodCount:  4,
  },
  HARD: {
    key: 'HARD',
    label: 'HARD',
    description: '25 sec • 15 woods to deliver',
    time:         25,
    requiredWood: 15,
    woodCount:    15,
    mudWoodCount:  6,
  },
};