// ==============================================================================
// api/admin/[route].ts — Consolidated Vercel Serverless Function Router for Admin
// Consolidates all 10 admin API sub-routes into 1 single Serverless Function,
// staying well below Vercel's Hobby plan 12-function limit (3 total functions).
// ==============================================================================

import handleAuth from '../_lib/admin/auth';
import handleOverview from '../_lib/admin/overview';
import handlePlayers from '../_lib/admin/players';
import handleGameplay from '../_lib/admin/gameplay';
import handleRetention from '../_lib/admin/retention';
import handleHealth from '../_lib/admin/health';
import handleLogs from '../_lib/admin/logs';
import handleAlerts from '../_lib/admin/alerts';
import handleSettings from '../_lib/admin/settings';
import handleReset from '../_lib/admin/reset';

const routeHandlers: Record<string, (req: any, res: any) => Promise<any> | any> = {
  auth: handleAuth,
  overview: handleOverview,
  players: handlePlayers,
  gameplay: handleGameplay,
  retention: handleRetention,
  health: handleHealth,
  logs: handleLogs,
  alerts: handleAlerts,
  settings: handleSettings,
  reset: handleReset,
};

export default async function handler(req: any, res: any) {
  try {
    // Extract route from query parameter (Vercel dynamic route) or from URL pathname
    let route = req.query?.route;
    if (!route) {
      const url = new URL(req.url || '', 'http://localhost');
      const segments = url.pathname.split('/').filter(Boolean);
      route = segments[segments.length - 1];
    }

    if (Array.isArray(route)) {
      route = route[0];
    }

    const targetHandler = routeHandlers[route || ''];
    if (targetHandler) {
      return await targetHandler(req, res);
    }

    return res.status(404).json({
      error: `Admin route '${route}' not found`,
      availableRoutes: Object.keys(routeHandlers),
    });
  } catch (err: any) {
    console.error('[Admin Router Error]', err);
    return res.status(500).json({
      error: err?.message || 'Server Internal Error',
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
    });
  }
}
