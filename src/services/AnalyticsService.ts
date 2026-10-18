// ============================================================
// AnalyticsService.ts — Lightweight, Non-blocking In-Game Analytics
// Captures game lifecycle, gameplay outcomes, wood pickups/deliveries,
// platform context, and technical errors with batched network delivery.
// ============================================================

import { TelegramService } from "./TelegramService";
import type { DifficultyKey } from "../config/LevelConfig";

export type AnalyticsEventName =
  | "game_loaded"
  | "main_menu_viewed"
  | "how_to_play_opened"
  | "difficulty_selected"
  | "game_started"
  | "wood_collected"
  | "wood_delivered"
  | "player_died"
  | "game_over"
  | "game_won"
  | "game_restarted"
  | "session_ended"
  | "mini_app_opened"
  | "game_load_failed"
  | "client_error"
  | "heartbeat";

export interface AnalyticsEvent {
  event_name: AnalyticsEventName;
  timestamp: string;
  anonymous_player_id: string;
  session_id: string;
  game_version: string;
  difficulty?: DifficultyKey | string;
  duration_seconds?: number;
  outcome?: string;
  platform: "mobile" | "tablet" | "desktop";
  is_telegram: boolean;
  properties?: Record<string, any>;
}

const GAME_VERSION = "1.2.0";
const STORAGE_KEY_PLAYER_ID = "damera_player_id";
const BATCH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 12;
const MAX_QUEUE_LIMIT = 50;
const HEARTBEAT_INTERVAL_MS = 60000;

