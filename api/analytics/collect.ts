// ==============================================================================
// api/analytics/collect.ts — Ingestion Endpoint for Batched Game Telemetry
// Receives in-game events, validates payload structure, updates player profiles
// and game sessions, and records raw events in Supabase PostgreSQL or memory fallback.
// ==============================================================================

import { getSupabase, memoryStore, type RawEvent } from '../_lib/supabase';

const ALLOWED_EVENTS = new Set([
  'game_loaded',
  'main_menu_viewed',
  'how_to_play_opened',
  'difficulty_selected',
  'game_started',
  'wood_collected',
  'wood_delivered',
  'player_died',
  'game_over',
  'game_won',
  'game_restarted',
  'session_ended',
  'mini_app_opened',
  'game_load_failed',
  'client_error',
  'heartbeat',
]);

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    let events: any[] = [];
    if (Array.isArray(body?.events)) {
      events = body.events;
    } else if (body && typeof body.event_name === 'string') {
      events = [body];
    }

    if (events.length === 0) {
      return res.status(200).json({ ok: true, count: 0 });
    }

    // Limit maximum batch size to prevent abuse
    const cleanEvents = events.slice(0, 25).filter((e: any) => {
      return (
        e &&
        typeof e.event_name === 'string' &&
        ALLOWED_EVENTS.has(e.event_name) &&
        typeof e.anonymous_player_id === 'string' &&
        typeof e.session_id === 'string'
      );
    });

    if (cleanEvents.length === 0) {
      return res.status(400).json({ error: 'No valid analytics events found in batch' });
    }

    const supabase = getSupabase();

    if (supabase) {
      // 1. Insert raw events to Supabase
      const rows = cleanEvents.map((e: any) => ({
        event_name: e.event_name,
        anonymous_player_id: e.anonymous_player_id,
        session_id: e.session_id,
        timestamp: e.timestamp || new Date().toISOString(),
        difficulty: e.difficulty || null,
        duration_seconds: typeof e.duration_seconds === 'number' ? e.duration_seconds : null,
        outcome: e.outcome || null,
        platform: e.platform || 'desktop',
        is_telegram: Boolean(e.is_telegram),
        game_version: e.game_version || '1.2.0',
        properties: e.properties || {},
      }));

      const { error: insertError } = await supabase.from('analytics_events').insert(rows);
      if (insertError) {
        console.error('[Analytics Ingestion] Supabase insert error:', insertError);
      }

      // 2. Update player profiles & sessions for key lifecycle events
      for (const e of cleanEvents) {
        const playerId = e.anonymous_player_id;
        const sessionId = e.session_id;

        // Upsert player profile
        const isWin = e.event_name === 'game_won';
        const isLoss = e.event_name === 'game_over';
        const isComplete = isWin || isLoss;

        const { data: profile } = await supabase
          .from('player_profiles')
          .select('*')
          .eq('anonymous_player_id', playerId)
          .maybeSingle();

        if (!profile) {
          await supabase.from('player_profiles').insert({
            anonymous_player_id: playerId,
            first_seen: e.timestamp || new Date().toISOString(),
            last_seen: e.timestamp || new Date().toISOString(),
            total_sessions: 1,
            total_play_duration_seconds: e.duration_seconds || 0,
            preferred_difficulty: e.difficulty || null,
            completed_games: isComplete ? 1 : 0,
            victories: isWin ? 1 : 0,
            game_overs: isLoss ? 1 : 0,
            total_wood_delivered: e.properties?.wood_delivered || 0,
            platform: e.platform || 'desktop',
            is_telegram: Boolean(e.is_telegram),
          });
        } else {
          await supabase
            .from('player_profiles')
            .update({
              last_seen: e.timestamp || new Date().toISOString(),
              total_play_duration_seconds: (profile.total_play_duration_seconds || 0) + (e.duration_seconds || 0),
              preferred_difficulty: e.difficulty || profile.preferred_difficulty,
              completed_games: (profile.completed_games || 0) + (isComplete ? 1 : 0),
              victories: (profile.victories || 0) + (isWin ? 1 : 0),
              game_overs: (profile.game_overs || 0) + (isLoss ? 1 : 0),
              total_wood_delivered: (profile.total_wood_delivered || 0) + (e.properties?.wood_delivered || 0),
              platform: e.platform || profile.platform,
              is_telegram: Boolean(e.is_telegram),
              updated_at: new Date().toISOString(),
            })
            .eq('anonymous_player_id', playerId);
        }

        // Upsert game session
        await supabase.from('game_sessions').upsert({
          session_id: sessionId,
          anonymous_player_id: playerId,
          last_heartbeat: e.timestamp || new Date().toISOString(),
          difficulty: e.difficulty || undefined,
          outcome: e.outcome || undefined,
          platform: e.platform || 'desktop',
          is_telegram: Boolean(e.is_telegram),
          duration_seconds: e.duration_seconds || 0,
        }, { onConflict: 'session_id' });
      }
    } else {
      // Memory Store Fallback
      cleanEvents.forEach((e: any) => {
        const rawEvent: RawEvent = {
          id: 'e_' + Math.random().toString(36).substring(2, 10),
          event_name: e.event_name,
          anonymous_player_id: e.anonymous_player_id,
          session_id: e.session_id,
          timestamp: e.timestamp || new Date().toISOString(),
          difficulty: e.difficulty,
          duration_seconds: e.duration_seconds,
          outcome: e.outcome,
          platform: e.platform || 'desktop',
          is_telegram: Boolean(e.is_telegram),
          game_version: e.game_version || '1.2.0',
          properties: e.properties || {},
          created_at: new Date().toISOString(),
        };

        memoryStore.events.push(rawEvent);

        // Update player profile in memory
        const playerId = e.anonymous_player_id;
        let profile = memoryStore.players.get(playerId);
        const isWin = e.event_name === 'game_won';
        const isLoss = e.event_name === 'game_over';
        const isComplete = isWin || isLoss;

        if (!profile) {
          profile = {
            anonymous_player_id: playerId,
            first_seen: e.timestamp || new Date().toISOString(),
            last_seen: e.timestamp || new Date().toISOString(),
            total_sessions: 1,
            total_play_duration_seconds: e.duration_seconds || 0,
            preferred_difficulty: e.difficulty,
            completed_games: isComplete ? 1 : 0,
            victories: isWin ? 1 : 0,
            game_overs: isLoss ? 1 : 0,
            total_wood_delivered: e.properties?.wood_delivered || 0,
            platform: e.platform || 'desktop',
            is_telegram: Boolean(e.is_telegram),
          };
          memoryStore.players.set(playerId, profile);
        } else {
          profile.last_seen = e.timestamp || new Date().toISOString();
          if (e.duration_seconds) profile.total_play_duration_seconds += e.duration_seconds;
          if (e.difficulty) profile.preferred_difficulty = e.difficulty;
          if (isComplete) profile.completed_games += 1;
          if (isWin) profile.victories += 1;
          if (isLoss) profile.game_overs += 1;
          if (e.properties?.wood_delivered) profile.total_wood_delivered += e.properties.wood_delivered;
          profile.platform = e.platform || profile.platform;
          profile.is_telegram = Boolean(e.is_telegram);
        }

        // Update game session in memory
        const sessionId = e.session_id;
        let session = memoryStore.sessions.get(sessionId);
        if (!session) {
          session = {
            session_id: sessionId,
            anonymous_player_id: playerId,
            started_at: e.timestamp || new Date().toISOString(),
            last_heartbeat: e.timestamp || new Date().toISOString(),
            duration_seconds: e.duration_seconds || 0,
            difficulty: e.difficulty,
            outcome: e.outcome,
            wood_collected: e.properties?.wood_collected || 0,
            wood_delivered: e.properties?.wood_delivered || 0,
            platform: e.platform || 'desktop',
            is_telegram: Boolean(e.is_telegram),
          };
          memoryStore.sessions.set(sessionId, session);
        } else {
          session.last_heartbeat = e.timestamp || new Date().toISOString();
          if (e.duration_seconds) session.duration_seconds = e.duration_seconds;
          if (e.difficulty) session.difficulty = e.difficulty;
          if (e.outcome) session.outcome = e.outcome;
          if (e.properties?.wood_collected) session.wood_collected += e.properties.wood_collected;
          if (e.properties?.wood_delivered) session.wood_delivered += e.properties.wood_delivered;
        }
      });
    }

    return res.status(200).json({ ok: true, count: cleanEvents.length });
  } catch (err: any) {
    console.error('[Analytics Ingestion] Handler error:', err);
    return res.status(500).json({ error: 'Internal Ingestion Error', details: err?.message });
  }
}
