import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { checkStatusLabelKey } from "@/lib/accountHealth";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { REFRESH_INTERVAL_MS, QUERY_KEYS } from "@/lib/constants";
import type {
  AccountInput,
  AiProviderInput,
  AiSettingsInput,
  AutoLoginSettingsInput,
  CleanupSettingsInput,
  CommentScheduleInput,
  CrawlScheduleInput,
  FilterKeywordInput,
  NurtureInput,
  ImportCommitParams,
  ImportParseParams,
  ProxyInput,
  ProxyProviderInput,
  ProxySettings,
} from "@/lib/types";

const ACCOUNTS_KEY = QUERY_KEYS.settingsAccounts;
const CRAWL_SCHEDULE_KEY = ["settings", "crawl-schedule"];
const COMMENT_SCHEDULE_KEY = ["settings", "comment-schedule"];
const CLEANUP_SETTINGS_KEY = ["settings", "cleanup"];
const CLEANUP_HISTORY_KEY = ["settings", "cleanup-history"];

// Auto-login settings + history - same key shape as the cleanup pair
// (["settings", "<feature>"]) so query invalidation patterns from
// other features work without new wiring.
const AUTO_LOGIN_SETTINGS_KEY = ["settings", "auto-login"];
const AUTO_LOGIN_HISTORY_KEY = ["settings", "auto-login-history"];
const PROXIES_KEY = ["settings", "proxies"];
const FILTER_KEYWORDS_KEY = ["settings", "filter-keywords"];
const AI_SETTINGS_KEY = ["settings", "ai"];
const AI_PROVIDERS_KEY = ["settings", "ai-providers"];
const PROXY_SETTINGS_KEY = ["settings", "proxy-settings"];
const PROXY_PROVIDERS_KEY = ["settings", "proxy-providers"];

// Warms the Settings page's caches while the browser is idle (see AppShell),
// so opening Settings shows data immediately instead of a row of skeletons
// waiting on Supabase. Same keys/fns as the hooks below, so those pick the
// data straight up; prefetchQuery is a no-op for anything still fresh.
export function prefetchSettings(queryClient: QueryClient): void {
  const pairs: [readonly unknown[], () => Promise<unknown>][] = [
    [PROXIES_KEY, () => api.proxies()],
    [PROXY_SETTINGS_KEY, api.proxySettings],
    [PROXY_PROVIDERS_KEY, api.proxyProviders],
    [CRAWL_SCHEDULE_KEY, api.crawlSchedule],
    [COMMENT_SCHEDULE_KEY, api.commentSchedule],
  ];
  for (const [queryKey, queryFn] of pairs) {
    void queryClient.prefetchQuery({ queryKey, queryFn });
  }
}

export function useAccounts() {
  // `enabled` and last_check_status/last_checked_at can change from
  // spider-hub's own backend (bootstrap.py's disable_account() flips
  // enabled=false on a suspected checkpoint, a health check updates
  // last_check_status) with nobody touching this UI at all - without
  // polling, the Switch in AccountsTable stays on whatever it showed at
  // last mount/mutation, silently lying about which account spider-hub is
  // actually using. Same cadence as useTokenStatus, which the same class
  // of backend-driven change already polls for.
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: () => api.accounts(),
    refetchInterval: REFRESH_INTERVAL_MS.accounts,
  });
}

export function useAccountMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });

  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const create = useMutation({
    mutationFn: (input: AccountInput) => api.createAccount(input),
    onSuccess: () => {
      message.success(t("toastAccountAdded"));
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AccountInput }) => api.updateAccount(id, input),
    onSuccess: () => {
      message.success(t("toastAccountUpdated"));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteAccount(id),
    onSuccess: () => {
      message.success(t("toastAccountRemoved"));
      invalidate();
    },
    onError,
  });

  const check = useMutation({
    mutationFn: (id: number) => api.checkAccount(id),
    onSuccess: (account) => {
      message.success(t("toastAccountChecked", { status: t(checkStatusLabelKey(account.last_check_status)) }));
      invalidate();
    },
    onError,
  });

  const nurture = useMutation({
    mutationFn: (input: NurtureInput) => api.nurtureAccounts(input),
    onSuccess: (res) => {
      if (res.ok) message.success(t("toastNurtureQueued", { n: res.queued }));
      else message.warning(t("toastNurtureFailed"));
      queryClient.invalidateQueries({ queryKey: ["job-status"] });
    },
    onError,
  });

  const totpCode = useMutation({
    mutationFn: (id: number) => api.getTotpCode(id),
    onError,
  });

  const resetCookies = useMutation({
    mutationFn: (id: number) => api.resetTiktokCookies(id),
    onSuccess: (res) => {
      if (res.ok) message.success(t("toastCookiesResetRequested"));
      else message.warning(t("toastCookiesResetFailed"));
    },
    onError,
  });

  const resetProxy = useMutation({
    mutationFn: (id: number) => api.resetAccountProxy(id),
    onSuccess: () => {
      message.success(t("toastProxyResetRequested"));
      invalidate();
      queryClient.invalidateQueries({ queryKey: PROXIES_KEY });
    },
    onError,
  });

  const setProxy = useMutation({
    mutationFn: ({ id, proxyId }: { id: number; proxyId: number }) => api.setAccountProxy(id, proxyId),
    onSuccess: () => {
      message.success(t("toastProxyResetRequested"));
      invalidate();
      queryClient.invalidateQueries({ queryKey: PROXIES_KEY });
    },
    onError,
  });

  // No bulk enable/disable - `enabled` is pool-owned now (see AccountsTable's
  // now-read-only Switch column), not something to flip in bulk from here.
  const bulkRemove = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(ids.map((id) => api.deleteAccount(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      return { failed, total: ids.length };
    },
    onSuccess: ({ failed, total }) => {
      if (failed > 0) message.warning(t("toastBulkPartialFailure", { failed, total }));
      else message.success(t("toastBulkRemoved", { total }));
      invalidate();
    },
    onError,
  });

  return { create, update, remove, check, nurture, totpCode, resetCookies, resetProxy, setProxy, bulkRemove };
}

