"use client";

import { LoadingOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import Link from "next/link";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import { useJobsSnapshot, useStopJob, useStopLiveQueue, useStoppingJobIds } from "@/hooks/useJobs";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import type { JobTask } from "@/lib/types";
import { platformLabel } from "@/lib/platform";

const STATUS_KEY: Record<string, TranslationKey> = {
  running: "crawlQueueRunning",
  queued: "crawlQueueWaiting",
  failed: "crawlQueueFailed",
  done: "jobStatusDone",
  skipped: "jobStatusSkipped",
};

const STATUS_COLOR: Record<string, string> = {
  running: "processing",
  queued: "blue",
  failed: "error",
  done: "success",
  skipped: "warning",
};

export default function CrawlQueuePanel({
  platform,
  compact = false,
}: {
  platform?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { data } = useJobsSnapshot();
  const stop = useStopJob();
  const stopAll = useStopLiveQueue();
  const running = (data?.running ?? []).filter((row) => (platform ? row.platform === platform : true));
  const queued = (data?.queued ?? []).filter((row) => (platform ? row.platform === platform : true));
  const rows = [...running, ...queued];
  const { isStopping, markStopping } = useStoppingJobIds(rows.map((row) => row.id).filter(Boolean));
  if (rows.length === 0) return null;

  const queuedByPlatform = queued.reduce<Record<string, number>>((acc, row) => {
    acc[row.platform] = (acc[row.platform] ?? 0) + 1;
    return acc;
  }, {});

  const handleStop = (row: JobTask) => {
    if (!row.id) return;
    markStopping(row.id);
    stop.mutate({ platform: row.platform, id: row.id });
  };
  const livePlatforms = [...new Set(rows.map((row) => row.platform))];
  const stopAllButton = (
    <Button
      danger
      size="small"
      icon={<StopOutlined />}
      loading={stopAll.isPending}
      onClick={() => stopAll.mutate(livePlatforms)}
    >
      {livePlatforms.length > 1 ? t("stopAllQueues") : t("stopQueue")}
    </Button>
  );

  if (compact) {
    return (
      <DashboardCard
        extra={stopAllButton}
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="queue-live-dot" aria-hidden />
            <Link href="/jobs" className="text-[var(--ink)] hover:text-[var(--accent)]">
              {t("crawlQueueTitle")}
            </Link>
            <Tag color="processing" className="!mr-0">
              {t("crawlQueueCount", { n: rows.length })}
            </Tag>
            {running.length > 0 ? (
              <Tag color="processing" className="!mr-0">
                {t("crawlQueueRunningCount", { n: running.length })}
              </Tag>
            ) : null}
            {queued.length > 0 ? (
              <Tag color="blue" className="!mr-0">
                {t("crawlQueueWaitingCount", { n: queued.length })}
              </Tag>
            ) : null}
          </span>
        }
      >
        <div className="flex flex-col gap-2">
          {running.map((row) => (
            <QueueItem
              key={`${row.platform}:${row.id || row.label}:running`}
              row={row}
              dense
              stopping={!!row.id && isStopping(row.id)}
              onStop={() => handleStop(row)}
            />
          ))}
          {queued.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] px-3 py-2">
              <Typography.Text className="text-sm text-[var(--ink-soft)]">
                {t("crawlQueueWaitingSummary", {
                  n: queued.length,
                  detail: Object.entries(queuedByPlatform)
                    .map(([p, n]) => `${platformLabel(p)} ${n}`)
                    .join(" · "),
                })}
              </Typography.Text>
              <Link href="/jobs" className="text-sm font-medium text-[var(--accent)] hover:underline">
                {t("crawlQueueViewAll")}
              </Link>
            </div>
          ) : null}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      extra={stopAllButton}
      title={
        <span className="flex items-center gap-2">
          <span className="queue-live-dot" aria-hidden />
          <Link href="/jobs" className="text-[var(--ink)] hover:text-[var(--accent)]">
            {t("crawlQueueTitle")}
          </Link>
          <Tag color="processing" className="!mr-0">
            {t("crawlQueueCount", { n: rows.length })}
          </Tag>
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <QueueItem
            key={`${row.platform}:${row.id || row.label}:${row.status}`}
            row={row}
            stopping={!!row.id && isStopping(row.id)}
            onStop={() => handleStop(row)}
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function QueueItem({
  row,
  dense = false,
  stopping,
  onStop,
}: {
  row: JobTask;
  dense?: boolean;
  stopping: boolean;
  onStop: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 ${
        dense ? "py-1.5" : "py-2"
      } ${
        row.status === "failed"
          ? "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"
          : row.status === "running"
            ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/40"
            : "border-[var(--line)] bg-[var(--paper-deep)]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PlatformBadge platform={row.platform} size={dense ? 18 : 22} />
        <div className="min-w-0">
          <div className="truncate font-medium text-[var(--ink)]">{row.label || row.type}</div>
          {!dense ? <div className="truncate text-xs text-[var(--muted)]">{row.type}</div> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tag
          icon={row.status === "running" || stopping ? <LoadingOutlined spin /> : undefined}
          color={stopping ? "warning" : (STATUS_COLOR[row.status] ?? "default")}
          className="!mr-0"
        >
          {stopping ? t("crawlQueueStopping") : t(STATUS_KEY[row.status] ?? "crawlQueueWaiting")}
        </Tag>
        <Button
          size="small"
          danger
          icon={<StopOutlined />}
          loading={stopping}
          disabled={stopping || !row.id}
          onClick={onStop}
        >
          {t("stopCrawl")}
        </Button>
      </div>
    </div>
  );
}
