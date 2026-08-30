// Single place for the small config values every hook/component pulls from
// - refetch cadences, storage keys, query keys - so nothing hardcodes a
// magic number or string twice.

export const AUTH_STORAGE_KEY = "spider-hub-dashboard.auth-key";

export const REFRESH_INTERVAL_MS = {
  stats: 30_000,
  timeseries: 30_000,
  tokenStatus: 30_000,
  logs: 8_000,
} as const;

export const TIMESERIES_DAYS = 14;

export const LOG_LINE_OPTIONS = [100, 300, 1000] as const;
export const DEFAULT_LOG_LINES = 300;

// Platforms cinemark-api can actually trigger a crawl for (POST /<platform>/run).
// instagram may show up in /stats/platforms too but is scraped entirely by
// cinemark-scraper's own Worker, not spider-hub - no button for it here.
export const TRIGGERABLE_PLATFORMS = ["facebook", "threads", "tiktok"] as const;
export type TriggerablePlatform = (typeof TRIGGERABLE_PLATFORMS)[number];

// Of the triggerable platforms above, only these have their own
// browser-bootstrap token cache to refresh/watch (POST
// /<platform>/refresh-token, WS /<platform>/refresh-token/ws) - TikTok's
// spider-hub identity (cookie/device_id/odin_id) is captured once into
// platform_accounts and never expires the way a browser session token
// does, so it has no such route and must not show that card.
export const PLATFORMS_WITH_TOKEN_REFRESH = ["facebook", "threads"] as const;

// A dashboard-triggered refresh routinely finishes in well under a minute
// (saved session, headless, no login needed) - this just bounds how long a
// "refreshing..." state is trusted before the UI stops waiting on it, kept
// a little above cinemark-api's own server-side watch timeout (180s) so the
// server's "gave up watching" line has a chance to arrive first.
export const REFRESH_WATCH_TIMEOUT_MS = 200_000;

export const POSTS_PAGE_SIZE = 20;

export const QUERY_KEYS = {
  platformStats: ["platform-stats"] as const,
  timeseries: (days: number) => ["timeseries", days] as const,
  tokenStatus: (platform: string) => ["token-status", platform] as const,
  logs: (kind: "spider-hub" | "ingest", lines: number) => ["logs", kind, lines] as const,
  posts: (platform: string | undefined, offset: number) => ["posts", platform, offset] as const,
};
