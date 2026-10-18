// ============================================================
// TelegramService.ts
// Handles official Telegram Mini App WebApp SDK integration:
// - expand() to maximum height
// - requestFullscreen() where supported (Bot API 8.0+)
// - theme colors: header, background, bottom bar
// - viewport and fullscreen event listeners
// - graceful fallback for standard desktop and mobile browsers
// ============================================================

export interface TelegramViewportCallback {
  (): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export class TelegramService {
  private static instance: TelegramService | null = null;
  private tg: any = null;
  private viewportCallbacks: TelegramViewportCallback[] = [];
  private fullscreenAttempted = false;

  private constructor() {
    this.tg = window.Telegram?.WebApp ?? null;
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  /** Whether the game is running inside Telegram Mini App */
  public get isInsideTelegram(): boolean {
    return this.tg !== null && typeof this.tg === "object";
  }

  /** Whether the Telegram client is currently in fullscreen */
  public get isFullscreen(): boolean {
    return Boolean(this.tg?.isFullscreen);
  }

  /** Initialize Telegram Mini App features */
  public init(): void {
    if (!this.isInsideTelegram) return;

    try {
      // 1. Notify Telegram the app is ready (hides loading indicators)
      if (typeof this.tg.ready === "function") {
        this.tg.ready();
      }

      // 2. Expand WebApp to maximum available height
      if (typeof this.tg.expand === "function") {
        this.tg.expand();
      }

      // 3. Goal 3: Set theme colors so header and bottom bar blend into the game
      // #1b5e20 is the game's rich forest green; #0a1f0d is the top HUD dusk shade
      const HEADER_COLOR = "#0a1f0d";
      const BG_COLOR = "#1b5e20";

      if (typeof this.tg.setHeaderColor === "function") {
        try {
          this.tg.setHeaderColor(HEADER_COLOR);
        } catch (e) {
          // Fallback to secondary if custom hex is rejected by older clients
          try { this.tg.setHeaderColor("secondary_bg_color"); } catch (_) {}
        }
      }

      if (typeof this.tg.setBackgroundColor === "function") {
        try {
          this.tg.setBackgroundColor(BG_COLOR);
        } catch (e) {}
      }

      if (typeof this.tg.setBottomBarColor === "function") {
        try {
          this.tg.setBottomBarColor(HEADER_COLOR);
        } catch (e) {}
      }

      // 4. Register event listeners for viewport and fullscreen changes
      if (typeof this.tg.onEvent === "function") {
        this.tg.onEvent("viewportChanged", (data: any) => {
          this.notifyViewportChange();
        });

        this.tg.onEvent("fullscreenChanged", () => {
          this.notifyViewportChange();
        });

        this.tg.onEvent("fullscreenFailed", (err: any) => {
          console.warn("[Telegram] Fullscreen failed or not allowed:", err);
        });
      }

      // 5. Goal 2: Attempt fullscreen on initial load where supported
      this.requestFullscreen();
    } catch (err) {
      console.warn("[Telegram] Error during init:", err);
    }
  }

  /**
   * Request native Telegram Mini App fullscreen mode (Telegram Bot API 8.0+).
   * Safe to call multiple times or on user gesture (e.g. Play button).
   */
  public requestFullscreen(): boolean {
    if (!this.isInsideTelegram) return false;

    // Check if requestFullscreen method exists on Telegram WebApp
    if (typeof this.tg.requestFullscreen === "function") {
      try {
        this.tg.requestFullscreen();
        this.fullscreenAttempted = true;
        return true;
      } catch (err) {
        console.warn("[Telegram] requestFullscreen invocation error:", err);
      }
    }
    return false;
  }

  /** Register a callback for when Telegram viewport dimensions or fullscreen state change */
  public onViewportChange(cb: TelegramViewportCallback): void {
    this.viewportCallbacks.push(cb);
  }

  private notifyViewportChange(): void {
    for (const cb of this.viewportCallbacks) {
      try {
        cb();
      } catch (e) {
        console.error("[Telegram] Error in viewport callback:", e);
      }
    }
  }

  /** Get safe area insets if provided by Telegram */
  public getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    if (!this.isInsideTelegram) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
    const safe = this.tg.safeAreaInset || this.tg.contentSafeAreaInset;
    return {
      top: safe?.top ?? 0,
      bottom: safe?.bottom ?? 0,
      left: safe?.left ?? 0,
      right: safe?.right ?? 0,
    };
  }
}
