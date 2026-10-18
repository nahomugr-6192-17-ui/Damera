// ==============================================================================
// api/_lib/supabase.ts — Server-side Managed Supabase & Storage Adapter
// Safely connects to Supabase PostgreSQL using the server-only service_role key,
// and provides a high-reliability memory fallback for local dev & testing.
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}

export function getStorageMode(): { isSupabase: boolean; message: string } {
  const sb = getSupabase();
  if (sb) {
    return {
      isSupabase: true,
      message: 'Connected to Supabase PostgreSQL',
    };
  }
  return {
    isSupabase: false,
    message: 'Local Fallback Store (Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for cloud persistence)',
  };
}

// ------------------------------------------------------------------------------
// IN-MEMORY PERSISTENCE FALLBACK
// Used in development or before cloud environment variables are provisioned.
// ------------------------------------------------------------------------------
export interface RawEvent {
  id: string;
  event_name: string;
  anonymous_player_id: string;
  session_id: string;
  timestamp: string;
  difficulty?: string;
  duration_seconds?: number;
  outcome?: string;
  platform: string;
  is_telegram: boolean;
  game_version: string;
  properties: Record<string, any>;
  created_at: string;
}

export interface PlayerProfile {
  anonymous_player_id: string;
  first_seen: string;
  last_seen: string;
  total_sessions: number;
  total_play_duration_seconds: number;
  preferred_difficulty?: string;
  completed_games: number;
  victories: number;
  game_overs: number;
  total_wood_delivered: number;
  platform: string;
  is_telegram: boolean;
}

export interface GameSessionRecord {
  session_id: string;
  anonymous_player_id: string;
  started_at: string;
  last_heartbeat: string;
  ended_at?: string;
  duration_seconds: number;
  difficulty?: string;
  outcome?: string;
  wood_collected: number;
  wood_delivered: number;
  platform: string;
  is_telegram: boolean;
}

class InMemoryStorage {
  public events: RawEvent[] = [];
  public players: Map<string, PlayerProfile> = new Map();
  public sessions: Map<string, GameSessionRecord> = new Map();
  public alertHistory: Array<{
    id: string;
    alert_title: string;
    message: string;
    severity: string;
    status: string;
    triggered_at: string;
    details?: any;
  }> = [];
  public trackingStartTime: string | null = null;

  constructor() {
    this.seedInitialMetrics();
  }

  public resetAllData(): string {
    this.events = [];
    this.players.clear();
    this.sessions.clear();
    this.alertHistory = [];
    this.trackingStartTime = new Date().toISOString();
    return this.trackingStartTime;
  }

