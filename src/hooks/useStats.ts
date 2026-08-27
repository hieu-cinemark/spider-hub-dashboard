import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS, REFRESH_INTERVAL_MS, TIMESERIES_DAYS } from "@/lib/constants";

export function usePlatformStats() {
  return useQuery({
    queryKey: QUERY_KEYS.platformStats,
    queryFn: api.platformStats,
    refetchInterval: REFRESH_INTERVAL_MS.stats,
  });
}

export function useTimeseries(days: number = TIMESERIES_DAYS) {
  return useQuery({
    queryKey: QUERY_KEYS.timeseries(days),
    queryFn: () => api.timeseries(days),
    refetchInterval: REFRESH_INTERVAL_MS.timeseries,
  });
}
