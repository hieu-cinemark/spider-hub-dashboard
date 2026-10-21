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
  quoted?: QuotedPost | null;
}

export interface QuotedPost {
  author?: string | null;
  content?: string | null;
  url?: string | null;
  media_url?: string | null;
}

// Keyset-paginated (sort="recent") - nextCursor is the opaque token for
// the next page, null on the last page. sort="engagement" callers
// (useTopPostsByKeyword/useTopPostsByMovie) fetch one fixed-size batch
// and never paginate, so nextCursor is simply unused there.
export interface PostPage {
  items: Post[];
  nextCursor: string | null;
}

export interface PostsQuery {
  platform?: string;
  keywordId?: string;
  movieId?: string;
  keywordMatch?: boolean;
  sort?: "recent" | "engagement";
  cursor?: string | null;
  limit: number;
  offset?: number;
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
  sentiment?: string | null;
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
  keyword?: string | null;
}

export interface CommentPage {
  items: CommentWithPost[];
  nextCursor: string | null;
}

export interface CommentsQuery {
  platform?: string;
  movieId?: string;
  keywordId?: string;
  sentiment?: string;
  cursor?: string | null;
  limit: number;
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
  recent_post?: boolean;
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
  // AI-generated diagnosis (spider-hub's clients/ai.
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
  // The secret fields above always come back "" from the list/update
  // endpoints - this names which ones actually hold a value. Real values:
  // api.accountCredentials (GET /settings/accounts/{id}/credentials).
  secrets_set?: string[];
}

export interface AccountCredentials {
  id: number;
  password: string;
  totp_secret: string;
  cookie: string;
  token: string;
  email_password: string;
}

export interface IngestFunnel {
  platform: string;
  received: number;
  new: number;
  updated: number;
  dropped: Record<string, number>;
}

export interface HourlyPoint {
  hour: string;
  platform: string;
  posts: number;
  comments: number;
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
  /** First run of the day (kept for older API builds) - the full list is run_times. */
  run_time: string;
  /** 1-3 daily run times "HH:mm", sorted. */
  run_times?: string[];
  enabled: boolean;
  last_triggered_date: string | null;
  nurture_before: boolean;
  nurture_after: boolean;
  updated_at: string;
}

export interface CrawlScheduleInput {
  run_times: string[];
  enabled: boolean;
  nurture_before: boolean;
  nurture_after: boolean;
}

// Separate daily schedule for the comments sweep - independent of
// CrawlSchedule (posts) above, see cinemark-api's
// app/services/scheduler.py::_comments_tick. For every enabled keyword on
// that platform, queues a comments crawl for its top `top_n`-by-engagement
// posts that still have zero comments stored.
export interface CommentSchedule {
  platform: string;
  run_time: string;
  enabled: boolean;
  top_n: number;
  last_triggered_date: string | null;
  updated_at: string;
}

export interface CommentScheduleInput {
  run_time: string;
  enabled: boolean;
  top_n: number;
}

// Settings-editable knobs for the daily irrelevant-post purge
// (cinemark-api's app/services/cleanup.py + scheduler.py). Mirrors
// cinemark-api/app/schemas/settings.py's CleanupSettings/CleanupSettingsOut.
export interface CleanupSettings {
  run_time: string;
  enabled: boolean;
  grace_hours: number;
}

export interface CleanupRunSummary {
  id: number;
  started_at: string;
  finished_at: string | null;
  dry_run: boolean;
  triggered_by: "schedule" | "manual";
  posts_deleted: number;
  comments_deleted: number;
  snapshots_deleted: number;
  batches: number;
  remaining_posts: number | null;
  error: string | null;
}

export interface CleanupSettingsResponse {
  values: CleanupSettings;
  defaults: CleanupSettings;
  last_run_at: string | null;
  last_run_summary: CleanupRunSummary | null;
  running: boolean;
  updated_at: string | null;
}

export type CleanupSettingsInput = Partial<CleanupSettings>;

// --- Auto-login scheduler (cinemark-api's app/services/auto_login.py +
// app/services/scheduler.py + spider-hub's auto_login_consumer.py) ---
// Mirrors cinemark-api/app/schemas/settings.py:AutoLoginSettings +
// AutoLoginSettingsOut + AutoLoginRunHistoryEntry. The dashboard's
// "Auto-login" card talks to these via /settings/auto-login (GET/PUT)
// and /settings/auto-login/run (POST).
export type AutoLoginPlatform = "facebook" | "threads";

