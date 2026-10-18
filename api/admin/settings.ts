// ==============================================================================
// api/admin/settings.ts — Admin Dashboard Settings & Data Export
// ==============================================================================

import { authenticateRequest } from '../lib/auth.ts';
import { getStorageMode, memoryStore } from '../lib/supabase.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error || 'Unauthorized' });
  }

  // Handle data export
  if (req.query?.action === 'export') {
    return res.status(200).json({
      exported_at: new Date().toISOString(),
      events_count: memoryStore.events.length,
      players_count: memoryStore.players.size,
      sessions_count: memoryStore.sessions.size,
      events: memoryStore.events,
      players: Array.from(memoryStore.players.values()),
    });
  }

  try {
    const storageMode = getStorageMode();

    return res.status(200).json({
      ok: true,
      environment: {
        gameTitle: 'ዳመራ — Keep the Fire Burning',
        publisher: 'PAPA SMURF',
        productionUrl: 'https://damera.pro.et',
        storage: storageMode,
        database: {
          configured: storageMode.isSupabase,
          provider: 'Supabase PostgreSQL',
          schemaVersion: '1.0.0',
        },
        telegram: {
          tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
          secretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
          webhookUrl: 'https://damera.pro.et/api/webhook',
        },
        auth: {
          jwtSecretConfigured: Boolean(process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY),
          adminUsername: process.env.ADMIN_USERNAME || 'admin',
        },
      },
    });
  } catch (err: any) {
    console.error('[Settings API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
