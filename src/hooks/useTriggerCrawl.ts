import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { platformLabel } from "@/lib/platform";
import type { RunScraperParams } from "@/lib/types";

// The run-crawl and refresh-token mutations for one platform - toast +
// cache-invalidation wiring lives here once instead of repeating it per
// button. Actual refresh *progress* isn't tracked by this mutation (it just
// fires the request) - see useRefreshTokenStream for the live WS view.
export function useTriggerCrawl(platform: string) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const runCrawl = useMutation({
    mutationFn: (params: RunScraperParams = {}) => api.runCrawl(platform, params),
    onSuccess: (res) => {
      message.success(`${platformLabel(platform)}: published ${res.published}/${res.requested} keyword crawl(s)`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platformStats });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : "Request failed"),
  });

  const refreshToken = useMutation({
    mutationFn: () => api.refreshToken(platform),
    onSuccess: (res) => {
      if (res.ok) message.success(`${platformLabel(platform)} token refresh requested`);
      else message.warning("Could not publish token refresh (Kafka down?)");
    },
    onError: (err) => message.error(err instanceof Error ? err.message : "Request failed"),
  });

  return { runCrawl, refreshToken };
}
