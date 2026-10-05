"use client";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Empty, Segmented, Select, Table, Tag, Tooltip } from "antd";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import KafkaLagStrip from "@/components/KafkaLagStrip";
import { ChartCardSkeleton } from "@/components/PageSkeleton";
import PlatformBadge from "@/components/PlatformBadge";
import StatCard from "@/components/StatCard";
import { useJobsSnapshot, useStopJob, useStopLiveQueue, useStoppingJobIds } from "@/hooks/useJobs";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import { formatRelativeTime } from "@/lib/format";
import { platformLabel } from "@/lib/platform";
import type { JobTask } from "@/lib/types";

const JobResultsChart = dynamic(() => import("@/components/JobResultsChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={220} />,
});

const TYPE_KEY: Record<string, TranslationKey> = {
  search: "jobTypeSearch",
  comments: "jobTypeComments",
  channel_videos: "jobTypeChannelVideos",
  nurture: "jobTypeNurture",
  refresh_token: "jobTypeRefresh",
  cookie_import: "jobTypeCookieImport",
};

const STATUS_KEY: Record<string, TranslationKey> = {
  running: "crawlQueueRunning",
  queued: "crawlQueueWaiting",
  done: "jobStatusDone",
  failed: "crawlQueueFailed",
  skipped: "jobStatusSkipped",
};

const STATUS_COLOR: Record<string, string> = {
  running: "processing",
  queued: "blue",
  done: "success",
  failed: "error",
  skipped: "warning",
};

type HistoryFilter = "all" | "failed" | "done" | "skipped";

function typeLabel(t: (key: TranslationKey) => string, type: string): string {
  return t(TYPE_KEY[type] ?? "jobTypeSearch");
}

function epochIso(epoch: number | null | undefined): string | null {
  return epoch ? new Date(epoch * 1000).toISOString() : null;
}