export function useProxies() {
  return useQuery({ queryKey: PROXIES_KEY, queryFn: () => api.proxies() });
}

export function useProxyMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PROXIES_KEY });

  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const create = useMutation({
    mutationFn: (input: ProxyInput) => api.createProxy(input),
    onSuccess: () => {
      message.success(t("toastProxyAdded"));
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProxyInput }) => api.updateProxy(id, input),
    onSuccess: () => {
      message.success(t("toastProxyUpdated"));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteProxy(id),
    onSuccess: () => {
      message.success(t("toastProxyRemoved"));
      invalidate();
    },
    onError,
  });

  return { create, update, remove };
}

export function useFilterKeywords() {
  return useQuery({ queryKey: FILTER_KEYWORDS_KEY, queryFn: () => api.filterKeywords() });
}

export function useFilterKeywordMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: FILTER_KEYWORDS_KEY });

  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const create = useMutation({
    mutationFn: (input: FilterKeywordInput) => api.createFilterKeyword(input),
    onSuccess: () => {
      message.success(t("toastFilterKeywordAdded"));
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: FilterKeywordInput }) => api.updateFilterKeyword(id, input),
    onSuccess: () => {
      message.success(t("toastFilterKeywordUpdated"));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteFilterKeyword(id),
    onSuccess: () => {
      message.success(t("toastFilterKeywordRemoved"));
      invalidate();
    },
    onError,
  });

  return { create, update, remove };
}

export function useImportMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const parse = useMutation({
    mutationFn: (params: ImportParseParams) => api.importParse(params),
    onError,
  });

  const commit = useMutation({
    mutationFn: (params: ImportCommitParams) => api.importCommit(params),
    onSuccess: (res, params) => {
      if (res.failed > 0) message.warning(t("toastImportPartial", { created: res.created, failed: res.failed }));
      else message.success(t("toastImportDone", { created: res.created }));
      const key = params.target === "accounts" ? ACCOUNTS_KEY : PROXIES_KEY;
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError,
  });

  return { parse, commit };
}

export function useCrawlSchedule() {
  return useQuery({ queryKey: CRAWL_SCHEDULE_KEY, queryFn: api.crawlSchedule });
}

