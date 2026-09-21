import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";
import { usePollingInterval } from "@/hooks/usePollingInterval";

// Whether spider-hub's crawl_request_consumer.py is currently running a
// dashboard-triggered job for this platform - drives the Stop button (see
// CrawlTriggerForm) showing/enabling itself, same polling shape as
// useTokenStatus.
export function useJobStatus(platform: string, enabled = true) {
  const refetchInterval = usePollingInterval(REFRESH_INTERVAL_MS.jobStatusActive, enabled);
  return useQuery({
    queryKey: QUERY_KEYS.jobStatus(platform),
    queryFn: () => api.jobStatus(platform),
    refetchInterval,
    refetchOnWindowFocus: false,
    enabled,
  });
}
