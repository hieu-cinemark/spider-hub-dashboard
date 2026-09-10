import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { QUERY_KEYS } from "@/lib/constants";
import { platformLabel } from "@/lib/platform";
import type { RunScraperParams } from "@/lib/types";

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
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  const refreshToken = useMutation({
    mutationFn: () => api.refreshToken(platform),
    onSuccess: (res) => {
      if (res.ok) message.success(t("toastTokenRefreshRequested", { platform: platformLabel(platform) }));
      else message.warning(t("toastTokenRefreshFailed"));
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  const stopCrawl = useMutation({
    mutationFn: () => api.stopCrawl(platform),
    onSuccess: (res) => {
      if (res.stopped) message.success(t("toastStopRequested", { platform: platformLabel(platform) }));
      else message.info(t("toastNothingToStop", { platform: platformLabel(platform) }));
      // Don't wait for the next poll - the running job is what gates the
      // Stop button's own visibility, so a stale "still running" read here
      // would let someone click Stop again on a job already being killed.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  return { runCrawl, refreshToken, stopCrawl };
}
