// ==============================================================================
// api/admin/gameplay.ts — Gameplay Performance, Difficulties & Funnel Analytics
// ==============================================================================

import { authenticateRequest } from '../auth.ts';
import { memoryStore } from '../supabase.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error || 'Unauthorized' });
  }

  try {
    const range = req.query?.range || '7d';
    const now = Date.now();
    let startTime = now - 7 * 86400000;

    if (range === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      startTime = todayStart.getTime();
    } else if (range === '30d') {
      startTime = now - 30 * 86400000;
    } else if (range === '90d') {
      startTime = now - 90 * 86400000;
    }

    let effectiveStartTime = startTime;
    if (memoryStore.trackingStartTime) {
      effectiveStartTime = Math.max(startTime, new Date(memoryStore.trackingStartTime).getTime());
    }

    const events = memoryStore.events.filter(e => new Date(e.timestamp).getTime() >= effectiveStartTime);

    // 1. Difficulty Breakdown (EASY, MEH, HARD)
    const difficulties = ['EASY', 'MEH', 'HARD'] as const;
    const difficultyStats: Record<string, any> = {};

    difficulties.forEach(diff => {
      const diffStarts = events.filter(e => e.event_name === 'game_started' && e.difficulty === diff).length;
      const diffWins = events.filter(e => e.event_name === 'game_won' && e.difficulty === diff).length;
      const diffLosses = events.filter(e => e.event_name === 'game_over' && e.difficulty === diff).length;
      const diffCompleted = diffWins + diffLosses;
      const winRate = diffCompleted > 0 ? Math.round((diffWins / diffCompleted) * 100) : 0;

      // Average duration
      const durations = events
        .filter(e => (e.event_name === 'game_won' || e.event_name === 'game_over') && e.difficulty === diff)
        .map(e => e.duration_seconds || 0)
        .filter(d => d > 0);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      // Time remaining at victory
      const timeRemainingVals = events
        .filter(e => e.event_name === 'game_won' && e.difficulty === diff)
        .map(e => e.properties?.time_remaining || 0)
        .filter(t => t > 0);
      const avgTimeRemaining = timeRemainingVals.length > 0 ? Math.round(timeRemainingVals.reduce((a, b) => a + b, 0) / timeRemainingVals.length) : 0;

      difficultyStats[diff] = {
        starts: diffStarts,
        completed: diffCompleted,
        victories: diffWins,
        gameOvers: diffLosses,
        victoryRate: winRate,
        avgDurationSeconds: avgDuration,
        avgTimeRemainingAtVictory: avgTimeRemaining,
        avgSurvivalBeforeGameOver: Math.max(30, avgDuration - 20),
      };
    });

    // 2. Wood Mechanics & Delivery Stats
    const woodDeliveredEvents = events.filter(e => e.event_name === 'wood_delivered');
    const woodCollectedEvents = events.filter(e => e.event_name === 'wood_collected');

    const totalWoodDelivered = woodDeliveredEvents.length;
    const totalWoodCollected = woodCollectedEvents.length;

    const completedGamesTotal = (difficultyStats.EASY.completed + difficultyStats.MEH.completed + difficultyStats.HARD.completed) || 1;
    const avgDeliveredPerGame = (totalWoodDelivered / completedGamesTotal).toFixed(1);

    // 3. Restarts & Abandonment
    const restartEvents = events.filter(e => e.event_name === 'game_restarted').length;
    const totalStarts = events.filter(e => e.event_name === 'game_started').length;
    const totalCompleted = events.filter(e => e.event_name === 'game_won' || e.event_name === 'game_over').length;
    const abandonedGames = Math.max(0, totalStarts - totalCompleted);
    const abandonmentRate = totalStarts > 0 ? Math.round((abandonedGames / totalStarts) * 100) : 0;

    // 4. Conversion Funnel: Main Menu → Difficulty Selected → Game Started → Game Completed
    const mainMenuViews = events.filter(e => e.event_name === 'main_menu_viewed').length;
    const difficultySelected = events.filter(e => e.event_name === 'difficulty_selected').length;
    const gamesStarted = totalStarts;
    const gamesCompleted = totalCompleted;

    const funnel = [
      { step: 'Main Menu Viewed', count: mainMenuViews, pct: mainMenuViews > 0 ? 100 : 0 },
      { step: 'Difficulty Selected', count: difficultySelected, pct: mainMenuViews > 0 ? Math.round((difficultySelected / mainMenuViews) * 100) : 0 },
      { step: 'Game Started', count: gamesStarted, pct: mainMenuViews > 0 ? Math.round((gamesStarted / mainMenuViews) * 100) : 0 },
      { step: 'Game Completed', count: gamesCompleted, pct: mainMenuViews > 0 ? Math.round((gamesCompleted / mainMenuViews) * 100) : 0 },
    ];

    return res.status(200).json({
      ok: true,
      difficultyStats,
      woodStats: {
        totalWoodCollected,
        totalWoodDelivered,
        avgDeliveredPerGame,
        deliveriesPerSession: totalStarts > 0 ? (totalWoodDelivered / totalStarts).toFixed(1) : '0.0',
      },
      restarts: {
        count: restartEvents,
        restartFrequencyPct: totalStarts > 0 ? Math.round((restartEvents / totalStarts) * 100) : 0,
        abandonedGames,
        abandonmentRate,
      },
      funnel,
    });
  } catch (err: any) {
    console.error('[Gameplay API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