function formatDuration(job: JobTask): string {
  if (!job.started_at || !job.finished_at) return "—";
  const seconds = Math.max(0, job.finished_at - job.started_at);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function StatusTag({ job, stopping }: { job: JobTask; stopping?: boolean }) {
  const { t } = useTranslation();
  const tag = (
    <Tag
      icon={job.status === "running" || stopping ? <LoadingOutlined spin /> : job.error ? <ExclamationCircleOutlined /> : undefined}
      color={stopping ? "warning" : (STATUS_COLOR[job.status] ?? "default")}
      className="!mr-0"
    >
      {stopping ? t("crawlQueueStopping") : t(STATUS_KEY[job.status] ?? "crawlQueueWaiting")}
    </Tag>
  );
  return job.error ? <Tooltip title={job.error}>{tag}</Tooltip> : tag;
}

function TimeCell({ epoch }: { epoch: number | null | undefined }) {
  const { t } = useTranslation();
  const iso = epochIso(epoch);
  if (!iso) return <span className="cell-meta">—</span>;
  return (
    <Tooltip title={new Date(iso).toLocaleString()}>
      <span className="cell-meta whitespace-nowrap">{formatRelativeTime(iso, t)}</span>
    </Tooltip>
  );
}

function rowKey(row: JobTask): string {
  return `${row.id || row.label}-${row.platform}-${row.status}-${row.started_at ?? row.queued_at ?? row.finished_at ?? ""}`;
}

function LiveTable({
  rows,
  isStopping,
  onStop,
}: {
  rows: JobTask[];
  isStopping: (id: string) => boolean;
  onStop: (platform: string, id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Table<JobTask>
      className="data-table"
      size="middle"
      rowKey={rowKey}
      dataSource={rows}
      pagination={rows.length > 8 ? { pageSize: 8, showSizeChanger: false, size: "small" } : false}
      columns={[
        {
          title: t("platform"),
          dataIndex: "platform",
          width: 140,
          render: (platform: string) => <PlatformBadge platform={platform} size={22} />,
        },
        {
          title: t("jobColumnType"),
          dataIndex: "type",
          width: 170,
          render: (type: string) => <span className="cell-primary whitespace-nowrap">{typeLabel(t, type)}</span>,
        },
        {
          title: t("jobColumnLabel"),
          dataIndex: "label",
          ellipsis: true,
          render: (label: string) => <span className="cell-primary">{label || "—"}</span>,
        },
        {
          title: t("jobColumnStatus"),
          dataIndex: "status",
          width: 140,
          render: (_: string, row: JobTask) => <StatusTag job={row} stopping={!!row.id && isStopping(row.id)} />,
        },
        {
          title: t("jobColumnTime"),
          key: "time",
          width: 140,
          render: (_: unknown, row: JobTask) => <TimeCell epoch={row.started_at ?? row.queued_at} />,
        },
        {
          title: t("actions"),
          key: "actions",
          width: 110,
          align: "right" as const,
          render: (_: unknown, row: JobTask) => {
            const stopping = !!row.id && isStopping(row.id);
            return (
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                loading={stopping}
                disabled={stopping || !row.id}
                onClick={() => onStop(row.platform, row.id)}
              >
                {t("stopCrawl")}
              </Button>
            );
          },
        },
      ]}
    />
  );
}

export default function JobsPageView() {
  const { t } = useTranslation();
  const { data, isLoading } = useJobsSnapshot();
  const stop = useStopJob();
  const stopAll = useStopLiveQueue();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [platform, setPlatform] = useState<string>("all");

  const running = data?.running ?? [];
  const queued = data?.queued ?? [];
  const history = useMemo(() => data?.history ?? [], [data]);
  const live = [...running, ...queued];
  const liveIds = live.map((row) => row.id).filter(Boolean);
  const { isStopping, markStopping } = useStoppingJobIds(liveIds);
  const handleStop = (p: string, id: string) => {
    markStopping(id);
    stop.mutate({ platform: p, id });
  };
  const livePlatforms = [...new Set(live.map((row) => row.platform))];

  const counts = useMemo(() => {
    const c = { done: 0, failed: 0, skipped: 0 };
    for (const job of history) if (job.status in c) c[job.status as keyof typeof c] += 1;
    return c;
  }, [history]);
  const finished = counts.done + counts.failed;
  const successRate = finished > 0 ? Math.round((counts.done / finished) * 100) : null;

  const historyPlatforms = useMemo(() => [...new Set(history.map((job) => job.platform))].sort(), [history]);
  const filteredHistory = useMemo(
    () =>
      history.filter(
        (job) => (filter === "all" || job.status === filter) && (platform === "all" || job.platform === platform),
      ),
    [history, filter, platform],
  );
  const chartLabels = useMemo(
    () => ({ done: t("jobsKpiDone"), failed: t("jobsKpiFailed"), skipped: t("jobsKpiSkipped") }),
    [t],
  );
  const windowHint = t("jobsKpiWindow", { n: history.length });
  // spider-hub only records started_at for some job types - no point in a
  // column of dashes when nothing in the window has one.
  const hasDurations = filteredHistory.some((job) => job.started_at && job.finished_at);

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard title={t("jobsKpiRunning")} value={running.length} icon={<ThunderboltOutlined />} color="#0d9488" loading={isLoading} />
        <StatCard title={t("jobsKpiQueued")} value={queued.length} icon={<ClockCircleOutlined />} color="#4f46e5" loading={isLoading} />
        <StatCard
          title={t("jobsKpiDone")}
          value={counts.done}
          icon={<CheckCircleOutlined />}
          color="#047857"
          loading={isLoading}
          hint={successRate !== null ? t("jobsSuccessRate", { rate: successRate }) : windowHint}
        />
        <StatCard
          title={t("jobsKpiFailed")}
          value={counts.failed}
          icon={<CloseCircleOutlined />}
          color="#e11d48"
          tone={counts.failed > counts.done ? "danger" : undefined}
          loading={isLoading}
          hint={windowHint}
        />
        <StatCard
          title={t("jobsKpiSkipped")}
          value={counts.skipped}
          icon={<MinusCircleOutlined />}
          color="#d97706"
          loading={isLoading}
          hint={windowHint}
        />
      </div>

      <DashboardCard
        loading={isLoading}
        extra={
          live.length > 0 ? (
            <Button danger icon={<StopOutlined />} loading={stopAll.isPending} onClick={() => stopAll.mutate(livePlatforms)}>
              {livePlatforms.length > 1 ? t("stopAllQueues") : t("stopQueue")}
            </Button>
          ) : undefined
        }
        title={
          <CardHeading
            icon={<ThunderboltOutlined />}
            title={t("jobsSectionLive")}
            desc={t("crawlQueueCount", { n: String(live.length) })}
          />
        }
      >
        {live.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)]">
            <CheckCircleOutlined className="text-[var(--ok)]" /> {t("jobsLiveIdle")}
          </div>
        ) : (
          <LiveTable rows={live} isStopping={isStopping} onStop={handleStop} />
        )}
      </DashboardCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <DashboardCard
          className="h-full xl:col-span-3"
          title={
            <CardHeading
              icon={<BarChartOutlined />}
              title={t("jobsChartTitle")}
              desc={t("jobsChartDesc", { n: counts.done + counts.failed + counts.skipped })}
            />
          }
        >
          {history.length === 0 ? (
            <Empty description={t("jobsEmptyHistory")} />
          ) : (
            <JobResultsChart history={history} labels={chartLabels} />
          )}
        </DashboardCard>
        <div className="xl:col-span-2">
          <KafkaLagStrip />
        </div>
      </div>

      <DashboardCard
        title={<CardHeading icon={<HistoryOutlined />} title={t("jobsSectionHistory")} desc={t("jobsHistoryDesc")} />}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Segmented<HistoryFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `${t("jobsFilterAll")} (${history.length})` },
              { value: "failed", label: `${t("jobsKpiFailed")} (${counts.failed})` },
              { value: "done", label: `${t("jobsKpiDone")} (${counts.done})` },
              { value: "skipped", label: `${t("jobsKpiSkipped")} (${counts.skipped})` },
            ]}
          />
          <Select
            value={platform}
            onChange={setPlatform}
            className="min-w-[160px]"
            options={[
              { value: "all", label: t("allPlatformsFilter") },
              ...historyPlatforms.map((p) => ({ value: p, label: platformLabel(p) })),
            ]}
          />
        </div>
        <Table<JobTask>
          className="data-table"
          size="middle"
          rowKey={rowKey}
          dataSource={filteredHistory}
          locale={{ emptyText: <Empty description={t("jobsEmptyHistory")} /> }}
          pagination={filteredHistory.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          expandable={{
            rowExpandable: (row) => !!row.error,
            expandedRowRender: (row) => (
              <pre className="m-0 whitespace-pre-wrap break-all font-mono text-xs text-[var(--danger)]">{row.error}</pre>
            ),
          }}
          columns={[
            {
              title: t("platform"),
              dataIndex: "platform",
              width: 140,
              render: (p: string) => <PlatformBadge platform={p} size={22} />,
            },
            {
              title: t("jobColumnType"),
              dataIndex: "type",
              width: 170,
              render: (type: string) => <span className="cell-primary whitespace-nowrap">{typeLabel(t, type)}</span>,
            },
            {
              title: t("jobColumnLabel"),
              dataIndex: "label",
              ellipsis: true,
              render: (label: string) => <span className="cell-primary">{label || "—"}</span>,
            },
            {
              title: t("jobColumnStatus"),
              dataIndex: "status",
              width: 130,
              render: (_: string, row: JobTask) => <StatusTag job={row} />,
            },
            ...(hasDurations
              ? [
                  {
                    title: t("jobsColumnDuration"),
                    key: "duration",
                    width: 110,
                    render: (_: unknown, row: JobTask) => (
                      <span className="cell-meta tabular-nums">{formatDuration(row)}</span>
                    ),
                  },
                ]
              : []),
            {
              title: t("jobColumnTime"),
              key: "time",
              width: 140,
              render: (_: unknown, row: JobTask) => <TimeCell epoch={row.finished_at ?? row.started_at ?? row.queued_at} />,
            },
          ]}
        />
      </DashboardCard>
    </div>
  );
}