export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private anonymousPlayerId: string;
  private sessionId: string;
  private queue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private isInitialized = false;
  private endpoint = "/api/analytics/collect";
  private gameStartTime: number | null = null;
  private currentDifficulty: DifficultyKey | null = null;

  private constructor() {
    this.anonymousPlayerId = this.getOrCreatePlayerId();
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /** Initialize event listeners, heartbeat, and exit flushes */
  public init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Detect Telegram Mini App context
    if (TelegramService.getInstance().isInsideTelegram) {
      this.track("mini_app_opened", {
        fullscreen: TelegramService.getInstance().isFullscreen,
      });
    }

    // Start periodic background flusher
    this.flushTimer = window.setInterval(() => {
      this.flushQueue();
    }, BATCH_INTERVAL_MS);

    // Periodic heartbeat to count currently active players accurately
    this.heartbeatTimer = window.setInterval(() => {
      this.track("heartbeat");
    }, HEARTBEAT_INTERVAL_MS);

    // Flush pending events when page is hidden or user navigates away
    const handleExit = () => {
      if (this.gameStartTime && this.currentDifficulty) {
        const duration = Math.round((Date.now() - this.gameStartTime) / 1000);
        this.track("session_ended", { duration_seconds: duration });
      }
      this.flushQueue(true);
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flushQueue(true);
      }
    });
    window.addEventListener("pagehide", handleExit);
    window.addEventListener("beforeunload", handleExit);

    // Track unhandled client errors
    window.addEventListener("error", (event) => {
      this.track("client_error", {
        message: event.message || "Unknown Error",
        filename: event.filename || "unknown",
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.track("client_error", {
        message: event.reason?.message || String(event.reason) || "Unhandled Promise Rejection",
        type: "unhandledrejection",
      });
    });
  }

  /** Get stable pseudonymous player ID from localStorage or generate a random UUID */
  private getOrCreatePlayerId(): string {
    try {
      let id = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
      if (!id || id.length < 8) {
        id = "p_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
        localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
      }
      return id;
    } catch {
      // Fallback for sandboxed iframes or private modes blocking localStorage
      return "p_tmp_" + Math.random().toString(36).substring(2, 12);
    }
  }

  private generateSessionId(): string {
    return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
  }

  /** Detect device platform category */
  public getPlatform(): "mobile" | "tablet" | "desktop" {
    const ua = navigator.userAgent.toLowerCase();
    const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const width = window.innerWidth;

    if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
      return "tablet";
    }
    if (/(mobi|ipod|phone|blackberry|opera mini)/.test(ua) || (isTouch && width < 768)) {
      return "mobile";
    }
    if (isTouch && width >= 768 && width <= 1024) {
      return "tablet";
    }
    return "desktop";
  }

  /** Check if analytics opt-out is toggled by user/browser */
  private isOptedOut(): boolean {
    return (window as any).__DAMERA_ANALYTICS_OPTOUT === true;
  }

  /** Generic track method */
  public track(eventName: AnalyticsEventName, properties: Record<string, any> = {}): void {
    if (this.isOptedOut()) return;

    const event: AnalyticsEvent = {
      event_name: eventName,
      timestamp: new Date().toISOString(),
      anonymous_player_id: this.anonymousPlayerId,
      session_id: this.sessionId,
      game_version: GAME_VERSION,
      difficulty: properties.difficulty ?? this.currentDifficulty ?? undefined,
      duration_seconds: properties.duration_seconds,
      outcome: properties.outcome,
      platform: this.getPlatform(),
      is_telegram: TelegramService.getInstance().isInsideTelegram,
      properties,
    };

    // Avoid queue blowing up if backend is unreachable
    if (this.queue.length >= MAX_QUEUE_LIMIT) {
      this.queue.shift(); // drop oldest event
    }
    this.queue.push(event);

    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flushQueue();
    }
  }

  /** Helper triggers for game events */
  public trackGameLoaded(): void {
    this.track("game_loaded");
  }

  public trackMainMenu(): void {
    this.track("main_menu_viewed");
  }

  public trackHowToPlay(): void {
    this.track("how_to_play_opened");
  }

  public trackDifficultySelected(difficulty: DifficultyKey): void {
    this.currentDifficulty = difficulty;
    this.track("difficulty_selected", { difficulty });
  }

  public trackGameStarted(difficulty: DifficultyKey): void {
    this.currentDifficulty = difficulty;
    this.gameStartTime = Date.now();
    this.track("game_started", { difficulty });
  }

  public trackWoodCollected(woodRemaining: number): void {
    this.track("wood_collected", { wood_remaining: woodRemaining });
  }

  public trackWoodDelivered(woodDelivered: number, requiredWood: number, timeRemaining: number): void {
    this.track("wood_delivered", {
      wood_delivered: woodDelivered,
      required_wood: requiredWood,
      time_remaining: Math.round(timeRemaining),
    });
  }

  public trackGameOver(woodDelivered: number, requiredWood: number): void {
    const duration = this.gameStartTime ? Math.round((Date.now() - this.gameStartTime) / 1000) : 0;
    this.track("game_over", {
      outcome: "GAME_OVER",
      wood_delivered: woodDelivered,
      required_wood: requiredWood,
      duration_seconds: duration,
    });
  }

  public trackGameWon(woodDelivered: number, requiredWood: number, timeRemaining: number): void {
    const duration = this.gameStartTime ? Math.round((Date.now() - this.gameStartTime) / 1000) : 0;
    this.track("game_won", {
      outcome: "VICTORY",
      wood_delivered: woodDelivered,
      required_wood: requiredWood,
      time_remaining: Math.round(timeRemaining),
      duration_seconds: duration,
    });
  }

  public trackGameRestarted(difficulty: DifficultyKey): void {
    this.currentDifficulty = difficulty;
    this.gameStartTime = Date.now();
    this.track("game_restarted", { difficulty });
  }

  /** Send batched events to ingestion endpoint */
  public flushQueue(isExit: boolean = false): void {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    const payload = JSON.stringify({ events: batch });

    // Use sendBeacon or keepalive fetch during exit
    if (isExit && typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: "application/json" });
        const sent = navigator.sendBeacon(this.endpoint, blob);
        if (sent) return;
      } catch {
        // Fallback to fetch keepalive below
      }
    }

    fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: isExit,
    }).catch(() => {
      // If network request failed and not exiting, re-queue events safely
      if (!isExit && this.queue.length + batch.length <= MAX_QUEUE_LIMIT) {
        this.queue.unshift(...batch);
      }
    });
  }
}
