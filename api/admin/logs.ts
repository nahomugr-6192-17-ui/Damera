// ==============================================================================
// api/admin/logs.ts — Searchable and Filterable Events & Telemetry Logs
// ==============================================================================

import { authenticateRequest } from '../lib/auth.ts';
import { memoryStore, type RawEvent } from '../lib/supabase.ts';

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
    const limit = Math.min(100, Math.max(10, parseInt(req.query?.limit || '20', 10)));
    const eventType = req.query?.event_type?.trim();
    const difficulty = req.query?.difficulty?.trim();
    const platform = req.query?.platform?.trim();
    const search = (req.query?.search || '').toLowerCase().trim();

    let logs: RawEvent[] = [...memoryStore.events];

    // Filters
    if (eventType && eventType !== 'all') {
      logs = logs.filter(e => e.event_name === eventType);
    }
    if (difficulty && difficulty !== 'all') {
      logs = logs.filter(e => e.difficulty === difficulty);
    }
    if (platform && platform !== 'all') {
      logs = logs.filter(e => e.platform === platform);
    }
    if (search) {
      logs = logs.filter(
        e =>
          e.anonymous_player_id.toLowerCase().includes(search) ||
          e.session_id.toLowerCase().includes(search) ||
          e.event_name.toLowerCase().includes(search)
      );
    }

    // Sort newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = logs.length;
    const paginated = logs.slice((page - 1) * limit, page * limit);

    // Format safely (remove sensitive fields if any)
    const sanitizedLogs = paginated.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      event_name: e.event_name,
      severity: e.event_name === 'client_error' || e.event_name === 'game_load_failed' ? 'error' : 'info',
      anonymous_player_id: e.anonymous_player_id,
      session_id: e.session_id,
      difficulty: e.difficulty || null,
      platform: e.platform,
      is_telegram: e.is_telegram,
      properties: e.properties,
    }));

    return res.status(200).json({
      ok: true,
      logs: sanitizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('[Logs API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
