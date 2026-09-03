import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";

// Whether spider-hub's crawl_request_consumer.py is currently running a
// dashboard-triggered job for this platform - drives the Stop button (see
// CrawlTriggerForm) showing/enabling itself, same polling shape as
// useTokenStatus.
export function useJobStatus(platform: string) {
  return useQuery({
    queryKey: QUERY_KEYS.jobStatus(platform),
    queryFn: () => api.jobStatus(platform),
    refetchInterval: REFRESH_INTERVAL_MS.jobStatus,
  });
}
