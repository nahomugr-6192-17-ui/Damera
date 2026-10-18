// ==============================================================================
// api/admin/players.ts — Pseudonymous Player Analytics & Timeline
// ==============================================================================

import { authenticateRequest } from '../auth.ts';
import { getSupabase, memoryStore, type PlayerProfile } from '../supabase.ts';

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
    const page = Math.max(1, parseInt(req.query?.page || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(req.query?.limit || '15', 10)));
    const search = (req.query?.search || '').toLowerCase().trim();
    const sortField = req.query?.sort || 'last_seen';
    const sortOrder = req.query?.order === 'asc' ? 'asc' : 'desc';

    const supabase = getSupabase();
    let players: PlayerProfile[] = [];
    let totalCount = 0;

    if (supabase) {
      let query = supabase.from('player_profiles').select('*', { count: 'exact' });

      if (search) {
        query = query.ilike('anonymous_player_id', `%${search}%`);
      }

      query = query.order(sortField, { ascending: sortOrder === 'asc' });
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, count, error } = await query;
      if (error) console.error('[Players API] Supabase error:', error);
      players = data || [];
      totalCount = count || 0;
    } else {
      let list = Array.from(memoryStore.players.values());

      if (search) {
        list = list.filter(p => p.anonymous_player_id.toLowerCase().includes(search));
      }

      list.sort((a: any, b: any) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField.includes('seen') || sortField.includes('at')) {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      totalCount = list.length;
      players = list.slice((page - 1) * limit, page * limit);
    }

    const enhancedPlayers = players.map(p => {
      const isReturning = p.total_sessions > 1;
      const winRate = p.completed_games > 0 ? Math.round((p.victories / p.completed_games) * 100) : 0;
      return {
        ...p,
        is_returning: isReturning,
        win_rate_pct: winRate,
      };
    });

    return res.status(200).json({
      ok: true,
      players: enhancedPlayers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('[Players API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
