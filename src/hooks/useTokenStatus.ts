import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";

export function useTokenStatus(platform: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tokenStatus(platform),
    queryFn: () => api.tokenStatus(platform),
    refetchInterval: REFRESH_INTERVAL_MS.tokenStatus,
  });
}
