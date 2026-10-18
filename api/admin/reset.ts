// ==============================================================================
// api/admin/reset.ts — Administrator-Only Analytics Reset Endpoint
// Safely resets historical telemetry data with atomic execution and explicit confirmation.
// Preserves admin accounts, Telegram bot tokens, and all configuration settings.
// ==============================================================================

import { authenticateRequest } from '../_lib/auth.ts';
import { executeAnalyticsReset } from '../_lib/supabase.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Strict Administrator Authentication
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error || 'Unauthorized' });
  }

  // 2. Explicit Confirmation Validation
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }

  const confirmation = body?.confirm;
  if (confirmation !== 'RESET_DAMERA_ANALYTICS') {
    return res.status(400).json({
      ok: false,
      error: 'Explicit confirmation required. You must pass { confirm: "RESET_DAMERA_ANALYTICS" } to reset analytics.',
    });
  }

  try {
    const result = await executeAnalyticsReset();
    return res.status(200).json({
      ok: true,
      resetAt: result.resetAt,
      message: result.message,
    });
  } catch (err: any) {
    console.error('[Reset API Error]', err);
    return res.status(500).json({ error: 'Failed to reset analytics', details: err?.message });
  }
}
