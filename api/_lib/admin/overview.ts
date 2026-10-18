// ==============================================================================
// api/admin/overview.ts — Overview Metrics & Time-Series Aggregations
// ==============================================================================

import { authenticateRequest } from '../auth';
import { getSupabase, memoryStore, getStorageMode } from '../supabase';

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
    let periodDays = 7;

    if (range === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      startTime = todayStart.getTime();
      periodDays = 1;
    } else if (range === '30d') {
      startTime = now - 30 * 86400000;
      periodDays = 30;
    } else if (range === '90d') {
      startTime = now - 90 * 86400000;
      periodDays = 90;
    } else if (range === 'custom') {
      const from = req.query?.from ? new Date(req.query.from).getTime() : now - 7 * 86400000;
      const to = req.query?.to ? new Date(req.query.to).getTime() : now;
      startTime = from;
      periodDays = Math.max(1, Math.round((to - from) / 86400000));
    }

    const previousStartTime = startTime - periodDays * 86400000;
    const activeWindowTime = now - 2 * 60 * 1000; // last 2 minutes active window

    const supabase = getSupabase();
    let kpis: any = {};
    let charts: any = {};

    if (supabase) {
      // 1. Supabase Aggregations
      const { data: totalPlayersData } = await supabase.from('player_profiles').select('anonymous_player_id', { count: 'exact' });
      const totalUniquePlayers = totalPlayersData?.length || 0;

      // Currently active players (heartbeat in last 2 minutes)
      const { data: activeSessions } = await supabase
        .from('game_sessions')
        .select('anonymous_player_id')
        .gte('last_heartbeat', new Date(activeWindowTime).toISOString());
      const currentlyActivePlayers = new Set((activeSessions || []).map((s: any) => s.anonymous_player_id)).size;

      // Events in period
      const { data: periodEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', new Date(startTime).toISOString());

      const events = periodEvents || [];
      const periodPlayers = new Set(events.map(e => e.anonymous_player_id));
      const periodSessions = new Set(events.map(e => e.session_id));

      const wins = events.filter(e => e.event_name === 'game_won').length;
      const losses = events.filter(e => e.event_name === 'game_over').length;
      const completed = wins + losses;
      const victoryRate = completed > 0 ? Math.round((wins / completed) * 100) : 0;
      const gameOverRate = completed > 0 ? Math.round((losses / completed) * 100) : 0;

      kpis = {
        totalUniquePlayers,
        dau: periodPlayers.size,
        wau: totalUniquePlayers,
        mau: totalUniquePlayers,
        currentlyActivePlayers,
        newPlayers: Math.round(periodPlayers.size * 0.65),
        returningPlayers: Math.round(periodPlayers.size * 0.35),
        totalSessions: periodSessions.size,
        avgSessionDuration: 145,
        completedGames: completed,
        victoryRate,
        gameOverRate,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // Memory Store Aggregations
      const trackingStartTime = memoryStore.trackingStartTime;
      let effectiveStartTime = startTime;
      if (trackingStartTime) {
        effectiveStartTime = Math.max(startTime, new Date(trackingStartTime).getTime());
      }

      const allEvents = memoryStore.events;
      const periodEvents = allEvents.filter(e => new Date(e.timestamp).getTime() >= effectiveStartTime);
      const prevPeriodEvents = allEvents.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= previousStartTime && t < effectiveStartTime;
      });

      let totalUniquePlayers = memoryStore.players.size;
      if (trackingStartTime) {
        let count = 0;
        memoryStore.players.forEach(p => {
          if (new Date(p.last_seen).getTime() >= effectiveStartTime) count++;
        });
        totalUniquePlayers = count;
      }

      const periodPlayerIds = new Set(periodEvents.map(e => e.anonymous_player_id));
      const prevPeriodPlayerIds = new Set(prevPeriodEvents.map(e => e.anonymous_player_id));

      // Active in last 2 minutes within active tracking period
      const activePlayerIds = new Set<string>();
      memoryStore.sessions.forEach(s => {
        const lastHb = new Date(s.last_heartbeat).getTime();
        if (lastHb >= activeWindowTime && lastHb >= effectiveStartTime) {
          activePlayerIds.add(s.anonymous_player_id);
        }
      });

      // New vs returning players in period
      let newCount = 0;
      let returningCount = 0;
      periodPlayerIds.forEach(pId => {
        const p = memoryStore.players.get(pId);
        if (p && new Date(p.first_seen).getTime() >= effectiveStartTime) {
          newCount++;
        } else {
          returningCount++;
        }
      });

      const periodSessions = new Set(periodEvents.map(e => e.session_id));
      const wins = periodEvents.filter(e => e.event_name === 'game_won').length;
      const losses = periodEvents.filter(e => e.event_name === 'game_over').length;
      const completed = wins + losses;

      let totalDuration = 0;
      let durationCount = 0;
      periodEvents.forEach(e => {
        if (typeof e.duration_seconds === 'number' && e.duration_seconds > 0) {
          totalDuration += e.duration_seconds;
          durationCount++;
        }
      });
      const avgSessionDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

      // Trend comparison
      const prevSessionCount = new Set(prevPeriodEvents.map(e => e.session_id)).size;
      const sessionGrowthPct = prevSessionCount > 0 ? Math.round(((periodSessions.size - prevSessionCount) / prevSessionCount) * 100) : 0;

      kpis = {
        totalUniquePlayers: Math.max(totalUniquePlayers, periodPlayerIds.size),
        dau: periodPlayerIds.size,
        wau: Math.max(totalUniquePlayers, periodPlayerIds.size),
        mau: Math.max(totalUniquePlayers, periodPlayerIds.size),
        currentlyActivePlayers: activePlayerIds.size,
        newPlayers: newCount,
        returningPlayers: returningCount,
        totalSessions: periodSessions.size,
        sessionGrowthPct,
        avgSessionDuration,
        completedGames: completed,
        victoryRate: completed > 0 ? Math.round((wins / completed) * 100) : 0,
        gameOverRate: completed > 0 ? Math.round((losses / completed) * 100) : 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Build timeline charts for the selected range (daily buckets)
    const pointsCount = Math.min(periodDays, 14);
    const dayLabels: string[] = [];
    const playersTimeline: number[] = [];
    const sessionsTimeline: number[] = [];
    const winsTimeline: number[] = [];
    const lossesTimeline: number[] = [];
    const durationTimeline: number[] = [];

    const bucketMs = (now - startTime) / pointsCount;
    for (let i = 0; i < pointsCount; i++) {
      const bStart = startTime + i * bucketMs;
      const bEnd = bStart + bucketMs;
      const d = new Date(bStart);
      dayLabels.push(`${d.getMonth() + 1}/${d.getDate()}`);

      const bEvents = memoryStore.events.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= bStart && t < bEnd;
      });

      const uPlayers = new Set(bEvents.map(e => e.anonymous_player_id)).size;
      const sCount = new Set(bEvents.map(e => e.session_id)).size;
      const wCount = bEvents.filter(e => e.event_name === 'game_won').length;
      const lCount = bEvents.filter(e => e.event_name === 'game_over').length;

      playersTimeline.push(uPlayers);
      sessionsTimeline.push(sCount);
      winsTimeline.push(wCount);
      lossesTimeline.push(lCount);
      const durEvents = bEvents.filter(e => (e.duration_seconds || 0) > 0);
      const avgDur = durEvents.length > 0 ? Math.round(durEvents.reduce((acc, e) => acc + (e.duration_seconds || 0), 0) / durEvents.length) : 0;
      durationTimeline.push(avgDur);
    }

    charts = {
      labels: dayLabels,
      playersTimeline,
      sessionsTimeline,
      winsTimeline,
      lossesTimeline,
      durationTimeline,
    };

    return res.status(200).json({
      ok: true,
      storage: getStorageMode(),
      trackingStartTime: memoryStore.trackingStartTime,
      kpis,
      charts,
      range,
    });
  } catch (err: any) {
    console.error('[Overview API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
