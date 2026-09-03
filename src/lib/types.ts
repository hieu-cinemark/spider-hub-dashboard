export interface PlatformStat {
  platform: string;
  count: number;
  last_scraped_at: string | null;
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
}

export interface RunScraperParams {
  keyword_id?: string;
  start_date?: string;
  end_date?: string;
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
}

export type AccountInput = Partial<Omit<Account, "id" | "created_at" | "updated_at">>;

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
}

export type ProxyInput = Partial<Omit<Proxy, "id" | "created_at" | "updated_at">>;

export interface CronJob {
  name: string;
  schedule: string;
  source: string;
  description: string;
  last_run_at: string | null;
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