export interface AutoLoginSettings {
  enabled: boolean;
  // Hour interval in seconds - kept as `number` (not "HH:MM" string)
  // because the operator who picks the interval cares about minutes, not
  // wall-clock alignment with any other daily cron. The Cleanup
  // schedule uses "HH:MM" because it's once-a-day and benefits from
  // "fires alongside the crawl at 03:00"; auto-login runs hourly+
  // and a fixed-minute-of-hour clock would just be noise.
  interval_seconds: number;
  platforms: AutoLoginPlatform[];
  // dry_run=true publishes the Kafka message with dry_run=true;
  // spider-hub's auto_login_consumer.py reads that flag and skips
  // the actual Playwright launch (logs "would have relogged_in
  // this account" instead). Lets an operator sanity-check the
  // candidate list without a single real login firing.
  dry_run: boolean;
  min_age_seconds: number;
  telegram_alert: boolean;
}

export interface AutoLoginRunHistoryEntry {
  started_at: string;
  finished_at: string | null;
  triggered_by: "schedule" | "manual";
  dry_run: boolean;
  interval_seconds: number;
  platforms: string[];
  // { "<platform>": { "attempted": N, "relogged_in": N, ... } }
  per_platform: Record<string, Record<string, number>>;
  total_attempted: number;
  total_relogged_in: number;
  total_needs_human: number;
  total_failed: number;
  total_error: number;
  kafka_published: number;
  kafka_publish_failed: number;
  error: string | null;
}

export interface AutoLoginSettingsResponse {
  values: AutoLoginSettings;
  defaults: AutoLoginSettings;
  running: boolean;
  last_run_at: string | null;
  updated_at: string | null;
}

export type AutoLoginSettingsInput = Partial<AutoLoginSettings>;

export interface AiPrompt {
  task: string;
  system_prompt: string;
  default_system_prompt: string;
}

/** Kira đã bỏ (2026-10-21) - report luôn do Bee viết; trường này chỉ còn để tương thích API. */
export type ReportAiProvider = "kira" | "bee";

export interface AiSettings {
  enabled: boolean;
  model: string;
  configured: boolean;
  prompts: AiPrompt[];
  // Which provider generates social_topic_reports (cinemark-api's
  // app/bee/report.py) - independent of `enabled` above, which only gates
  // ingest-time classifiers.
  active_report_provider: ReportAiProvider;
  updated_at: string | null;
}

export interface AiSettingsInput {
  enabled: boolean;
  model: string;
  prompts: Record<string, string>;
  active_report_provider: ReportAiProvider;
}

// One LLM provider's credentials (base_url/api_key/model) - see
// cinemark-api's app/ai_client.py + app/services/platform_config_db.py's
// ai_providers table. api_key is never sent back by the API, only whether
// one is stored.
export interface AiProvider {
  key: string;
  base_url: string;
  api_key_set: boolean;
  model: string;
  updated_at: string | null;
}

export interface AiProviderInput {
  base_url: string;
  // Omit or blank to keep whatever secret is already stored.
  api_key?: string;
  model: string;
}

// Proxy behavior tunables spider-hub reads (cinemark-api /settings/proxy).
// Field names/defaults mirror spider-hub's services/proxy_settings.py.
export interface ProxySettings {
  repin_after_consecutive_failures: number;
  cooldown_base_minutes: number;
  cooldown_max_minutes: number;
  health_check_ping_url: string;
  health_check_timeout_seconds: number;
  health_check_alert_after_failures: number;
  health_check_streak_ttl_hours: number;
  provider_request_timeout_seconds: number;
  provider_min_get_new_interval_seconds: number;
  provider_max_cooldown_wait_seconds: number;
  exhausted_backoff_base_seconds: number;
  exhausted_backoff_growth_factor: number;
  exhausted_backoff_max_seconds: number;
  exhausted_max_requeues: number;
  tiktok_synthetic_provider: string;
  tiktok_hashtag_max_attempts: number;
  tiktok_comments_max_attempts: number;
}

export interface ProxySettingsResponse {
  values: ProxySettings;
  defaults: ProxySettings;
  updated_at: string | null;
}

export interface ProxyProvider {
  key: string;
  api_url: string;
  token_set: boolean;
  ip_allowlist: boolean;
  updated_at: string | null;
  // Lần spider-hub thực sự dùng gói này và kết quả ("ok" / "error: ...").
  last_used_at: string | null;
  last_status: string | null;
}

