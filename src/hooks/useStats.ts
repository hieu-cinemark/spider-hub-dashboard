import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import {
  COMMENTS_PAGE_SIZE,
  POSTS_PAGE_SIZE,
  QUERY_KEYS,
  REFRESH_INTERVAL_MS,
  TIMESERIES_DAYS,
  TOP_POSTS_LIMIT,
} from "@/lib/constants";

export function usePlatformStats() {
  return useQuery({
    queryKey: QUERY_KEYS.platformStats,
    queryFn: api.platformStats,
    staleTime: REFRESH_INTERVAL_MS.stats,
    refetchInterval: REFRESH_INTERVAL_MS.stats,
    refetchOnWindowFocus: false,
  });
}

export function useTimeseries(days: number = TIMESERIES_DAYS) {
  return useQuery({
    queryKey: QUERY_KEYS.timeseries(days),
    queryFn: () => api.timeseries(days),
    staleTime: REFRESH_INTERVAL_MS.timeseries,
    refetchInterval: REFRESH_INTERVAL_MS.timeseries,
    refetchOnWindowFocus: false,
  });
}

export function useCommentCounts() {
  return useQuery({
    queryKey: QUERY_KEYS.commentCounts,
    queryFn: api.commentCounts,
    staleTime: REFRESH_INTERVAL_MS.stats,
    refetchInterval: REFRESH_INTERVAL_MS.stats,
    refetchOnWindowFocus: false,
  });
}

export function useCommentTimeseries(days: number = TIMESERIES_DAYS) {
  return useQuery({
    queryKey: QUERY_KEYS.commentTimeseries(days),
    queryFn: () => api.commentTimeseries(days),
    staleTime: REFRESH_INTERVAL_MS.timeseries,
    refetchInterval: REFRESH_INTERVAL_MS.timeseries,
    refetchOnWindowFocus: false,
  });
}

export function useKeywordVolume(platform?: string, enabled = true) {
  const tiktokLive = platform === "tiktok";
  const refetchInterval = usePollingInterval(tiktokLive ? 15_000 : REFRESH_INTERVAL_MS.stats, enabled && tiktokLive);
  return useQuery({
    queryKey: QUERY_KEYS.keywordVolume(platform),
    queryFn: () => api.keywordVolume(platform),
    staleTime: REFRESH_INTERVAL_MS.stats,
    refetchInterval: tiktokLive ? refetchInterval : REFRESH_INTERVAL_MS.stats,
    refetchOnWindowFocus: false,
    enabled,
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

// keywordId undefined (modal closed) disables the query entirely - see
// TopPostsModal, which only ever mounts with a real keyword selected.
export function useTopPostsByKeyword(keywordId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.topPostsByKeyword(keywordId ?? ""),
    queryFn: () => api.posts({ keywordId, sort: "engagement", limit: TOP_POSTS_LIMIT, offset: 0 }),
    enabled: keywordId !== undefined,
  });
}

export function useTopPostsByMovie(movieId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.topPostsByMovie(movieId ?? ""),
    queryFn: () => api.posts({ movieId, sort: "engagement", limit: TOP_POSTS_LIMIT, offset: 0 }),
    enabled: movieId !== undefined,
  });
}

export function useAllComments(page: number, platform?: string) {
  const offset = page * COMMENTS_PAGE_SIZE;
  return useQuery({
    queryKey: QUERY_KEYS.allComments(platform, offset),
    queryFn: () => api.allComments({ platform, limit: COMMENTS_PAGE_SIZE, offset }),
    placeholderData: (previous) => previous,
  });
}

// enabled: false when postId is undefined (modal closed / non-facebook post
// - see PostDetailModal) so this never fires for a post comments can't
// exist for in the first place.
export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.comments(postId ?? ""),
    queryFn: () => api.comments(postId as string),
    enabled: postId !== undefined,
    refetchInterval: postId !== undefined ? REFRESH_INTERVAL_MS.comments : false,
  });
}

export function useRunComments() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, postId }: { platform: string; postId: string }) => api.runComments(platform, postId),
    onSuccess: (_res, { postId }) => {
      message.success(t("commentsRequested"));
      // Nothing to show yet (the crawl runs async - Kafka -> spider-hub ->
      // ingest) - useComments' own refetchInterval is what actually picks
      // up new rows once they land; this just avoids waiting out the rest
      // of the current interval before the first poll after triggering.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments(postId) });
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });
}

// Bulk "fetch comments" from the Posts table's row selection (see
// PostsReview) - each call is just a cheap Kafka publish (the actual
// facebook_comments crawls it queues still run strictly one-at-a-time,
// paced 5-20s apart, inside spider-hub's own per-platform consumer loop;
// see crawl_request_consumer.py's module docstring), so firing every
// request here without client-side throttling of its own doesn't add any
// extra load against the Facebook account itself - it only affects how
// long the backlog takes to drain.
export function useRunCommentsBulk() {
  const { message } = App.useApp();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (posts: { platform: string; postId: string }[]) => {
      const results = await Promise.allSettled(posts.map(({ platform, postId }) => api.runComments(platform, postId)));
      const published = results.filter((r) => r.status === "fulfilled" && r.value.published).length;
      return { requested: posts.length, published };
    },
    onSuccess: ({ requested, published }) => {
      if (published === requested) {
        message.success(t("commentsRequestedBulk", { n: String(published) }));
      } else {
        message.warning(t("commentsRequestedBulkPartial", { published: String(published), requested: String(requested) }));
      }
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });
}
