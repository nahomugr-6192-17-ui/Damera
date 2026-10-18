// ==============================================================================
// api/admin/retention.ts — Player Retention & Engagement Cohort Analytics
// ==============================================================================

import { authenticateRequest } from '../lib/auth.ts';
import { memoryStore } from '../lib/supabase.ts';

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
    const players = Array.from(memoryStore.players.values());
    const totalPlayers = players.length;

    // Session frequency buckets
    let freq1 = 0, freq2To3 = 0, freq4To7 = 0, freq8Plus = 0;
    players.forEach(p => {
      const s = p.total_sessions || 1;
      if (s === 1) freq1++;
      else if (s <= 3) freq2To3++;
      else if (s <= 7) freq4To7++;
      else freq8Plus++;
    });

    const frequencyDistribution = [
      { label: '1 Session', count: freq1, pct: totalPlayers > 0 ? Math.round((freq1 / totalPlayers) * 100) : 0 },
      { label: '2–3 Sessions', count: freq2To3, pct: totalPlayers > 0 ? Math.round((freq2To3 / totalPlayers) * 100) : 0 },
      { label: '4–7 Sessions', count: freq4To7, pct: totalPlayers > 0 ? Math.round((freq4To7 / totalPlayers) * 100) : 0 },
      { label: '8+ Sessions', count: freq8Plus, pct: totalPlayers > 0 ? Math.round((freq8Plus / totalPlayers) * 100) : 0 },
    ];

    // Session duration (average and median)
    const durations = players.map(p => p.total_play_duration_seconds).filter(d => d > 0).sort((a, b) => a - b);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const medianDuration = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0;

    // Day 1, Day 7, Day 30 retention calculations based on players first seen > N days ago
    const now = Date.now();
    const d1Eligible = players.filter(p => (now - new Date(p.first_seen).getTime()) >= 86400000);
    const d1Returned = d1Eligible.filter(p => p.total_sessions > 1);
    const d1Rate = d1Eligible.length > 0 ? Math.round((d1Returned.length / d1Eligible.length) * 100) : null;

    const d7Eligible = players.filter(p => (now - new Date(p.first_seen).getTime()) >= 7 * 86400000);
    const d7Returned = d7Eligible.filter(p => p.total_sessions >= 3);
    const d7Rate = d7Eligible.length > 0 ? Math.round((d7Returned.length / d7Eligible.length) * 100) : null;

    const d30Eligible = players.filter(p => (now - new Date(p.first_seen).getTime()) >= 30 * 86400000);
    const d30Returned = d30Eligible.filter(p => p.total_sessions >= 5);
    const d30Rate = d30Eligible.length > 0 ? Math.round((d30Returned.length / d30Eligible.length) * 100) : null;

    // Weekly Cohort Retention Table based on actual player first_seen dates
    const p8to14 = players.filter(p => {
      const age = now - new Date(p.first_seen).getTime();
      return age >= 7 * 86400000 && age < 14 * 86400000;
    });
    const p15to21 = players.filter(p => {
      const age = now - new Date(p.first_seen).getTime();
      return age >= 14 * 86400000 && age < 21 * 86400000;
    });

    const cohorts = [
      {
        cohort: 'Last 7 Days',
        size: players.length,
        d1: d1Rate !== null ? `${d1Rate}%` : (players.length > 0 ? 'Collecting data' : '—'),
        d7: d7Rate !== null ? `${d7Rate}%` : '—',
        d14: '—',
        d30: '—',
      },
      {
        cohort: '8–14 Days Ago',
        size: p8to14.length,
        d1: p8to14.length > 0 ? `${Math.round((p8to14.filter(p => p.total_sessions > 1).length / p8to14.length) * 100)}%` : '—',
        d7: p8to14.length > 0 ? `${Math.round((p8to14.filter(p => p.total_sessions >= 3).length / p8to14.length) * 100)}%` : '—',
        d14: '—',
        d30: '—',
      },
      {
        cohort: '15–21 Days Ago',
        size: p15to21.length,
        d1: p15to21.length > 0 ? `${Math.round((p15to21.filter(p => p.total_sessions > 1).length / p15to21.length) * 100)}%` : '—',
        d7: p15to21.length > 0 ? `${Math.round((p15to21.filter(p => p.total_sessions >= 3).length / p15to21.length) * 100)}%` : '—',
        d14: '—',
        d30: '—',
      },
    ];

    return res.status(200).json({
      ok: true,
      retentionMetrics: {
        day1: {
          rate: d1Rate,
          sampleSize: d1Eligible.length,
          definition: 'Percentage of new players who return and play on the calendar day after their first session.',
        },
        day7: {
          rate: d7Rate,
          sampleSize: d7Eligible.length,
          definition: 'Percentage of new players who return and play 7 days after their first session.',
        },
        day30: {
          rate: d30Rate,
          sampleSize: d30Eligible.length,
          definition: 'Percentage of new players who return and play 30 days after their first session.',
        },
      },
      durationMetrics: {
        avgDurationSeconds: avgDuration,
        medianDurationSeconds: medianDuration,
      },
      frequencyDistribution,
      cohorts,
    });
  } catch (err: any) {
    console.error('[Retention API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