export interface ProxyProviderInput {
  api_url: string;
  // Omit or blank to keep whatever token is already stored.
  token?: string;
  ip_allowlist: boolean;
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

// AI-assisted bulk import (see cinemark-api's app/ai/tasks/import_parser.py +
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

// Real, broker-computed backlog per Kafka consumer group (cinemark-api's
// GET /jobs/kafka-lag) - a different, ground-truth number from
// JobsSnapshot.queued above, which is app-tracked bookkeeping that can get
// stuck if a consumer never gets to clear an entry. lag is null when the
// broker couldn't be reached or the topic wasn't found (see `error`).
export interface KafkaLagEntry {
  label: string;
  topic: string;
  group_id: string;
  lag: number | null;
  error: string | null;
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

// GET /omar/status (cinemark-api app/api/routes/omar.py).
export interface OmarHashtagProgress {
  keyword_id: string;
  hashtag: string;
  movie: string | null;
  pages: number;
  cursor: string | null;
  done_at: string | null;
  fresh_at: string | null;
  video_count: number | null;
  view_count: number | null;
  info_at: string | null;
  missing_at: string | null;
}

export interface OmarCommentsJob {
  week: string;
  trigger: string;
  queued_at: string;
  hashtags: number;
  videos: number;
  kept_from_before: number;
  finished_at: string | null;
  comments: number;
  replies: number;
  published: number;
}

export interface OmarSearchQuery {
  query: string;
  movie: string;
  movie_id: string;
  source: "title" | "title_plain" | "social" | "custom" | "suggest";
  id: string | null;
  last: { at: string; videos: number; published: number } | null;
}

export interface OmarSearchResponse {
  queries: OmarSearchQuery[];
  modes: { date?: string; sort?: string }[];
  pages: number;
}

export interface OmarYieldMetrics {
  requests: number;
  sent: number;
  new: number;
  new_per_100?: number | null;
}

export interface OmarYieldResponse {
  days: { day: string; sources: Record<string, OmarYieldMetrics> }[];
  totals: Record<string, OmarYieldMetrics>;
  shares: Record<string, number>;
  base_shares: Record<string, number>;
}

export interface OmarTrendingVideo {
  video_id: string;
  url: string | null;
  author: string | null;
  desc: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  velocity: { views_per_hour: number; comments_per_hour: number; growth_pct_per_hour: number | null; span_hours: number };
  hot: boolean;
}

export interface OmarTrendingResponse {
  hours: number;
  movies: { movie_id: string; title: string; hot: number; videos: OmarTrendingVideo[] }[];
}

export interface OmarStatus {
  key_set: boolean;
  usage: {
    plan: string | null;
    status: string | null;
    expires_at: string | null;
    day?: { limit: number; used: number; remaining: number; resets_in: number };
    minute?: { limit: number; used: number; remaining: number; resets_in: number };
  } | null;
  /** Lượt Omar đang dừng chờ hạn mức reset (quota) hoặc key mới (key); null khi chạy bình thường. */
  paused?: { reason: "quota" | "key"; until: string; at: string } | null;
  round: {
    running: boolean;
    trigger: string | null;
    started_at: string | null;
    finished_at: string | null;
    stop_requested: boolean;
    stats: {
      budget?: number;
      requests?: number;
      videos?: number;
      published?: number;
      skipped_seen?: number;
      keywords?: number;
      failed?: number;
      stopped?: string;
      comment_videos?: number;
      comment_requests?: number;
      comments?: number;
      comment_replies?: number;
      comments_published?: number;
      search_queries?: number;
      search_requests?: number;
      search_videos?: number;
      channels?: number;
      channel_requests?: number;
      channel_videos?: number;
      channel_matched?: number;
    };
  };
  mode: "continuous" | "spread_daily";
  hashtags: OmarHashtagProgress[];
  channels?: {
    tracked: number;
    done_today: number;
    max_channels: number;
    days: number;
    latest: { handle: string; newest_video_at: string | null }[];
  };
  comments: {
    last: OmarCommentsJob | null;
    pending_videos: number;
    weekday: number;
    time: string;
    top_per_hashtag: number;
  };
  totals: { hashtags: number; finished: number; started: number; pages: number; tiktok_videos: number };
}

/** Hiệu quả một từ khoá Facebook/Threads 14 ngày qua (cinemark-api app/services/keyword_yield.py). */
export interface KeywordYield {
  id: string;
  keyword: string;
  movie_title: string;
  enabled: boolean;
  /** Bị tự tắt vì tỉ lệ bài liên quan quá thấp. */
  auto_paused: boolean;
  stored?: number;
  relevant?: number;
  matched?: number;
  dropped?: number;
  sample: number;
  /** 0-1, null = chưa có dữ liệu. */
  ratio: number | null;
}

/** Trang nguồn Facebook (cinemark-api app/services/source_pages.py). movie_id null = trang chung nhiều phim. */
export interface SourcePage {
  id: string;
  url: string;
  page_id: string | null;
  name: string | null;
  movie_id: string | null;
  movie_title: string | null;
  enabled: number;
  last_queued_at: string | null;
  created_at: string;
  /** "ai" = AI (Bee) tự duyệt thêm, "manual" = người thêm. */
  added_by: string | null;
  ai_reason: string | null;
  /** Số lượt cào liền không có bài mới - lịch cào giãn gấp đôi mỗi lượt (tối đa x8). */
  quiet_runs: number;
}

export interface SourcePageSuggestion {
  kind: "film" | "shared";
  movie_id: string | null;
  movie_title: string | null;
  name: string;
  url: string;
  posts: number;
  engagement: number;
  films: string[];
}
