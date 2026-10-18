// ==============================================================================
// api/admin/alerts.ts — System Alerts & Anomaly Notification Monitoring
// ==============================================================================

import { authenticateRequest } from '../_lib/auth';
import { memoryStore } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error || 'Unauthorized' });
  }

  // Handle alert acknowledgement
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const alertId = body?.alert_id;
    if (alertId) {
      const alert = memoryStore.alertHistory.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'acknowledged';
      }
      return res.status(200).json({ ok: true, message: 'Alert acknowledged' });
    }
  }

  try {
    const rules = [
      {
        id: 'rule-1',
        name: 'High Client Error Rate',
        metric: 'client_error_count',
        condition: '> 10 in 15m',
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'rule-2',
        name: 'Ingestion Failures Spikes',
        metric: 'ingestion_failures',
        condition: '> 5 in 10m',
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'rule-3',
        name: 'Telegram Webhook Degraded',
        metric: 'webhook_status',
        condition: '!= healthy',
        severity: 'warning',
        enabled: !process.env.TELEGRAM_BOT_TOKEN,
      },
      {
        id: 'rule-4',
        name: 'Abnormally High Game Over Rate',
        metric: 'game_over_rate_pct',
        condition: '> 85% in 30m',
        severity: 'warning',
        enabled: true,
      },
    ];

    // Compute live alerts
    const activeAlerts: any[] = [];

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      activeAlerts.push({
        id: 'alt_tg_token_missing',
        title: 'Telegram Bot Token Missing',
        message: 'TELEGRAM_BOT_TOKEN is not set in environment variables. Webhook responses are running in mock mode.',
        severity: 'warning',
        status: 'active',
        triggered_at: new Date(Date.now() - 3600000).toISOString(),
      });
    }

    if (!process.env.SUPABASE_URL) {
      activeAlerts.push({
        id: 'alt_db_fallback',
        title: 'Running in Local Memory Mode',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured. Telemetry is using memory storage fallback.',
        severity: 'info',
        status: 'active',
        triggered_at: new Date(Date.now() - 7200000).toISOString(),
      });
    }

    return res.status(200).json({
      ok: true,
      rules,
      activeAlerts,
      alertHistory: memoryStore.alertHistory,
    });
  } catch (err: any) {
    console.error('[Alerts API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