export function useSetCrawlSchedule() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, input }: { platform: string; input: CrawlScheduleInput }) =>
      api.setCrawlSchedule(platform, input),
    onSuccess: () => {
      message.success(t("toastCrawlScheduleUpdated"));
      queryClient.invalidateQueries({ queryKey: CRAWL_SCHEDULE_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useAiSettings() {
  return useQuery({ queryKey: AI_SETTINGS_KEY, queryFn: api.aiSettings });
}

export function useSetAiSettings() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AiSettingsInput) => api.setAiSettings(input),
    onSuccess: () => {
      message.success(t("toastAiSettingsUpdated"));
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useAiProviders() {
  return useQuery({ queryKey: AI_PROVIDERS_KEY, queryFn: api.aiProviders });
}

export function useSetAiProvider() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: AiProviderInput }) => api.setAiProvider(key, input),
    onSuccess: () => {
      message.success(t("toastAiProviderUpdated"));
      // AI settings' own "configured" flag reads the kira provider row too.
      queryClient.invalidateQueries({ queryKey: AI_PROVIDERS_KEY });
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useProxySettings() {
  return useQuery({ queryKey: PROXY_SETTINGS_KEY, queryFn: api.proxySettings });
}

export function useSetProxySettings() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProxySettings) => api.setProxySettings(input),
    onSuccess: (data) => {
      message.success(t("toastProxySettingsUpdated"));
      queryClient.setQueryData(PROXY_SETTINGS_KEY, data);
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useProxyProviders() {
  return useQuery({ queryKey: PROXY_PROVIDERS_KEY, queryFn: api.proxyProviders });
}

export function useSetProxyProvider() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: ProxyProviderInput }) => api.setProxyProvider(key, input),
    onSuccess: () => {
      message.success(t("toastProxyProviderUpdated"));
      queryClient.invalidateQueries({ queryKey: PROXY_PROVIDERS_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useCommentSchedule() {
  return useQuery({ queryKey: COMMENT_SCHEDULE_KEY, queryFn: api.commentSchedule });
}

export function useSetCommentSchedule() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, input }: { platform: string; input: CommentScheduleInput }) =>
      api.setCommentSchedule(platform, input),
    onSuccess: () => {
      message.success(t("toastCommentScheduleUpdated"));
      queryClient.invalidateQueries({ queryKey: COMMENT_SCHEDULE_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

// Irrelevant-post cleanup (cinemark-api's app/services/cleanup.py +
// scheduler.py). The history poll is short (15s) because the operator
// expects the "Running…" state to clear promptly after a manual run
// finishes - the in-process purge takes seconds to a couple of minutes
// depending on backlog.
const CLEANUP_HISTORY_REFRESH_MS = 15_000;

export function useCleanupSettings() {
  return useQuery({
    queryKey: CLEANUP_SETTINGS_KEY,
    queryFn: api.cleanupSettings,
    refetchInterval: CLEANUP_HISTORY_REFRESH_MS,
  });
}

export function useSetCleanupSettings() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CleanupSettingsInput) => api.setCleanupSettings(input),
    onSuccess: (data) => {
      message.success(t("toastCleanupSettingsUpdated"));
      queryClient.setQueryData(CLEANUP_SETTINGS_KEY, data);
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useRunCleanup() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.runCleanup(),
    onSuccess: (res) => {
      if (res.started) message.success(t("toastCleanupStarted"));
      else message.warning(t("toastCleanupAlreadyRunning"));
      // Re-pull immediately so the "running" flag flips + a new history row
      // shows up without waiting out the refetchInterval.
      queryClient.invalidateQueries({ queryKey: CLEANUP_SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: CLEANUP_HISTORY_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useCleanupHistory(limit = 20) {
  return useQuery({
    queryKey: [...CLEANUP_HISTORY_KEY, limit],
    queryFn: () => api.cleanupHistory(limit),
    refetchInterval: CLEANUP_HISTORY_REFRESH_MS,
  });
}

// Auto-login hooks - same shape as the cleanup pair:
//  * useAutoLoginSettings() refetches every 10s so the "running" flag
//    and "last_run_at" surface the scheduler state without a manual
//    refresh (10s is shorter than the cleanup 15s because the
//    auto-login tick can be a few seconds and the operator wants to
//    see "running" flip back to false fast).
//  * useSetAutoLoginSettings() invalidates the settings + history
//    keys on success so the next pull shows the post-write values.
//  * useRunAutoLogin() invalidates both keys so the new history row
//    and the "running" flag land without a manual refresh.
//  * useAutoLoginHistory() reuses the same 10s polling cadence so the
//    table updates shortly after the scheduler or manual button
//    kicks a tick.
const AUTO_LOGIN_REFRESH_MS = 10_000;

export function useAutoLoginSettings() {
  return useQuery({
    queryKey: AUTO_LOGIN_SETTINGS_KEY,
    queryFn: api.autoLoginSettings,
    refetchInterval: AUTO_LOGIN_REFRESH_MS,
  });
}

export function useSetAutoLoginSettings() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AutoLoginSettingsInput) => api.setAutoLoginSettings(input),
    onSuccess: (data) => {
      message.success(t("toastAutoLoginSettingsUpdated"));
      queryClient.setQueryData(AUTO_LOGIN_SETTINGS_KEY, data);
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useRunAutoLogin() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.runAutoLogin(),
    onSuccess: (res) => {
      if (res.started) message.success(t("toastAutoLoginStarted"));
      else message.warning(t("toastAutoLoginAlreadyRunning"));
      queryClient.invalidateQueries({ queryKey: AUTO_LOGIN_SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: AUTO_LOGIN_HISTORY_KEY });
    },
    onError: (err: unknown) => message.error(translateApiError(err, t)),
  });
}

export function useAutoLoginHistory(limit = 20) {
  return useQuery({
    queryKey: [...AUTO_LOGIN_HISTORY_KEY, limit],
    queryFn: () => api.autoLoginHistory(limit),
    refetchInterval: AUTO_LOGIN_REFRESH_MS,
  });
}
