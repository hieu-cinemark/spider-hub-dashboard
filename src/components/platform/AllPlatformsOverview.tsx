"use client";

import {
  AppstoreOutlined,
  AreaChartOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  TeamOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Empty, Segmented, Tag } from "antd";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import AccountIssuesCard from "@/components/AccountIssuesCard";
import IngestFunnelCard from "@/components/IngestFunnelCard";
import AccountPoolGauges from "@/components/AccountPoolGauges";
import { summarizeAccounts } from "@/lib/accountPool";
import { ChartCardSkeleton } from "@/components/PageSkeleton";
import CrawlHealthBanner from "@/components/CrawlHealthBanner";
import CrawlQueuePanel from "@/components/CrawlQueuePanel";
import KafkaLagStrip from "@/components/KafkaLagStrip";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { CountDelta } from "@/components/CountDelta";
import StatCard from "@/components/StatCard";
import { useJobsSnapshot, useOpsMetrics } from "@/hooks/useJobs";
import { useAccounts } from "@/hooks/useSettings";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import {
  useCommentCounts,
  useCommentTimeseries,
  useHourlyStats,
  usePlatformStats,
  useTimeseries,
} from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { CHART_HEIGHT, STALE_CRAWL_MS, TIMESERIES_DAYS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import type { JobTask, PlatformStat } from "@/lib/types";

const PlatformTotalsChart = dynamic(() => import("@/components/PlatformTotalsChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={CHART_HEIGHT} />,
});

const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={CHART_HEIGHT} />,
});

const PlatformTrendChart = dynamic(() => import("@/components/PlatformTrendChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={CHART_HEIGHT} />,
});

const HourlyChart = dynamic(() => import("@/components/HourlyChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={280} />,
});

const SystemPerformanceChart = dynamic(() => import("@/components/SystemPerformanceChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={220} />,
});

