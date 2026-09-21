import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";
import { usePollingInterval } from "@/hooks/usePollingInterval";

export function useTokenStatus(platform: string, enabled = true) {
  const refetchInterval = usePollingInterval(REFRESH_INTERVAL_MS.tokenStatus, enabled && Boolean(platform));
  return useQuery({
    queryKey: QUERY_KEYS.tokenStatus(platform),
    queryFn: () => api.tokenStatus(platform),
    refetchInterval,
    refetchOnWindowFocus: false,
    enabled: enabled && Boolean(platform),
  });
}
