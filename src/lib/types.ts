export interface PlatformStat {
  platform: string;
  count: number;
  last_scraped_at: string | null;
  count_today?: number;
  count_prev?: number;
}

export interface RelatedHashtag {
  id: string;
  title: string;
  count: number;
  bfs_depth?: number;
}

export interface KeywordVolume {
  keyword_id: string;
  movie_id?: string;
  keyword: string;
  platform: string;
  enabled: boolean;
  movie_title: string | null;
  posts_total: number;
  posts_today: number;
  posts_prev: number;
  comments_total: number;
  comments_today: number;
  comments_prev: number;
  last_scraped_at: string | null;
  related_hashtags?: RelatedHashtag[];
}

export interface TimeseriesPoint {
  day: string;
  platform: string;
  count: number;
}

export interface Post {
  id: string;
  platform: string;
  external_id: string;
  url: string | null;
  author: string | null;
  content: string | null;
  media_type: string | number | null;
  media_url: string | null;
  like_count: number;
  reply_count: number;
  repost_count: number;
  quote_count: number;
  reshare_count: number;
  view_count: number;
  posted_at: string | null;
  scraped_at: string;
  keyword_match: boolean;
  keyword: string | null;
  movie_title: string | null;
}

export interface PostPage {
  items: Post[];
  total: number;
  limit: number;
  offset: number;
}

export interface PostsQuery {
  platform?: string;
  keywordId?: string;
  movieId?: string;
  sort?: "recent" | "engagement";
  limit: number;
  offset: number;
}

// Facebook-only for now - see cinemark-api's get_comment_mapper.
export interface Comment {
  id: string;
  post_id: string;
  platform: string;
  external_id: string;
  message: string | null;
  author_name: string | null;
  author_id: string | null;
  author_url: string | null;
  author_profile_picture: string | null;
  reactions_count: number;
  replies_count: number;
  parent_external_id: string | null;
  parent_message: string | null;
  parent_author_name: string | null;
  posted_at: string | null;
  scraped_at: string;
}

export interface RunCommentsResponse {
  published: boolean;
}

export interface RunChannelVideosParams {
  username: string;
  max_pages?: number;
  keyword_id?: string;
}

export interface RunChannelVideosResponse {
  published: boolean;
}

export interface CommentWithPost extends Comment {
  post_content: string | null;
  post_url: string | null;
  post_author: string | null;
  movie_title: string | null;
}

