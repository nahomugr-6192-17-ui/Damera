// ==============================================================================
// api/admin/[route].ts — Consolidated Vercel Serverless Function Router for Admin
// Consolidates all 10 admin API sub-routes into 1 single Serverless Function,
// staying well below Vercel's Hobby plan 12-function limit (3 total functions).
// ==============================================================================

import handleAuth from '../../lib/admin/auth';
import handleOverview from '../../lib/admin/overview';
import handlePlayers from '../../lib/admin/players';
import handleGameplay from '../../lib/admin/gameplay';
import handleRetention from '../../lib/admin/retention';
import handleHealth from '../../lib/admin/health';
import handleLogs from '../../lib/admin/logs';
import handleAlerts from '../../lib/admin/alerts';
import handleSettings from '../../lib/admin/settings';
import handleReset from '../../lib/admin/reset';

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
    return targetHandler(req, res);
  }

  return res.status(404).json({
    error: `Admin route '${route}' not found`,
    availableRoutes: Object.keys(routeHandlers),
  });
}
