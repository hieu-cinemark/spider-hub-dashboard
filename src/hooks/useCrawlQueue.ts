import { useQueries } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore } from "react";
import { useLogTail } from "@/hooks/useLogTail";
import { DEFAULT_LOG_LINES, QUERY_KEYS, REFRESH_INTERVAL_MS, TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { extractCrawlActivity, parseLogLines, type CrawlKeywordState } from "@/lib/logParser";
import { api } from "@/lib/api";
import type { JobStatus, Keyword } from "@/lib/types";

export interface QueueRow {
  platform: string;
  keyword: string;
  movieTitle?: string;
  state: CrawlKeywordState;
  kind?: "crawl" | "nurture";
}

const queuedByPlatform: Record<string, Keyword[]> = {
  facebook: [],
  threads: [],
  tiktok: [],
};
const queueListeners = new Set<() => void>();
let queueSnapshot = { ...queuedByPlatform };

function emitQueue(): void {
  queueSnapshot = { ...queuedByPlatform };
  for (const listener of queueListeners) listener();
}

export function useRememberQueuedKeywords() {
  return (platform: string, keywords: Keyword[]) => {
    queuedByPlatform[platform] = keywords;
    emitQueue();
  };
}

function subscribeQueue(listener: () => void): () => void {
  queueListeners.add(listener);
  return () => queueListeners.delete(listener);
}

function getQueueSnapshot(): Record<string, Keyword[]> {
  return queueSnapshot;
}

export function usePlatformJobs(): Record<string, JobStatus | undefined> {
  const results = useQueries({
    queries: TRIGGERABLE_PLATFORMS.map((platform) => ({
      queryKey: QUERY_KEYS.jobStatus(platform),
      queryFn: () => api.jobStatus(platform),
      refetchInterval: REFRESH_INTERVAL_MS.jobStatus,
    })),
  });
  const facebook = results[0]?.data;
  const threads = results[1]?.data;
  const tiktok = results[2]?.data;
  return useMemo(() => ({ facebook, threads, tiktok }), [facebook, threads, tiktok]);
}

export function useCrawlQueue(platform?: string): QueueRow[] {
  const jobs = usePlatformJobs();
  const { data: logs } = useLogTail("spider-hub", DEFAULT_LOG_LINES, true);
  const enqueuedByPlatform = useSyncExternalStore(subscribeQueue, getQueueSnapshot, getQueueSnapshot);

  return useMemo(() => {
    const activity = extractCrawlActivity(parseLogLines(logs?.lines ?? []));
    const rows: QueueRow[] = [];
    const platforms = platform ? [platform] : [...TRIGGERABLE_PLATFORMS];

    for (const p of platforms) {
      const job = jobs[p];
      const enqueued = enqueuedByPlatform[p] ?? [];
      const platformActivity = activity.filter((row) => row.platform === p);
      if (job?.running && job.type === "nurture") {
        rows.push({
          platform: p,
          keyword: job.account ?? "",
          state: "running",
          kind: "nurture",
        });
      }
      const runningKeyword =
        job?.running && job.type !== "refresh_token" && job.type !== "nurture"
          ? job.keyword
          : platformActivity.find((row) => row.state === "running")?.keyword;

      if (runningKeyword) {
        const match = enqueued.find((k) => k.keyword === runningKeyword || k.id === job?.keyword_id);
        rows.push({
          platform: p,
          keyword: runningKeyword,
          movieTitle: match?.movie_title,
          state: "running",
        });
      }

      for (const row of platformActivity) {
        if (row.state === "failed" && row.keyword !== runningKeyword) {
          rows.push({ platform: p, keyword: row.keyword, state: "failed" });
        }
      }

      for (const item of enqueued) {
        const already = rows.some((row) => row.platform === p && row.keyword === item.keyword);
        const settled = platformActivity.find(
          (row) => row.keyword === item.keyword && (row.state === "done" || row.state === "failed"),
        );
        if (already || settled || item.keyword === runningKeyword) continue;
        rows.push({
          platform: p,
          keyword: item.keyword,
          movieTitle: item.movie_title,
          state: "queued",
        });
      }
    }

    const order: Record<CrawlKeywordState, number> = { running: 0, failed: 1, queued: 2, done: 3 };
    return rows.sort((a, b) => order[a.state] - order[b.state] || a.platform.localeCompare(b.platform));
  }, [jobs, logs, enqueuedByPlatform, platform]);
}
