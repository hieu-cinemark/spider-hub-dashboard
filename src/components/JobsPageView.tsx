"use client";

import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import { useJobsSnapshot, useKafkaLag, useStopJob, useStopLiveQueue, useStoppingJobIds } from "@/hooks/useJobs";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import type { JobTask, KafkaLagEntry } from "@/lib/types";
import { ClusterOutlined, HistoryOutlined, LoadingOutlined, StopOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Empty, Table, Tag, Tooltip } from "antd";

const KAFKA_LAG_PLATFORMS = new Set(["facebook", "threads", "tiktok"]);

function kafkaLagLabel(t: (key: TranslationKey) => string, label: string): string {
  if (label === "ingest_posts") return t("kafkaLagIngestPosts");
  if (label === "ingest_comments") return t("kafkaLagIngestComments");
  return label;
}

function KafkaLagCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useKafkaLag();
  const rows = data ?? [];

  return (
    <DashboardCard
      loading={isLoading}
      title={<CardHeading icon={<ClusterOutlined />} title={t("kafkaLagTitle")} desc={t("kafkaLagDesc")} />}
    >
      <div className="flex flex-wrap gap-2">
        {rows.map((row: KafkaLagEntry) => (
          <Tooltip key={row.label} title={`${row.topic} · ${row.group_id}`}>
            <span className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] px-3 py-1.5">
              {KAFKA_LAG_PLATFORMS.has(row.label) ? (
                <PlatformBadge platform={row.label} size={18} showLabel={false} />
              ) : null}
              <span className="text-sm text-[var(--ink-soft)]">{kafkaLagLabel(t, row.label)}</span>
              <Tag
                className="!mr-0"
                color={row.error ? "default" : (row.lag ?? 0) > 0 ? "gold" : "success"}
              >
                {row.error ? t("kafkaLagUnavailable") : row.lag}
              </Tag>
            </span>
          </Tooltip>
        ))}
      </div>
    </DashboardCard>
  );
}

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

function formatTime(epoch: number | null | undefined): string {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleString();
}

function typeLabel(t: (key: TranslationKey) => string, type: string): string {
  return t(TYPE_KEY[type] ?? "jobTypeSearch");
}

function TaskTable({
  rows,
  empty,
  showStop,
  isStopping,
  onStop,
}: {
  rows: JobTask[];
  empty: string;
  showStop?: boolean;
  isStopping?: (id: string) => boolean;
  onStop?: (platform: string, id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Table<JobTask>
      className="data-table"
      size="middle"
      rowKey={(row) =>
        `${row.id || row.label}-${row.platform}-${row.status}-${row.started_at ?? row.queued_at ?? row.finished_at ?? ""}`
      }
      dataSource={rows}
      locale={{ emptyText: <Empty description={empty} /> }}
      pagination={rows.length > 20 ? { pageSize: 20 } : false}
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
          width: 148,
          render: (type: string) => <span className="cell-primary">{typeLabel(t, type)}</span>,
        },
        {
          title: t("jobColumnLabel"),
          dataIndex: "label",
          render: (label: string) => <span className="cell-primary">{label || "—"}</span>,
        },
        {
          title: t("jobColumnStatus"),
          dataIndex: "status",
          width: 148,
          render: (status: string, row: JobTask) => {
            const stopping = !!row.id && (isStopping?.(row.id) ?? false);
            return (
              <Tag
                icon={status === "running" || stopping ? <LoadingOutlined spin /> : undefined}
                color={stopping ? "warning" : (STATUS_COLOR[status] ?? "default")}
                className="!mr-0"
              >
                {stopping ? t("crawlQueueStopping") : t(STATUS_KEY[status] ?? "crawlQueueWaiting")}
              </Tag>
            );
          },
        },
        {
          title: t("jobColumnTime"),
          key: "time",
          width: 188,
          render: (_: unknown, row: JobTask) => (
            <span className="cell-meta">{formatTime(row.finished_at ?? row.started_at ?? row.queued_at)}</span>
          ),
        },
        ...(showStop
          ? [
              {
                title: t("actions"),
                key: "actions",
                width: 110,
                align: "right" as const,
                render: (_: unknown, row: JobTask) => {
                  const stopping = !!row.id && (isStopping?.(row.id) ?? false);
                  return (
                    <Button
                      danger
                      icon={<StopOutlined />}
                      loading={stopping}
                      disabled={stopping || !row.id}
                      onClick={() => onStop?.(row.platform, row.id)}
                    >
                      {t("stopCrawl")}
                    </Button>
                  );
                },
              },
            ]
          : []),
      ]}
    />
  );
}

export default function JobsPageView() {
  const { t } = useTranslation();
  const { data, isLoading } = useJobsSnapshot();
  const stop = useStopJob();
  const stopAll = useStopLiveQueue();
  const running = data?.running ?? [];
  const queued = data?.queued ?? [];
  const history = data?.history ?? [];
  const liveCount = running.length + queued.length;
  const liveIds = [...running, ...queued].map((row) => row.id).filter(Boolean);
  const { isStopping, markStopping } = useStoppingJobIds(liveIds);
  const handleStop = (platform: string, id: string) => {
    markStopping(id);
    stop.mutate({ platform, id });
  };
  const livePlatforms = [...new Set([...running, ...queued].map((row) => row.platform))];

  return (
    <div className="flex flex-col gap-4">
      <KafkaLagCard />

      <DashboardCard
        loading={isLoading}
        extra={
          liveCount > 0 ? (
            <Button
              danger
              icon={<StopOutlined />}
              loading={stopAll.isPending}
              onClick={() => stopAll.mutate(livePlatforms)}
            >
              {livePlatforms.length > 1 ? t("stopAllQueues") : t("stopQueue")}
            </Button>
          ) : undefined
        }
        title={
          <CardHeading
            icon={<ThunderboltOutlined />}
            title={t("jobsSectionLive")}
            desc={t("crawlQueueCount", { n: String(liveCount) })}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              {t("jobsSectionRunning")}
            </div>
            <TaskTable
              rows={running}
              empty={t("jobsEmptyRunning")}
              showStop
              isStopping={isStopping}
              onStop={handleStop}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              {t("jobsSectionQueued")}
            </div>
            <TaskTable
              rows={queued}
              empty={t("jobsEmptyQueued")}
              showStop
              isStopping={isStopping}
              onStop={handleStop}
            />
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title={<CardHeading icon={<HistoryOutlined />} title={t("jobsSectionHistory")} desc={t("jobsHistoryDesc")} />}
      >
        <TaskTable rows={history} empty={t("jobsEmptyHistory")} />
      </DashboardCard>
    </div>
  );
}
