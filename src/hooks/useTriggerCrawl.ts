import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { dropPlatformFromJobsCache } from "@/hooks/useJobs";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { QUERY_KEYS } from "@/lib/constants";
import { platformLabel } from "@/lib/platform";
import type { JobStatus, JobsSnapshot, RunScraperParams } from "@/lib/types";

// The run-crawl and refresh-token mutations for one platform - toast +
// cache-invalidation wiring lives here once instead of repeating it per
// button. Actual refresh *progress* isn't tracked by this mutation (it just
// fires the request) - see useRefreshTokenStream for the live WS view.
export function useTriggerCrawl(platform: string) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const runCrawl = useMutation({
    mutationFn: (params: RunScraperParams = {}) => api.runCrawl(platform, params),
    onSuccess: (res) => {
      message.success(
        t("toastCrawlPublished", { platform: platformLabel(platform), published: res.published, requested: res.requested }),
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platformStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  const importCookies = useMutation({
    mutationFn: ({ accountId, cookies }: { accountId: number; cookies: string }) =>
      api.importCookies(platform, accountId, cookies),
    onSuccess: (res) => {
      if (res.ok) message.success(t("toastCookieImportRequested", { platform: platformLabel(platform) }));
      else message.warning(t("toastTokenRefreshFailed"));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tokenStatus(platform) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settingsAccounts });
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  const restoreSession = useMutation({
    mutationFn: (accountId: number) => api.restoreSession(platform, accountId),
    onSuccess: (res) => {
      if (res.ok) message.success(t("toastRestoreSessionRequested", { platform: platformLabel(platform) }));
      else message.warning(t("toastTokenRefreshFailed"));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tokenStatus(platform) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settingsAccounts });
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  const stopCrawl = useMutation({
    mutationFn: async () => {
      await api.stopCrawl(platform);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.jobs });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
      const previousJobs = queryClient.getQueryData<JobsSnapshot>(QUERY_KEYS.jobs);
      const previousStatus = queryClient.getQueryData<JobStatus>(QUERY_KEYS.jobStatus(platform));
      dropPlatformFromJobsCache(queryClient, platform);
      return { previousJobs, previousStatus };
    },
    onSuccess: () => {
      message.success(t("toastStopDone", { platform: platformLabel(platform) }));
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousJobs) queryClient.setQueryData(QUERY_KEYS.jobs, ctx.previousJobs);
      if (ctx?.previousStatus) queryClient.setQueryData(QUERY_KEYS.jobStatus(platform), ctx.previousStatus);
      message.error(translateApiError(err, t));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
    },
  });

  return { runCrawl, importCookies, restoreSession, stopCrawl };
}
