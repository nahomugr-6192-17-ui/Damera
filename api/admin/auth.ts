// ==============================================================================
// api/admin/auth.ts — Admin Authentication & Token Verification Handler
// ==============================================================================

import { generateToken, verifyCredentials, authenticateRequest } from '../lib/auth.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const action = req.query?.action || (req.body && typeof req.body === 'object' ? req.body.action : 'verify');

  if (req.method === 'POST' && (action === 'login' || !action)) {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const username = body?.username?.trim();
    const password = body?.password?.trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = verifyCredentials(username, password);
    if (!result.ok || !result.user) {
      return res.status(401).json({ error: result.error || 'Invalid username or password' });
    }

    const token = generateToken(result.user);
    return res.status(200).json({
      ok: true,
      token,
      user: {
        username: result.user.username,
        role: result.user.role,
      },
      expiresIn: 86400,
    });
  }

  if (req.method === 'GET' && action === 'verify') {
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(401).json({ ok: false, error: auth.error });
    }

    return res.status(200).json({
      ok: true,
      authenticated: true,
      user: auth.user,
    });
  }

  if (req.method === 'POST' && action === 'logout') {
    return res.status(200).json({ ok: true, message: 'Logged out successfully' });
  }

  return res.status(400).json({ error: 'Invalid authentication action' });
}
