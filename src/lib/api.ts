import type {
  Account,
  AccountInput,
  ApiErrorBody,
  CronJob,
  Keyword,
  LogTailResponse,
  Movie,
  PlatformStat,
  Proxy,
  ProxyInput,
  RunScraperParams,
  RunScraperResponse,
  TimeseriesPoint,
  TokenStatus,
  TriggerTokenRefreshResponse,
} from "./types";

// cinemark-api (FastAPI) - see cinemark-api/app/main.py. Public by design
// (no auth on this service today), so it's safe to expose as NEXT_PUBLIC_*
// and call directly from the browser.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const body: ApiErrorBody | null = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  platformStats: () => request<PlatformStat[]>("/stats/platforms"),
  timeseries: (days = 14) => request<TimeseriesPoint[]>(`/stats/timeseries?days=${days}`),
  spiderHubLogs: (lines = 300) => request<LogTailResponse>(`/logs/spider-hub?lines=${lines}`),
  ingestLogs: (lines = 300) => request<LogTailResponse>(`/logs/ingest?lines=${lines}`),
  tokenStatus: (platform: string) => request<TokenStatus>(`/${platform}/token-status`),
  keywords: (platform: string) => request<Keyword[]>(`/${platform}/keywords`),
  createKeyword: (platform: string, movieId: string, keyword: string) =>
    request<Keyword>(`/${platform}/keywords`, {
      method: "POST",
      body: JSON.stringify({ movie_id: movieId, keyword }),
    }),
  movies: () => request<Movie[]>("/movies"),
  runCrawl: (platform: string, params: RunScraperParams = {}) =>
    request<RunScraperResponse>(`/${platform}/run`, { method: "POST", body: JSON.stringify(params) }),
  refreshToken: (platform: string) =>
    request<TriggerTokenRefreshResponse>(`/${platform}/refresh-token`, { method: "POST" }),

  // Settings: platform_accounts / platform_proxies (Supabase, see
  // cinemark-api/app/services/platform_config_db.py)
  accounts: (platform?: string) => request<Account[]>(`/settings/accounts${platform ? `?platform=${platform}` : ""}`),
  createAccount: (input: AccountInput) =>
    request<Account>("/settings/accounts", { method: "POST", body: JSON.stringify(input) }),
  updateAccount: (id: number, input: AccountInput) =>
    request<Account>(`/settings/accounts/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteAccount: (id: number) => request<{ ok: boolean }>(`/settings/accounts/${id}`, { method: "DELETE" }),

  proxies: (platform?: string) => request<Proxy[]>(`/settings/proxies${platform ? `?platform=${platform}` : ""}`),
  createProxy: (input: ProxyInput) =>
    request<Proxy>("/settings/proxies", { method: "POST", body: JSON.stringify(input) }),
  updateProxy: (id: number, input: ProxyInput) =>
    request<Proxy>(`/settings/proxies/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProxy: (id: number) => request<{ ok: boolean }>(`/settings/proxies/${id}`, { method: "DELETE" }),

  cronJobs: () => request<CronJob[]>("/cron/jobs"),
};
