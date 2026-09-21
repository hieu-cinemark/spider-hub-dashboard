// Single place for the small config values every hook/component pulls from
// - refetch cadences, storage keys, query keys - so nothing hardcodes a
// magic number or string twice.

export const AUTH_STORAGE_KEY = "spider-hub-dashboard.auth-key";

export const REFRESH_INTERVAL_MS = {
  stats: 1_800_000,
  timeseries: 1_800_000,
  tokenStatus: 60_000,
  // Health banner / nav badge — summary counts only, slow cadence.
  healthLogs: 60_000,
  // Kept for any caller that still opts into live log polling (logs page does not).
  logs: 60_000,
  jobStatus: 12_000,
  jobStatusActive: 5_000,
  // Ops performance chart — samples host load + queue depth into Redis.
  opsMetrics: 15_000,
  accounts: 60_000,
  // While the comments panel is open (see useComments) - a triggered crawl
  // runs async (Kafka -> spider-hub -> ingest), so this is what actually
  // surfaces new rows without the viewer having to close/reopen the modal.
  comments: 5_000,
} as const;

export const TIMESERIES_DAYS = 14;
export const CHART_HEIGHT = 320;

export const LOG_LINE_OPTIONS = [100, 300, 1000] as const;
export const DEFAULT_LOG_LINES = 300;
export const HEALTH_LOG_LINES = 100;

// Platforms cinemark-api can actually trigger a crawl for (POST /<platform>/run).
// instagram may show up in /stats/platforms too but is scraped entirely by
// cinemark-scraper's own Worker, not spider-hub - no button for it here.
export const TRIGGERABLE_PLATFORMS = ["facebook", "threads", "tiktok"] as const;
export type TriggerablePlatform = (typeof TRIGGERABLE_PLATFORMS)[number];

// Platforms spider-hub has a comments spider for at all (see its
// crawl_request_consumer.py's COMMENTS_SPIDER_BY_PLATFORM).
export const COMMENT_SUPPORTED_PLATFORMS = ["facebook", "threads", "tiktok"] as const;

// Top-100 "fetch comments" from the dashboard - every platform spider-hub
// has a comments spider for (see COMMENT_SUPPORTED_PLATFORMS).
export const TOP_POSTS_COMMENT_PLATFORMS = ["facebook", "threads", "tiktok"] as const;

// Platforms that show restore-session / import-cookies (and the live
// refresh log). Facebook/Threads recapture GraphQL tokens; TikTok
// recaptures device_id/odin_id from the saved cookie. None of them type
// a password from this card.
export const PLATFORMS_WITH_TOKEN_REFRESH = ["facebook", "threads", "tiktok"] as const;

// A dashboard-triggered refresh routinely finishes in well under a minute
// (saved session, headless, no login needed) - this just bounds how long a
// "refreshing..." state is trusted before the UI stops waiting on it, kept
// a little above cinemark-api's own server-side watch timeout (180s) so the
// server's "gave up watching" line has a chance to arrive first.
export const REFRESH_WATCH_TIMEOUT_MS = 200_000;

export const POSTS_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 20;
export const TABLE_PAGE_SIZE = 10;
// One page, no further pagination - the "top posts for this keyword" modal
// always asks for exactly this many (sort=engagement) rather than paging.
export const TOP_POSTS_LIMIT = 100;

// Fixed inner pane on the Logs page - tall enough to scan, short enough that
// the surrounding page does not grow and steal the scrollbar.
export const LOG_PANE_HEIGHT_PX = 360;

// Last-collected older than this is treated as "collection looks stuck"
// on the overview table (independent of log-tail errors).
export const STALE_CRAWL_MS = 24 * 60 * 60 * 1000;

export const QUERY_KEYS = {
  platformStats: ["platform-stats"] as const,
  timeseries: (days: number) => ["timeseries", days] as const,
  commentCounts: ["comment-counts"] as const,
  commentTimeseries: (days: number) => ["comment-timeseries", days] as const,
  keywordVolume: (platform?: string) => ["keyword-volume", platform ?? "all"] as const,
  tokenStatus: (platform: string) => ["token-status", platform] as const,
  jobStatus: (platform: string) => ["job-status", platform] as const,
  logs: (kind: "spider-hub" | "ingest", lines: number) => ["logs", kind, lines] as const,
  posts: (platform: string | undefined, offset: number) => ["posts", platform, offset] as const,
  topPostsByKeyword: (keywordId: string) => ["posts", "top", "keyword", keywordId] as const,
  topPostsByMovie: (movieId: string) => ["posts", "top", "movie", movieId] as const,
  comments: (postId: string) => ["comments", postId] as const,
  allComments: (platform: string | undefined, offset: number) => ["all-comments", platform, offset] as const,
  jobs: ["jobs"] as const,
  opsMetrics: ["ops-metrics"] as const,
  movies: ["movies"] as const,
  settingsAccounts: ["settings", "accounts"] as const,
};