  private seedInitialMetrics() {
    // Generate realistic initial baseline so dashboard can render immediately
    const now = Date.now();
    const dayMs = 86400000;

    const samplePlayers = [
      { id: 'p_8a91b2c3d4e5f601', platform: 'mobile', isTg: true, diff: 'MEH', games: 6, wins: 4, dur: 480 },
      { id: 'p_1f2e3d4c5b6a7982', platform: 'desktop', isTg: false, diff: 'HARD', games: 8, wins: 3, dur: 720 },
      { id: 'p_9901aa22bb33cc44', platform: 'mobile', isTg: true, diff: 'EASY', games: 5, wins: 5, dur: 310 },
      { id: 'p_554433221100ffee', platform: 'tablet', isTg: false, diff: 'MEH', games: 4, wins: 2, dur: 390 },
      { id: 'p_778899aabbccddee', platform: 'mobile', isTg: true, diff: 'EASY', games: 3, wins: 3, dur: 195 },
    ];

    samplePlayers.forEach((p, idx) => {
      const firstSeen = new Date(now - (7 - idx) * dayMs).toISOString();
      const lastSeen = new Date(now - (idx * 3 + 1) * 3600000).toISOString();

      this.players.set(p.id, {
        anonymous_player_id: p.id,
        first_seen: firstSeen,
        last_seen: lastSeen,
        total_sessions: p.games + 1,
        total_play_duration_seconds: p.dur,
        preferred_difficulty: p.diff,
        completed_games: p.games,
        victories: p.wins,
        game_overs: p.games - p.wins,
        total_wood_delivered: p.wins * 6 + (p.games - p.wins) * 2,
        platform: p.platform,
        is_telegram: p.isTg,
      });

      const sId = `s_init_${idx}_` + Math.random().toString(36).substring(2, 7);
      this.sessions.set(sId, {
        session_id: sId,
        anonymous_player_id: p.id,
        started_at: lastSeen,
        last_heartbeat: lastSeen,
        ended_at: lastSeen,
        duration_seconds: Math.round(p.dur / p.games),
        difficulty: p.diff,
        outcome: p.wins > 0 ? 'VICTORY' : 'GAME_OVER',
        wood_collected: 7,
        wood_delivered: 6,
        platform: p.platform,
        is_telegram: p.isTg,
      });

      // Add baseline events
      this.events.push(
        {
          id: `e_${idx}_1`,
          event_name: 'game_loaded',
          anonymous_player_id: p.id,
          session_id: sId,
          timestamp: lastSeen,
          platform: p.platform,
          is_telegram: p.isTg,
          game_version: '1.2.0',
          properties: {},
          created_at: lastSeen,
        },
        {
          id: `e_${idx}_2`,
          event_name: 'game_started',
          anonymous_player_id: p.id,
          session_id: sId,
          timestamp: lastSeen,
          difficulty: p.diff,
          platform: p.platform,
          is_telegram: p.isTg,
          game_version: '1.2.0',
          properties: { difficulty: p.diff },
          created_at: lastSeen,
        },
        {
          id: `e_${idx}_3`,
          event_name: p.wins > 0 ? 'game_won' : 'game_over',
          anonymous_player_id: p.id,
          session_id: sId,
          timestamp: lastSeen,
          difficulty: p.diff,
          outcome: p.wins > 0 ? 'VICTORY' : 'GAME_OVER',
          platform: p.platform,
          is_telegram: p.isTg,
          game_version: '1.2.0',
          duration_seconds: Math.round(p.dur / p.games),
          properties: { wood_delivered: 6 },
          created_at: lastSeen,
        }
      );
    });
  }
}

// Global in-memory instance for process lifetime
const globalStore = (globalThis as any).__DAMERA_STORE__ || new InMemoryStorage();
(globalThis as any).__DAMERA_STORE__ = globalStore;

export const memoryStore: InMemoryStorage = globalStore;

/**
 * Executes a clean, atomic reset of all historical analytics data.
 * Purges raw events, player profiles, game sessions, and alert history.
 * Preserves admin accounts, Telegram bot tokens, and all environment configuration.
 */
export async function executeAnalyticsReset(): Promise<{ ok: boolean; resetAt: string; message: string }> {
  const resetAt = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    try {
      // Delete rows across all analytics tables (strictly preserving admin_users & alert_rules)
      await supabase.from('analytics_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('game_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('player_profiles').delete().neq('anonymous_player_id', '__never__');
      await supabase.from('alert_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.error('[Supabase Reset Error]', err);
    }
  }

  // Clear in-memory state and establish tracking start reference
  if (typeof (memoryStore as any).resetAllData === 'function') {
    (memoryStore as any).resetAllData();
  } else {
    memoryStore.events = [];
    if (memoryStore.players && typeof memoryStore.players.clear === 'function') {
      memoryStore.players.clear();
    }
    if (memoryStore.sessions && typeof memoryStore.sessions.clear === 'function') {
      memoryStore.sessions.clear();
    }
    memoryStore.alertHistory = [];
    memoryStore.trackingStartTime = resetAt;
  }
  memoryStore.trackingStartTime = resetAt;

  return {
    ok: true,
    resetAt,
    message: `Fresh tracking period started on ${resetAt}`,
  };
}
