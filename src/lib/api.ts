import type {
  Account,
  AccountInput,
  AiProvider,
  AiProviderInput,
  AiSettings,
  AiSettingsInput,
  ApiErrorBody,
  Comment,
  CommentPage,
  CommentSchedule,
  CommentScheduleInput,
  CommentsQuery,
  CrawlSchedule,
  CrawlScheduleInput,
  ImportCommitParams,
  ImportCommitResponse,
  ImportParseParams,
  ImportParseResponse,
  FilterKeyword,
  FilterKeywordInput,
  JobStatus,
  JobsSnapshot,
  KafkaLagEntry,
  OpsMetricsResponse,
  Keyword,
  KeywordVolume,
  LogTailResponse,
  Movie,
  MovieInput,
  NurtureInput,
  NurtureResponse,
  PlatformStat,
  PostPage,
  PostsQuery,
  Proxy,
  ProxyInput,
  RunChannelVideosParams,
  RunChannelVideosResponse,
  RunCommentsResponse,
  RunScraperParams,
  RunScraperResponse,
  StopScraperResponse,
  TimeseriesPoint,
  TokenStatus,
  TotpCodeResponse,
  TriggerTokenRefreshResponse,
} from "./types";

// cinemark-api (FastAPI) - see cinemark-api/app/main.py. Public by design
// (no auth on this service today), so it's safe to expose as NEXT_PUBLIC_*
// and call directly from the browser.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Thrown by request() below. `code` is cinemark-api's machine-readable
// error.code (see app/core/errors.py's AppError subclasses - a closed set:
// not_found/unauthorized/forbidden/validation_error/conflict/upstream_error/
// internal_error) - undefined when the response had no parseable error body
// at all (e.g. the request never reached the server). Callers translate via
// translateApiError() in lib/apiError.ts instead of showing `message`
// directly, since `message` is raw English text from the backend.
export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Remote D1 round-trips can stall (Cloudflare HTTP API / DNS). Without a
// client timeout the dashboard stays on isLoading forever; 15s surfaces an
// error instead of hanging the whole Overview page.
const REQUEST_TIMEOUT_MS = 15_000;

type RequestOptions = RequestInit & { timeoutMs?: number };

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const { timeoutMs: _timeoutMs, signal: callerSignal, ...rest } = init ?? {};
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal ? AbortSignal.any([callerSignal, timeoutSignal]) : timeoutSignal;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) },
      cache: "no-store",
      ...rest,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new ApiError(`Request timed out after ${timeoutMs / 1000}s`, 0, "upstream_error");
    }
    throw err;
  }
  if (!res.ok) {
    const body: ApiErrorBody | null = await res.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? `Request failed (${res.status})`, res.status, body?.error?.code);
  }
  return res.json() as Promise<T>;
}