export interface CommentPage {
  items: CommentWithPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommentsQuery {
  platform?: string;
  movieId?: string;
  limit: number;
  offset: number;
}

export interface LogTailResponse {
  ok: boolean;
  source: string;
  lines: string[];
}

export interface RunScraperResponse {
  requested: number;
  published: number;
}

export interface Keyword {
  id: string;
  movie_id: string;
  movie_title: string;
  keyword: string;
}

export interface Movie {
  id: string;
  title: string;
  slug?: string | null;
  released_at?: string | null;
  poster_url?: string | null;
  description?: string | null;
  director?: string | null;
  cast?: string | null;
  distributor?: string | null;
}

export interface MovieInput {
  title: string;
  slug?: string | null;
  released_at?: string | null;
  poster_url?: string | null;
  description?: string | null;
  director?: string | null;
  cast?: string | null;
  distributor?: string | null;
}

export interface RunScraperParams {
  keyword_id?: string;
  start_date?: string;
  end_date?: string;
  max_pages?: number;
  bfs_depth?: number;
}

export interface Account {
  id: number;
  platform: string;
  account_id: string;
  password: string;
  totp_secret: string;
  cookie: string;
  token: string;
  email: string;
  email_password: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  // Written by POST /settings/accounts/{id}/check (see cinemark-api's
  // app/services/account_health.py) - null until the first check ever
  // runs. status is a plain string ("ok" | "warning" | "disabled" |
  // "unknown"), not an enum, matching the Postgres column.
  last_checked_at: string | null;
  last_check_status: string | null;
  // AI-generated diagnosis (spider-hub's services/kira.
  // diagnose_account_failure) whenever this account gets hard-disabled -
  // null once it's healthy again.
  last_check_note: string | null;
  // Pool / circuit-breaker + sticky proxy pinning - written by spider-hub
  // (services/pool.py, services/db.py), read-only here. pool_status is
  // "active" | "checkpoint" (see db.record_account_outcome) - a
  // *different* signal from last_check_status above (that one's a manual/
  // periodic health check; this one's the live acquire/release outcome
  // from the account's actual last crawl attempt).
  pool_status: string;
  cooldown_until: string | null;
  consecutive_failures: number;
  last_used_at: string | null;
  assigned_proxy_id: number | null;
}

export type AccountInput = Partial<
  Omit<
    Account,
    | "id"
    | "created_at"
    | "updated_at"
    | "last_checked_at"
    | "last_check_status"
    | "last_check_note"
    | "pool_status"
    | "cooldown_until"
    | "consecutive_failures"
    | "last_used_at"
    | "assigned_proxy_id"
  >
>;

export interface Proxy {
  id: number;
  platform: string;
  proxy_url: string;
  username: string;
  password: string;
  login_use_proxy: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  // Pool / circuit-breaker - written by spider-hub (services/db.py),
  // read-only here. pool_status is "active" | "degraded".
  pool_status: string;
  cooldown_until: string | null;
  consecutive_failures: number;
  last_used_at: string | null;
  // How many accounts are currently sticky-pinned to this proxy - see
  // cinemark-api's platform_config_db.list_proxies.
  assigned_account_count: number;
}

export type ProxyInput = Partial<
  Omit<
    Proxy,
    | "id"
    | "created_at"
    | "updated_at"
    | "pool_status"
    | "cooldown_until"
    | "consecutive_failures"
    | "last_used_at"
    | "assigned_account_count"
  >
>;

// Generic (not platform-scoped) content filter - movie-relevant vs
// spam/off-topic keywords, see cinemark-api's app/services/
// platform_config_db.py (filter_keywords table) and spider-hub's own read
// side (services/db.py's get_filter_keywords).
export type FilterKeywordCategory = "movie_relevant" | "spam_offtopic";

export interface FilterKeyword {
  id: number;
  keyword: string;
  category: FilterKeywordCategory;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type FilterKeywordInput = Partial<Omit<FilterKeyword, "id" | "created_at" | "updated_at">>;

// Per-platform daily crawl time - dashboard-editable (see cinemark-api's
// GET/PUT /settings/crawl-schedule + app/services/scheduler.py, an
// in-process scheduler that replaced both an OS crontab entry and
// cinemark-scraper's Cloudflare Cron Triggers). run_time is "HH:MM",
// interpreted in a fixed Asia/Ho_Chi_Minh timezone server-side.
// Current 2FA code for one account, computed server-side from its own
// stored totp_secret (see cinemark-api's POST /settings/accounts/{id}/
// totp-code) - for a human completing a manual login themselves, never
// typed in automatically.
export interface TotpCodeResponse {
  code: string;
  expires_in_seconds: number;
}

export interface CrawlSchedule {
  platform: string;
  run_time: string;
  enabled: boolean;
  last_triggered_date: string | null;
  nurture_before: boolean;
  nurture_after: boolean;
  updated_at: string;
}

export interface CrawlScheduleInput {
  run_time: string;
  enabled: boolean;
  nurture_before: boolean;
  nurture_after: boolean;
}

export interface AiPrompt {
  task: string;
  system_prompt: string;
  default_system_prompt: string;
}

export interface AiSettings {
  enabled: boolean;
  model: string;
  configured: boolean;
  prompts: AiPrompt[];
  updated_at: string | null;
}

export interface AiSettingsInput {
  enabled: boolean;
  model: string;
  prompts: Record<string, string>;
}

export type NurturePlatform = "facebook" | "threads" | "all";

export interface NurtureInput {
  platform?: NurturePlatform;
  account_id?: number;
  like?: boolean;
  comment?: boolean;
  visits?: number;
}

export interface NurtureResponse {
  ok: boolean;
  queued: number;
}

// AI-assisted bulk import (see cinemark-api's app/kira/import_parser.py +
// POST /settings/import/parse|commit) - paste raw account/proxy data plus a
// plain-language description of its shape, get back structured rows to
// review before committing. ImportRow's exact keys depend on `target`
// (account_id/password/... vs proxy_url/username/...) - kept loose here
// since the UI renders whichever keys came back generically.
export type ImportTarget = "accounts" | "proxies";
export type ImportRow = Record<string, string | boolean>;

export interface ImportParseParams {
  target: ImportTarget;
  format_hint: string;
  content: string;
}

export interface ImportParseResponse {
  rows: ImportRow[];
}

export interface ImportCommitParams {
  target: ImportTarget;
  platform: string;
  rows: ImportRow[];
}

export interface ImportCommitResponse {
  created: number;
  failed: number;
}

export interface TriggerTokenRefreshResponse {
  ok: boolean;
}

export interface TokenStatus {
  valid: boolean;
  account: string | null;
  expires_in_seconds: number | null;
}

export interface JobStatus {
  running: boolean;
  keyword: string | null;
  keyword_id: string | null;
  started_at: number | null;
  type: string | null;
  account?: string | null;
  post_id?: string | null;
  username?: string | null;
}

export interface JobTask {
  id: string;
  platform: string;
  type: string;
  label: string;
  keyword_id?: string | null;
  post_id?: string | null;
  status: string;
  queued_at?: number | null;
  started_at?: number | null;
  finished_at?: number | null;
  error?: string | null;
}

export interface JobsSnapshot {
  running: JobTask[];
  queued: JobTask[];
  history: JobTask[];
}

export interface OpsMetricPoint {
  ts: number;
  load_1: number;
  load_5?: number;
  load_15?: number;
  rss_mb: number;
  running: number;
  queued: number;
  done_15m?: number;
  failed_15m?: number;
}

export interface OpsMetricsResponse {
  current: OpsMetricPoint;
  series: OpsMetricPoint[];
}

export interface StopScraperResponse {
  stopped: boolean;
}

export interface ApiErrorBody {
  error?: { code: string; message: string };
}

// Live progress of a triggered token refresh, streamed over
// /<platform>/refresh-token/ws - see cinemark-api/app/services/refresh_tracker.py.
export type RefreshStatus = "idle" | "running" | "success" | "failed";

export type RefreshSocketMessage =
  | { type: "snapshot"; status: RefreshStatus; started_at: string | null; finished_at: string | null; lines: string[] }
  | { type: "line"; line: string }
  | { type: "status"; status: RefreshStatus; finished_at?: string | null };
