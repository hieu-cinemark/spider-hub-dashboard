import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { POSTS_PAGE_SIZE, QUERY_KEYS, REFRESH_INTERVAL_MS, TIMESERIES_DAYS } from "@/lib/constants";

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

export function usePosts(platform: string | undefined, page: number) {
  const offset = page * POSTS_PAGE_SIZE;
  return useQuery({
    queryKey: QUERY_KEYS.posts(platform, offset),
    queryFn: () => api.posts({ platform, limit: POSTS_PAGE_SIZE, offset }),
    placeholderData: (previous) => previous,
  });
}
