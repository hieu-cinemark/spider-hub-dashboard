import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { QUERY_KEYS, REFRESH_INTERVAL_MS } from "@/lib/constants";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import { platformLabel } from "@/lib/platform";
import type { JobStatus, JobsSnapshot } from "@/lib/types";

export type JobsPollMode = "live" | "slow" | "off";

const JOBS_POLL_MS: Record<Exclude<JobsPollMode, "off">, number> = {
  live: REFRESH_INTERVAL_MS.jobStatus,
  slow: 60_000,
};

const IDLE_JOB_STATUS: JobStatus = {
  running: false,
  keyword: null,
  keyword_id: null,
  started_at: null,
  type: null,
};

export function dropPlatformFromJobsCache(queryClient: QueryClient, platform: string) {
  queryClient.setQueryData<JobsSnapshot>(QUERY_KEYS.jobs, (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      running: prev.running.filter((row) => row.platform !== platform),
      queued: prev.queued.filter((row) => row.platform !== platform),
    };
  });
  queryClient.setQueryData<JobStatus>(QUERY_KEYS.jobStatus(platform), (prev) =>
    prev ? { ...prev, running: false } : IDLE_JOB_STATUS,
  );
}

async function invalidateAfterStop(queryClient: QueryClient, platforms: string[]) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs }),
    ...platforms.map((platform) => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus(platform) })),
  ]);
}

export function useJobsSnapshot(mode: JobsPollMode = "live") {
  const refetchInterval = usePollingInterval(mode === "off" ? 0 : JOBS_POLL_MS[mode], mode !== "off");
  return useQuery({
    queryKey: QUERY_KEYS.jobs,
    queryFn: api.jobs,
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 4_000,
  });
}

export function useOpsMetrics() {
  const refetchInterval = usePollingInterval(REFRESH_INTERVAL_MS.opsMetrics, true);
  return useQuery({
    queryKey: QUERY_KEYS.opsMetrics,
    queryFn: api.opsMetrics,
    refetchInterval,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });
}

export function useStopPlatformJob() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: string) => {
      await api.stopCrawl(platform);
    },
    onMutate: async (platform) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.jobs });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.jobStatus(platform) });
      const previousJobs = queryClient.getQueryData<JobsSnapshot>(QUERY_KEYS.jobs);
      const previousStatus = queryClient.getQueryData<JobStatus>(QUERY_KEYS.jobStatus(platform));
      dropPlatformFromJobsCache(queryClient, platform);
      return { previousJobs, previousStatus };
    },
    onSuccess: (_res, platform) => {
      message.success(t("toastStopDone", { platform: platformLabel(platform) }));
    },
    onError: (err, platform, ctx) => {
      if (ctx?.previousJobs) queryClient.setQueryData(QUERY_KEYS.jobs, ctx.previousJobs);
      if (ctx?.previousStatus) queryClient.setQueryData(QUERY_KEYS.jobStatus(platform), ctx.previousStatus);
      message.error(translateApiError(err, t));
    },
    onSettled: (_res, _err, platform) => {
      void invalidateAfterStop(queryClient, [platform]);
    },
  });
}

// Tracks which job ids are "stopping" from the moment their Stop button is
// clicked until a poll of `liveIds` (the current running+queued ids) shows
// they're actually gone - not just for the mutation's own brief pending
// window (see useStopJob's own comment on why that isn't enough on its
// own). markStopping is called from the click handler; the effect below
// clears an id out again once useJobsSnapshot's next poll no longer lists
// it.
export function useStoppingJobIds(liveIds: string[]) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const liveKey = liveIds.join(",");

  useEffect(() => {
    setIds((prev) => {
      if (prev.size === 0) return prev;
      const live = new Set(liveKey ? liveKey.split(",") : []);
      const next = new Set([...prev].filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [liveKey]);

  return {
    isStopping: (id: string) => ids.has(id),
    markStopping: (id: string) => setIds((prev) => (id && !prev.has(id) ? new Set(prev).add(id) : prev)),
  };
}

// {platform, id} - id is the job's own run_id (JobTask.id), not shared
// with any other row, unlike useStopPlatformJob's Stop-All-for-platform.
// Deliberately no optimistic cache removal here: the row must keep showing
// (as "stopping", via useStoppingJobIds below) until a poll confirms the
// server actually dropped it - stopJob only arms a cancel flag, the
// running subprocess can take several seconds to actually die (up to
// JOB_CANCEL_KILL_GRACE_SECONDS on the spider-hub side), so hiding it
// immediately just meant the very next poll made it reappear, looking
// like Stop silently did nothing until an unrelated full page reload
// happened to land after the job had actually finished dying.
export function useStopJob() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ platform, id }: { platform: string; id: string }) => {
      await api.stopJob(platform, id);
    },
    onSuccess: () => {
      message.success(t("toastStopJobDone"));
    },
    onError: (err) => {
      message.error(translateApiError(err, t));
    },
    onSettled: (_res, _err, { platform }) => {
      void invalidateAfterStop(queryClient, [platform]);
    },
  });
}

export function useStopLiveQueue() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platforms: string[]) => {
      await Promise.all(platforms.map((platform) => api.stopCrawl(platform)));
    },
    onMutate: async (platforms) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.jobs });
      const previousJobs = queryClient.getQueryData<JobsSnapshot>(QUERY_KEYS.jobs);
      const previousStatuses = Object.fromEntries(
        platforms.map((platform) => [platform, queryClient.getQueryData<JobStatus>(QUERY_KEYS.jobStatus(platform))]),
      );
      for (const platform of platforms) dropPlatformFromJobsCache(queryClient, platform);
      return { previousJobs, previousStatuses };
    },
    onSuccess: (_res, platforms) => {
      if (platforms.length === 1) {
        message.success(t("toastStopDone", { platform: platformLabel(platforms[0]) }));
      } else {
        message.success(t("toastStopAllDone"));
      }
    },
    onError: (err, platforms, ctx) => {
      if (ctx?.previousJobs) queryClient.setQueryData(QUERY_KEYS.jobs, ctx.previousJobs);
      for (const platform of platforms) {
        const prev = ctx?.previousStatuses?.[platform];
        if (prev) queryClient.setQueryData(QUERY_KEYS.jobStatus(platform), prev);
      }
      message.error(translateApiError(err, t));
    },
    onSettled: (_res, _err, platforms) => {
      void invalidateAfterStop(queryClient, platforms);
    },
  });
}