function isStale(lastScrapedAt: string | null): boolean {
  if (!lastScrapedAt) return true;
  const then = new Date(lastScrapedAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then > STALE_CRAWL_MS;
}

function PlatformHealthStrip() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = usePlatformStats();
  const { data: commentCounts } = useCommentCounts();
  const { health } = useCrawlHealth();

  if (isLoading && !stats) {
    return <ChartCardSkeleton height={220} />;
  }
  if (!stats || stats.length === 0) {
    return (
      <DashboardCard title={<CardHeading icon={<DashboardOutlined />} title={t("lastCrawlPerPlatform")} />}>
        <Empty description={t("noPostsYet")} />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title={<CardHeading icon={<DashboardOutlined />} title={t("lastCrawlPerPlatform")} />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((row) => (
          <PlatformHealthCell
            key={row.platform}
            row={row}
            commentRow={commentCounts?.find((c) => c.platform === row.platform)}
            errors={health.byPlatform[row.platform]?.errors ?? 0}
            warnings={health.byPlatform[row.platform]?.warnings ?? 0}
          />
        ))}
      </div>
    </DashboardCard>
  );
}

function PlatformHealthCell({
  row,
  commentRow,
  errors,
  warnings,
}: {
  row: PlatformStat;
  commentRow?: PlatformStat;
  errors: number;
  warnings: number;
}) {
  const { t } = useTranslation();
  const stale = isStale(row.last_scraped_at);
  const tone = errors > 0 ? "danger" : warnings > 0 || stale ? "warning" : "ok";

  return (
    <Link
      href={`/?tab=${row.platform}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor:
          tone === "danger"
            ? "var(--danger)"
            : tone === "warning"
              ? "var(--warn)"
              : "var(--line)",
        boxShadow:
          tone === "danger"
            ? "0 0 0 1px color-mix(in srgb, var(--danger) 18%, transparent)"
            : tone === "warning"
              ? "0 0 0 1px color-mix(in srgb, var(--warn) 18%, transparent)"
              : undefined,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent-deep)]">
            <PlatformIcon platform={row.platform} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold tracking-wide text-[var(--ink)]">
              {platformLabel(row.platform)}
            </div>
            <div className="truncate text-[11px] text-[var(--muted)]">
              {formatRelativeTime(row.last_scraped_at, t)}
            </div>
          </div>
        </div>
        {tone !== "ok" ? (
          <Tag color={tone === "danger" ? "error" : "warning"} className="!m-0" icon={<WarningFilled />}>
            {errors > 0
              ? t("crawlIssueErrors", { n: errors })
              : stale
                ? t("crawlIssueStale")
                : t("crawlIssueWarnings", { n: warnings })}
          </Tag>
        ) : (
          <Tag color="success" className="!m-0">
            {t("crawlHealthy")}
          </Tag>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            {t("chartPosts")}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[20px] font-semibold tabular-nums text-[var(--ink)]">
              {row.count.toLocaleString()}
            </span>
            <CountDelta current={row.count_today ?? 0} previous={row.count_prev ?? 0} compact />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            {t("chartComments")}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[20px] font-semibold tabular-nums text-[var(--ink)]">
              {(commentRow?.count ?? 0).toLocaleString()}
            </span>
            <CountDelta
              current={commentRow?.count_today ?? 0}
              previous={commentRow?.count_prev ?? 0}
              compact
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Job success over the snapshot's history window (cinemark-api keeps the
// last ~100). "skipped" (e.g. a comments crawl for a post with nothing new)
// is neither a success nor a failure, so it's left out of the ratio.
function jobSuccess(history: JobTask[]) {
  const done = history.filter((job) => job.status === "done").length;
  const failed = history.filter((job) => job.status === "failed").length;
  const finished = done + failed;
  return { done, failed, finished, rate: finished > 0 ? (done / finished) * 100 : null };
}

export default function AllPlatformsOverview() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();
  const { data: commentCounts, isLoading: commentsLoading } = useCommentCounts();
  const { data: commentTimeseries, isLoading: commentTrendLoading } = useCommentTimeseries();
  const { data: opsMetrics, isLoading: opsLoading } = useOpsMetrics();
  const { data: jobs, isLoading: jobsLoading } = useJobsSnapshot("slow");
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const [hourlyWindow, setHourlyWindow] = useState(24);
  const [hourlyMetric, setHourlyMetric] = useState<"posts" | "comments">("posts");
  const { data: hourly, isLoading: hourlyLoading, dataUpdatedAt: hourlyUpdatedAt } = useHourlyStats(hourlyWindow);
  const hourlyTotal = (hourly ?? []).reduce((sum, row) => sum + row[hourlyMetric], 0);

  const totalPosts = stats?.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const totalComments = commentCounts?.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const postsToday = stats?.reduce((sum, row) => sum + (row.count_today ?? 0), 0) ?? 0;
  const postsPrev = stats?.reduce((sum, row) => sum + (row.count_prev ?? 0), 0) ?? 0;
  const commentsToday = commentCounts?.reduce((sum, row) => sum + (row.count_today ?? 0), 0) ?? 0;
  const commentsPrev = commentCounts?.reduce((sum, row) => sum + (row.count_prev ?? 0), 0) ?? 0;
  const trendLoading = timeseriesLoading || commentTrendLoading;
  const hasPlatformChartData = (stats?.length ?? 0) > 0 || (commentCounts?.length ?? 0) > 0;
  const hasTrendData = (timeseries?.length ?? 0) > 0 || (commentTimeseries?.length ?? 0) > 0;
  const opsSeries = opsMetrics?.series ?? [];
  const opsCurrent = opsMetrics?.current;
  const hasOpsData = opsSeries.length > 0;
  const opsSince = hasOpsData
    ? new Date(Math.min(...opsSeries.map((p) => p.ts)) * 1000).toLocaleString(undefined, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  const success = useMemo(() => jobSuccess(jobs?.history ?? []), [jobs]);
  const accountSummaries = useMemo(() => summarizeAccounts(accounts ?? []), [accounts]);
  const readyAccounts = accountSummaries.reduce((sum, row) => sum + row.ready, 0);
  const totalAccounts = accountSummaries.reduce((sum, row) => sum + row.total, 0);
  const runningJobs = jobs?.running.length ?? 0;
  const successTone = success.rate === null ? undefined : success.rate < 50 ? "danger" : success.rate < 80 ? "warning" : undefined;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <CrawlHealthBanner />
      <CrawlQueuePanel compact />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("totalPostsCollected")}
          value={totalPosts}
          loading={statsLoading}
          icon={<AppstoreOutlined />}
          color="#4f46e5"
          delta={<CountDelta current={postsToday} previous={postsPrev} />}
        />
        <StatCard
          title={t("totalCommentsCollected")}
          value={totalComments}
          loading={commentsLoading}
          icon={<CommentOutlined />}
          color="#c2410c"
          delta={<CountDelta current={commentsToday} previous={commentsPrev} />}
        />
        <StatCard
          title={t("kpiJobSuccess")}
          value={success.rate === null ? "—" : `${success.rate.toFixed(1)}%`}
          loading={jobsLoading}
          icon={<CheckCircleOutlined />}
          color="#047857"
          tone={successTone}
          href="/jobs"
          hint={
            success.finished > 0
              ? t("kpiJobSuccessHint", { done: success.done, failed: success.failed, n: success.finished })
              : t("kpiJobSuccessEmpty")
          }
        />
        <StatCard
          title={t("kpiReadyAccounts")}
          value={`${readyAccounts} / ${totalAccounts}`}
          loading={accountsLoading}
          icon={<TeamOutlined />}
          color="#b45309"
          href="/settings"
          hint={t("kpiReadyAccountsHint", { running: runningJobs })}
        />
      </div>

      <PlatformHealthStrip />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <DashboardCard
          className="h-full xl:col-span-3"
          title={
            <CardHeading
              icon={<FieldTimeOutlined />}
              title={t("hourlyTitle", { hours: hourlyWindow })}
              desc={t("hourlyDesc")}
            />
          }
          extra={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented<"posts" | "comments">
                size="small"
                value={hourlyMetric}
                onChange={setHourlyMetric}
                options={[
                  { value: "posts", label: t("chartPosts") },
                  { value: "comments", label: t("chartComments") },
                ]}
              />
              <Segmented<number>
                size="small"
                value={hourlyWindow}
                onChange={setHourlyWindow}
                options={[
                  { value: 24, label: "24h" },
                  { value: 72, label: "72h" },
                ]}
              />
            </div>
          }
        >
          {hourlyLoading && !hourly ? (
            <ChartCardSkeleton height={280} />
          ) : (
            <>
              <HourlyChart
                points={hourly ?? []}
                hours={hourlyWindow}
                metric={hourlyMetric}
                platforms={(stats ?? []).map((row) => row.platform)}
                asOf={hourlyUpdatedAt}
              />
              {hourlyTotal === 0 ? (
                <div className="mt-1 text-center text-xs text-[var(--muted)]">{t("hourlyEmpty")}</div>
              ) : null}
            </>
          )}
        </DashboardCard>
        <DashboardCard
          className="h-full xl:col-span-2"
          title={<CardHeading icon={<AppstoreOutlined />} title={t("volumePerPlatform")} desc={`${t("chartPosts")} · ${t("chartComments")}`} />}
        >
          <div className="flex w-full items-center justify-center" style={{ minHeight: 300 }}>
            {statsLoading && <ChartCardSkeleton height={300} />}
            {!statsLoading && !hasPlatformChartData && <Empty description={t("noPostsYet")} />}
            {!statsLoading && hasPlatformChartData && (
              <div className="w-full">
                <PlatformTotalsChart
                  posts={stats ?? []}
                  comments={commentCounts ?? []}
                  postsLabel={t("chartPosts")}
                  commentsLabel={t("chartComments")}
                  height={300}
                />
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      <IngestFunnelCard hours={hourlyWindow} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard
          className="h-full"
          title={<CardHeading icon={<CommentOutlined />} title={t("dailyVolumeLast14Days")} desc={`${t("chartPosts")} · ${t("chartComments")}`} />}
        >
          <div className="flex w-full items-center justify-center" style={{ minHeight: CHART_HEIGHT }}>
            {trendLoading && <ChartCardSkeleton height={CHART_HEIGHT} />}
            {!trendLoading && !hasTrendData && <Empty description={t("noPostsInWindow")} />}
            {!trendLoading && hasTrendData && (
              <div className="w-full">
                <TimeseriesChart
                  posts={timeseries ?? []}
                  comments={commentTimeseries ?? []}
                  postsLabel={t("chartPosts")}
                  commentsLabel={t("chartComments")}
                />
              </div>
            )}
          </div>
        </DashboardCard>
        <DashboardCard
          className="h-full"
          title={
            <CardHeading
              icon={<AreaChartOutlined />}
              title={t("platformTrendTitle")}
              desc={t("platformTrendDesc", { days: TIMESERIES_DAYS })}
            />
          }
        >
          <div className="flex w-full items-center justify-center" style={{ minHeight: CHART_HEIGHT }}>
            {timeseriesLoading && <ChartCardSkeleton height={CHART_HEIGHT} />}
            {!timeseriesLoading && (timeseries?.length ?? 0) === 0 && <Empty description={t("noPostsInWindow")} />}
            {!timeseriesLoading && (timeseries?.length ?? 0) > 0 && (
              <div className="w-full">
                <PlatformTrendChart points={timeseries ?? []} />
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard
          className="h-full"
          title={<CardHeading icon={<TeamOutlined />} title={t("accountPoolTitle")} desc={t("accountPoolDesc")} />}
        >
          {accountsLoading ? (
            <ChartCardSkeleton height={220} />
          ) : accountSummaries.length === 0 ? (
            <Empty />
          ) : (
            <AccountPoolGauges summaries={accountSummaries} />
          )}
        </DashboardCard>
        <div className="h-full">
          <AccountIssuesCard accounts={accounts ?? []} loading={accountsLoading} />
        </div>
      </div>

      <DashboardCard
        title={
          <CardHeading
            icon={<DashboardOutlined />}
            title={t("systemPerformanceTitle")}
            desc={hasOpsData ? t("systemPerformanceDesc", { samples: opsSeries.length, since: opsSince }) : undefined}
          />
        }
        extra={
          opsCurrent ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="!mr-0">{t("systemPerfRss", { mb: opsCurrent.rss_mb })}</Tag>
              {(opsCurrent.done_15m ?? 0) > 0 ? (
                <Tag color="success" className="!mr-0">
                  {t("systemPerfDone15m", { n: opsCurrent.done_15m ?? 0 })}
                </Tag>
              ) : null}
              {(opsCurrent.failed_15m ?? 0) > 0 ? (
                <Tag color="error" className="!mr-0">
                  {t("systemPerfFailed15m", { n: opsCurrent.failed_15m ?? 0 })}
                </Tag>
              ) : null}
            </div>
          ) : undefined
        }
      >
        <div className="flex w-full items-center justify-center" style={{ minHeight: 240 }}>
          {opsLoading && !hasOpsData && <ChartCardSkeleton height={220} />}
          {!opsLoading && !hasOpsData && <Empty description={t("systemPerfNoData")} />}
          {hasOpsData && (
            <div className="w-full">
              <SystemPerformanceChart
                series={opsSeries}
                runningLabel={t("systemPerfRunning")}
                queuedLabel={t("systemPerfQueued")}
                loadLabel={t("systemPerfLoad")}
                queueTitle={t("systemPerfQueueTitle")}
                loadTitle={t("systemPerfLoadTitle")}
              />
            </div>
          )}
        </div>
      </DashboardCard>

      <KafkaLagStrip />
    </div>
  );
}