export const api = {
  platformStats: () => request<PlatformStat[]>("/stats/platforms"),
  timeseries: (days = 14) => request<TimeseriesPoint[]>(`/stats/timeseries?days=${days}`),
  commentCounts: () => request<PlatformStat[]>("/stats/comment-counts"),
  commentTimeseries: (days = 14) => request<TimeseriesPoint[]>(`/stats/comment-timeseries?days=${days}`),
  keywordVolume: (platform?: string) =>
    request<KeywordVolume[]>(`/stats/keywords${platform ? `?platform=${platform}` : ""}`),
  posts: ({ platform, keywordId, movieId, keywordMatch, sort, cursor, limit, offset }: PostsQuery, init?: RequestInit) =>
    request<PostPage>(
      `/stats/posts?${new URLSearchParams({
        ...(platform ? { platform } : {}),
        ...(keywordId ? { keyword_id: keywordId } : {}),
        ...(movieId ? { movie_id: movieId } : {}),
        ...(keywordMatch === undefined ? {} : { keyword_match: String(keywordMatch) }),
        ...(sort ? { sort } : {}),
        ...(cursor ? { cursor } : {}),
        limit: String(limit),
        // Only sort="engagement" (useTopPostsByKeyword/useTopPostsByMovie)
        // still uses offset - always 0, a single fixed-size batch.
        ...(offset === undefined ? {} : { offset: String(offset) }),
      })}`,
      { timeoutMs: 25_000, ...init },
    ),
  comments: (postId: string) => request<Comment[]>(`/stats/posts/${postId}/comments`),
  allComments: ({ platform, movieId, keywordId, sentiment, cursor, limit }: CommentsQuery, init?: RequestInit) =>
    request<CommentPage>(
      `/stats/comments?${new URLSearchParams({
        ...(platform ? { platform } : {}),
        ...(movieId ? { movie_id: movieId } : {}),
        ...(keywordId ? { keyword_id: keywordId } : {}),
        ...(sentiment ? { sentiment } : {}),
        ...(cursor ? { cursor } : {}),
        limit: String(limit),
      })}`,
      { timeoutMs: 25_000, ...init },
    ),
  runComments: (platform: string, postId: string) =>
    request<RunCommentsResponse>(`/${platform}/posts/${postId}/comments/run`, { method: "POST" }),
  runChannelVideos: (params: RunChannelVideosParams) =>
    request<RunChannelVideosResponse>("/tiktok/channels/run", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  spiderHubLogs: (lines = 300) => request<LogTailResponse>(`/logs/spider-hub?lines=${lines}`),
  ingestLogs: (lines = 300) => request<LogTailResponse>(`/logs/ingest?lines=${lines}`),
  tokenStatus: (platform: string) => request<TokenStatus>(`/${platform}/token-status`),
  keywords: (platform: string) => request<Keyword[]>(`/${platform}/keywords`),
  createKeyword: (platform: string, movieId: string, keyword: string) =>
    request<Keyword>(`/${platform}/keywords`, {
      method: "POST",
      body: JSON.stringify({ movie_id: movieId, keyword }),
    }),
  setKeywordEnabled: (platform: string, keywordId: string, enabled: boolean) =>
    request<Keyword>(`/${platform}/keywords/${keywordId}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  movies: () => request<Movie[]>("/movies"),
  createMovie: (input: MovieInput) => request<Movie>("/movies", { method: "POST", body: JSON.stringify(input) }),
  updateMovie: (id: string, input: MovieInput) =>
    request<Movie>(`/movies/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteMovie: (id: string) => request<{ ok: boolean }>(`/movies/${id}`, { method: "DELETE" }),
  // Two sequential Bee (Claude Sonnet 5) calls server-side - confirmed
  // live the topics-clustering call alone can take 2+ minutes on a
  // movie with a large comment sample (up to 400 comments, see
  // REPORT_COMMENT_SAMPLE_SIZE server-side), well past the default 15s
  // request timeout. 180s wasn't enough margin either - that's barely
  // above just the first of the two calls, with the narrative call still
  // to go - bumped to 10min to match app.bee.client's own OpenAI-client
  // timeout ceiling (app/ai_client.py has no explicit per-call timeout,
  // so it falls back to the SDK default of 600s/10min per call).
  generateMovieReport: (id: string) =>
    request<{ status: string }>(`/movies/${id}/generate-report`, { method: "POST", timeoutMs: 600_000 }),
  runCrawl: (platform: string, params: RunScraperParams = {}) =>
    request<RunScraperResponse>(`/${platform}/run`, { method: "POST", body: JSON.stringify(params) }),
  importCookies: (platform: string, accountId: number, cookies: string) =>
    request<TriggerTokenRefreshResponse>(`/${platform}/import-cookies`, {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, cookies }),
    }),
  restoreSession: (platform: string, accountId: number) =>
    request<TriggerTokenRefreshResponse>(`/${platform}/restore-session`, {
      method: "POST",
      body: JSON.stringify({ account_id: accountId }),
    }),
  jobStatus: (platform: string) => request<JobStatus>(`/${platform}/job-status`),
  jobs: () => request<JobsSnapshot>("/jobs"),
  kafkaLag: () => request<KafkaLagEntry[]>("/jobs/kafka-lag"),
  opsMetrics: () => request<OpsMetricsResponse>("/health/metrics"),
  stopCrawl: (platform: string) => request<StopScraperResponse>(`/${platform}/stop`, { method: "POST" }),
  // Stops exactly one job (see cinemark-api's crawl_jobs.cancel_job) -
  // unlike stopCrawl above, which is "Stop All" for the whole platform.
  stopJob: (platform: string, id: string) =>
    request<StopScraperResponse>(`/${platform}/jobs/${id}/stop`, { method: "POST" }),

  // Settings: platform_accounts / platform_proxies (Supabase, see
  // cinemark-api/app/services/platform_config_db.py)
  accounts: (platform?: string) => request<Account[]>(`/settings/accounts${platform ? `?platform=${platform}` : ""}`),
  createAccount: (input: AccountInput) =>
    request<Account>("/settings/accounts", { method: "POST", body: JSON.stringify(input) }),
  updateAccount: (id: number, input: AccountInput) =>
    request<Account>(`/settings/accounts/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteAccount: (id: number) => request<{ ok: boolean }>(`/settings/accounts/${id}`, { method: "DELETE" }),
  checkAccount: (id: number) => request<Account>(`/settings/accounts/${id}/check`, { method: "POST" }),
  nurtureAccounts: (input: NurtureInput) =>
    request<NurtureResponse>("/settings/accounts/nurture", { method: "POST", body: JSON.stringify(input) }),
  getTotpCode: (id: number) => request<TotpCodeResponse>(`/settings/accounts/${id}/totp-code`, { method: "POST" }),
  resetTiktokCookies: (id: number) => request<{ ok: boolean }>(`/settings/accounts/${id}/reset-cookies`, { method: "POST" }),
  resetAccountProxy: (id: number) => request<Account>(`/settings/accounts/${id}/reset-proxy`, { method: "POST" }),
  setAccountProxy: (id: number, proxyId: number) =>
    request<Account>(`/settings/accounts/${id}/set-proxy`, { method: "POST", body: JSON.stringify({ proxy_id: proxyId }) }),

  proxies: (platform?: string) => request<Proxy[]>(`/settings/proxies${platform ? `?platform=${platform}` : ""}`),
  createProxy: (input: ProxyInput) =>
    request<Proxy>("/settings/proxies", { method: "POST", body: JSON.stringify(input) }),
  updateProxy: (id: number, input: ProxyInput) =>
    request<Proxy>(`/settings/proxies/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProxy: (id: number) => request<{ ok: boolean }>(`/settings/proxies/${id}`, { method: "DELETE" }),

  // Settings: filter_keywords (Supabase, see cinemark-api's
  // app/services/platform_config_db.py) - movie-relevant vs spam/off-topic
  // keywords spider-hub reads to decide what's worth keeping.
  filterKeywords: (category?: string) =>
    request<FilterKeyword[]>(`/settings/filter-keywords${category ? `?category=${category}` : ""}`),
  createFilterKeyword: (input: FilterKeywordInput) =>
    request<FilterKeyword>("/settings/filter-keywords", { method: "POST", body: JSON.stringify(input) }),
  updateFilterKeyword: (id: number, input: FilterKeywordInput) =>
    request<FilterKeyword>(`/settings/filter-keywords/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteFilterKeyword: (id: number) => request<{ ok: boolean }>(`/settings/filter-keywords/${id}`, { method: "DELETE" }),

  crawlSchedule: () => request<CrawlSchedule[]>("/settings/crawl-schedule"),
  setCrawlSchedule: (platform: string, input: CrawlScheduleInput) =>
    request<CrawlSchedule>(`/settings/crawl-schedule/${platform}`, { method: "PUT", body: JSON.stringify(input) }),

  commentSchedule: () => request<CommentSchedule[]>("/settings/comment-schedule"),
  setCommentSchedule: (platform: string, input: CommentScheduleInput) =>
    request<CommentSchedule>(`/settings/comment-schedule/${platform}`, { method: "PUT", body: JSON.stringify(input) }),

  aiSettings: () => request<AiSettings>("/settings/ai"),
  setAiSettings: (input: AiSettingsInput) =>
    request<AiSettings>("/settings/ai", { method: "PUT", body: JSON.stringify(input) }),

  aiProviders: () => request<AiProvider[]>("/settings/ai/providers"),
  setAiProvider: (key: string, input: AiProviderInput) =>
    request<AiProvider>(`/settings/ai/providers/${key}`, { method: "PUT", body: JSON.stringify(input) }),

  importParse: (params: ImportParseParams) =>
    request<ImportParseResponse>("/settings/import/parse", { method: "POST", body: JSON.stringify(params) }),
  importCommit: (params: ImportCommitParams) =>
    request<ImportCommitResponse>("/settings/import/commit", { method: "POST", body: JSON.stringify(params) }),
};
