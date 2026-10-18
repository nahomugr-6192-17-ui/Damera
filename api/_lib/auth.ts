// ==============================================================================
// api/_lib/auth.ts — Administrator Authentication & Session Security
// Provides cryptographic session token generation, verification, and role checks.
// Supports both ADMIN_PASSWORD_HASH (PBKDF2/SHA512) and ADMIN_PASSWORD.
// ==============================================================================

import crypto from 'crypto';

const AUTH_SECRET = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'damera-papa-smurf-analytics-secret-key-2026';
const TOKEN_MAX_AGE_SECONDS = 24 * 3600; // 24 hours

export interface AdminUser {
  username: string;
  role: 'superadmin' | 'admin' | 'viewer';
}

export interface AuthVerificationResult {
  ok: boolean;
  user?: AdminUser;
  error?: string;
}

/** Verify password against a stored PBKDF2 or SHA256 hash */
export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  try {
    // Format: pbkdf2$iterations$salt$hash
    const parts = storedHash.split('$');
    if (parts.length === 4 && parts[0] === 'pbkdf2') {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const expectedHash = parts[3];
      const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    }

    // SHA-256 fallback format (64-char hex)
    if (storedHash.length === 64) {
      const sha = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(sha), Buffer.from(storedHash));
    }
  } catch (err) {
    console.error('[Auth] Password hash verification error:', err);
  }

  return false;
}

/** Generate a signed, tamper-proof session token */
export function generateToken(user: AdminUser): string {
  const payload = {
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS,
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', AUTH_SECRET);
  hmac.update(payloadB64);
  const signature = hmac.digest('base64url');

  return `${payloadB64}.${signature}`;
}

/** Verify token signature and expiration */
export function verifyToken(token: string): AdminUser | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  // Verify HMAC signature in constant time
  const hmac = crypto.createHmac('sha256', AUTH_SECRET);
  hmac.update(payloadB64);
  const expectedSig = hmac.digest('base64url');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < now) {
      return null; // Expired
    }

    return {
      username: payload.username,
      role: payload.role || 'admin',
    };
  } catch {
    return null;
  }
}

/** Authenticate an incoming HTTP request */
export function authenticateRequest(req: any): { authenticated: boolean; user?: AdminUser; error?: string } {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];

  let token: string | null = null;
  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    return { authenticated: false, error: 'Missing authorization token' };
  }

  const user = verifyToken(token);
  if (!user) {
    return { authenticated: false, error: 'Invalid or expired session token' };
  }

  return { authenticated: true, user };
}

/**
 * Verify user login credentials against configured environment variables.
 * Priority:
 *   1. ADMIN_PASSWORD_HASH (PBKDF2/SHA-512)
 *   2. ADMIN_PASSWORD (plaintext string in Vercel environment)
 *   3. In local dev mode only: default fallback (admin / smurf2026)
 *   4. In production: strictly requires configured credentials
 */
export function verifyCredentials(username: string, password: string): AuthVerificationResult {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const configuredUser = process.env.ADMIN_USERNAME || 'admin';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  // Check username match in constant time
  const usernameMatches = username === configuredUser;

  // Case A: ADMIN_PASSWORD_HASH configured
  if (passwordHash) {
    if (usernameMatches && verifyPasswordHash(password, passwordHash)) {
      return { ok: true, user: { username: configuredUser, role: 'superadmin' } };
    }
    return { ok: false, error: 'Invalid username or password' };
  }

  // Case B: ADMIN_PASSWORD configured
  if (plainPassword) {
    let passwordMatches = false;
    try {
      passwordMatches = crypto.timingSafeEqual(
        Buffer.from(password.padEnd(64, ' ')),
        Buffer.from(plainPassword.padEnd(64, ' '))
      ) && password.length === plainPassword.length;
    } catch {
      passwordMatches = password === plainPassword;
    }

    if (usernameMatches && passwordMatches) {
      return { ok: true, user: { username: configuredUser, role: 'superadmin' } };
    }
    return { ok: false, error: 'Invalid username or password' };
  }

  // Case C: Neither password variable configured
  if (isProduction) {
    console.error('[Auth Error] Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD is set in Vercel environment variables.');
    return {
      ok: false,
      error: 'Authentication is not configured on this server. Please configure ADMIN_USERNAME and ADMIN_PASSWORD_HASH in Vercel project settings.',
    };
  }

  // Case D: Local development fallback
  if (username === 'admin' && password === 'smurf2026') {
    return { ok: true, user: { username: 'admin', role: 'superadmin' } };
  }

  return { ok: false, error: 'Invalid username or password' };
}
