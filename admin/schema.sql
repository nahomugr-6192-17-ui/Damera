-- ==============================================================================
-- PAPA SMURF — Damera Game Analytics & Monitoring Database Schema
-- (Mirror of supabase/schema.sql for easy access inside the Admin folder)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ANALYTICS_EVENTS: Granular raw telemetry events emitted by the game
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    anonymous_player_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    difficulty TEXT CHECK (difficulty IN ('EASY', 'MEH', 'HARD') OR difficulty IS NULL),
    duration_seconds NUMERIC(10,2),
    outcome TEXT,
    platform TEXT NOT NULL DEFAULT 'desktop' CHECK (platform IN ('desktop', 'mobile', 'tablet')),
    is_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    game_version TEXT NOT NULL DEFAULT '1.2.0',
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_events_player ON analytics_events (anonymous_player_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_name_timestamp ON analytics_events (event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_difficulty ON analytics_events (difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_platform ON analytics_events (platform);

-- ------------------------------------------------------------------------------
-- 2. GAME_SESSIONS: Consolidated play sessions and performance
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    anonymous_player_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
    difficulty TEXT CHECK (difficulty IN ('EASY', 'MEH', 'HARD') OR difficulty IS NULL),
    outcome TEXT CHECK (outcome IN ('VICTORY', 'GAME_OVER', 'ABANDONED', 'IN_PROGRESS') OR outcome IS NULL),
    wood_collected INTEGER NOT NULL DEFAULT 0,
    wood_delivered INTEGER NOT NULL DEFAULT 0,
    deliveries_count INTEGER NOT NULL DEFAULT 0,
    platform TEXT NOT NULL DEFAULT 'desktop',
    is_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    game_version TEXT NOT NULL DEFAULT '1.2.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON game_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions (anonymous_player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_heartbeat ON game_sessions (last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_outcome ON game_sessions (outcome);
CREATE INDEX IF NOT EXISTS idx_sessions_difficulty ON game_sessions (difficulty);

-- ------------------------------------------------------------------------------
-- 3. PLAYER_PROFILES: Pseudonymous aggregated player lifetime statistics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_profiles (
    anonymous_player_id TEXT PRIMARY KEY,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_sessions INTEGER NOT NULL DEFAULT 1,
    total_play_duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
    preferred_difficulty TEXT CHECK (preferred_difficulty IN ('EASY', 'MEH', 'HARD') OR preferred_difficulty IS NULL),
    completed_games INTEGER NOT NULL DEFAULT 0,
    victories INTEGER NOT NULL DEFAULT 0,
    game_overs INTEGER NOT NULL DEFAULT 0,
    total_wood_delivered INTEGER NOT NULL DEFAULT 0,
    platform TEXT NOT NULL DEFAULT 'desktop',
    is_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON player_profiles (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_first_seen ON player_profiles (first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_victories ON player_profiles (victories DESC);

-- ------------------------------------------------------------------------------
-- 4. ADMIN_USERS: Secure Administrator Accounts for Dashboard Authentication
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 5. ALERT_RULES & ALERT_HISTORY: System health & gameplay anomaly monitoring
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    metric TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('gt', 'lt', 'eq', 'gte', 'lte')),
    threshold NUMERIC(10,2) NOT NULL,
    time_window_minutes INTEGER NOT NULL DEFAULT 15,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    alert_title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by TEXT,
    resolved_at TIMESTAMPTZ,
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alert_history (triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alert_history (status);

-- ------------------------------------------------------------------------------
-- 6. DEFAULT ALERT RULES SEEDING
-- ------------------------------------------------------------------------------
INSERT INTO alert_rules (name, metric, condition, threshold, time_window_minutes, severity, enabled)
VALUES
    ('High Client Error Rate', 'client_error_count', 'gt', 10, 15, 'warning', TRUE),
    ('Critical Ingestion Failures', 'ingestion_failure_count', 'gt', 5, 10, 'critical', TRUE),
    ('Unusually Low Game Starts', 'game_starts_hourly', 'lt', 1, 60, 'info', FALSE),
    ('Sudden Spike in Game Overs', 'game_over_rate_pct', 'gt', 85, 30, 'warning', TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access: analytics_events"
    ON analytics_events FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access: game_sessions"
    ON game_sessions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access: player_profiles"
    ON player_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access: admin_users"
    ON admin_users FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access: alert_rules"
    ON alert_rules FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service Role Full Access: alert_history"
    ON alert_history FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. RETENTION & CLEANUP PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events(retention_days INT DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_events
    WHERE timestamp < (NOW() - (retention_days || ' days')::INTERVAL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
