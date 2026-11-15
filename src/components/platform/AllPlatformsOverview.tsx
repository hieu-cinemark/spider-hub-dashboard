"use client";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  TeamOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { Button, Segmented, Tooltip } from "antd";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import AccountIssuesCard from "@/components/AccountIssuesCard";
import AccountPoolGauges from "@/components/AccountPoolGauges";
import { CountDelta } from "@/components/CountDelta";
import CrawlQueuePanel from "@/components/CrawlQueuePanel";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import IngestFunnelCard from "@/components/IngestFunnelCard";
import KafkaLagStrip from "@/components/KafkaLagStrip";
import { ChartCardSkeleton } from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import PlatformCard from "@/components/ui/PlatformCard";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusBadge, { StatusDot, type StatusTone } from "@/components/ui/StatusBadge";
import { useAccounts } from "@/hooks/useSettings";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useJobsSnapshot, useOpsMetrics } from "@/hooks/useJobs";
import {
  useCommentCounts,
  useCommentTimeseries,
  useHourlyStats,
  usePlatformStats,
  useTimeseries,
} from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { CHART_HEIGHT, STALE_CRAWL_MS, TIMESERIES_DAYS } from "@/lib/constants";
import { summarizeAccounts } from "@/lib/accountPool";
import { formatRelativeTime } from "@/lib/format";
import type { JobTask, PlatformStat } from "@/lib/types";

const PlatformTotalsChart = dynamic(() => import("@/components/PlatformTotalsChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={CHART_HEIGHT} />,
});

const HourlyChart = dynamic(() => import("@/components/HourlyChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={280} />,
});

const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={CHART_HEIGHT} />,
});

const PlatformTrendChart = dynamic(() => import("@/components/PlatformTrendChart"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={CHART_HEIGHT} />,
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

// Job success over the snapshot's history window (cinemark-api keeps the
// last ~100). "skipped" (e.g. a comments crawl for a post with nothing new)
// is neither a success nor a failure, so it's left out of the ratio.
function jobSuccess(history: JobTask[]) {
  const done = history.filter((job) => job.status === "done").length;
  const failed = history.filter((job) => job.status === "failed").length;
  const finished = done + failed;
  return { done, failed, finished, rate: finished > 0 ? (done / finished) * 100 : null };
}

/* -------------------------------------------------------------------------- */
/* Section A - operational status                                             */
/* -------------------------------------------------------------------------- */

/**
 * A single compact status strip.
 *
 * It answers "is the collection working right now?" in one line, and the
 * latest error is available on demand - a long error message never takes
 * over the top of the dashboard.
 */
function OperationalStatusBar({
  errorCount,
  warningCount,
  runningCount,
  queuedCount,
  failedCount,
  readyAccounts,
  totalAccounts,
  updatedAt,
  lastError,
  lastErrorAt,
}: {
  errorCount: number;
  warningCount: number;
  runningCount: number;
  queuedCount: number;
  failedCount: number;
  readyAccounts: number;
  totalAccounts: number;
  updatedAt: number;
  lastError: string | null;
  lastErrorAt: string | null;
}) {
  const { t } = useTranslation();

  const tone: StatusTone = errorCount > 0 ? "danger" : warningCount > 0 ? "warning" : "ok";
  const toneLabel =
    errorCount > 0 ? t("opsStatusDegraded") : warningCount > 0 ? t("opsStatusDegraded") : t("opsStatusHealthy");

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[10px] border border-[var(--line)] bg-[var(--card)] px-4 py-2.5">
      <StatusBadge tone={tone} title={t("opsOverallStatus")}>
        {toneLabel}
      </StatusBadge>

      <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
        <StatusDot tone={runningCount > 0 ? "running" : "neutral"} title={t("opsActiveJobs")}>
          {t("opsActiveJobs")}: {runningCount.toLocaleString()}
        </StatusDot>
        <StatusDot tone={queuedCount > 0 ? "info" : "neutral"} title={t("opsPendingJobs")}>
          {t("opsPendingJobs")}: {queuedCount.toLocaleString()}
        </StatusDot>
        <StatusDot tone={failedCount > 0 ? "danger" : "neutral"} title={t("opsFailedJobs")}>
          {t("opsFailedJobs")}: {failedCount.toLocaleString()}
        </StatusDot>
        <StatusDot tone={readyAccounts > 0 ? "ok" : "warning"} title={t("kpiAvailableAccounts")}>
          {t("kpiAvailableAccounts")}: {readyAccounts.toLocaleString()}/{totalAccounts.toLocaleString()}
        </StatusDot>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        {lastError ? (
          <Tooltip title={lastError} styles={{ root: { maxWidth: 520 } }}>
            <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-[var(--danger)]">
              <WarningFilled className="shrink-0" />
              <span className="truncate-1">{t("opsRecentErrors")}</span>
              {lastErrorAt ? (
                <span className="shrink-0 text-[var(--muted)]">
                  {formatRelativeTime(lastErrorAt, t)}
                </span>
              ) : null}
            </span>
          </Tooltip>
        ) : null}
        {updatedAt > 0 ? (
          <span className="shrink-0 text-[12px] whitespace-nowrap text-[var(--muted)]">
            {t("opsLastUpdate")} {formatRelativeTime(new Date(updatedAt).toISOString(), t)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section D - platform health                                                 */
/* -------------------------------------------------------------------------- */

function PlatformHealthSection({
  stats,
  commentCounts,
  errors,
  warnings,
}: {
  stats: PlatformStat[];
  commentCounts: PlatformStat[];
  errors: Record<string, number>;
  warnings: Record<string, number>;
}) {
  const { t } = useTranslation();

  if (stats.length === 0) {
    return (
      <DashboardCard
        title={<CardHeading icon={<DashboardOutlined />} title={t("sectionPlatformHealth")} />}
      >
        <p className="m-0 py-4 text-center text-sm text-[var(--muted)]">{t("noPostsYet")}</p>
      </DashboardCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((row) => {
        const commentRow = commentCounts.find((c) => c.platform === row.platform);
        const errorCount = errors[row.platform] ?? 0;
        const warningCount = warnings[row.platform] ?? 0;
        const stale = isStale(row.last_scraped_at);
        const tone: StatusTone = errorCount > 0 ? "danger" : warningCount > 0 || stale ? "warning" : "ok";
        const toneLabel =
          errorCount > 0
            ? t("crawlIssueErrors", { n: errorCount })
            : warningCount > 0
              ? t("crawlIssueWarnings", { n: warningCount })
              : stale
                ? t("crawlIssueStale")
                : t("crawlHealthy");

        return (
          <PlatformCard
            key={row.platform}
            platform={row.platform}
            posts={row.count}
            comments={commentRow?.count ?? 0}
            lastScrapedAt={row.last_scraped_at}
            postsToday={row.count_today ?? 0}
            postsPrev={row.count_prev ?? 0}
            commentsToday={commentRow?.count_today ?? 0}
            commentsPrev={commentRow?.count_prev ?? 0}
            tone={tone}
            toneLabel={toneLabel}
            stale={stale && tone !== "danger"}
            href={`/?tab=${row.platform}`}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function AllPlatformsOverview() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();
  const { data: commentCounts, isLoading: commentsLoading } = useCommentCounts();
  const { data: commentTimeseries, isLoading: commentTrendLoading } = useCommentTimeseries();
  const { data: opsMetrics, isLoading: opsLoading } = useOpsMetrics();
  const { data: jobs, isLoading: jobsLoading } = useJobsSnapshot("slow");
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { health, dataUpdatedAt } = useCrawlHealth();
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
  const queuedJobs = jobs?.queued.length ?? 0;
  const failedJobs = jobs?.history.filter((job) => job.status === "failed").length ?? 0;
  const successTone =
    success.rate === null ? undefined : success.rate < 50 ? "danger" : success.rate < 80 ? "warning" : undefined;

  const errorsByPlatform = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [name, row] of Object.entries(health.byPlatform)) out[name] = row.errors;
    return out;
  }, [health.byPlatform]);
  const warningsByPlatform = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [name, row] of Object.entries(health.byPlatform)) out[name] = row.warnings;
    return out;
  }, [health.byPlatform]);

  return (
    <div className="flex flex-col gap-6">
      {/* --- Section A: operational status ------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t("sectionOperational")} desc={t("opsSectionHint")} />
        <OperationalStatusBar
          errorCount={health.errorCount}
          warningCount={health.warningCount}
          runningCount={runningJobs}
          queuedCount={queuedJobs}
          failedCount={failedJobs}
          readyAccounts={readyAccounts}
          totalAccounts={totalAccounts}
          updatedAt={dataUpdatedAt > 0 ? dataUpdatedAt : hourlyUpdatedAt}
          lastError={health.lastError?.message ?? null}
          lastErrorAt={health.lastError?.timestamp ?? null}
        />
      </section>

      {/* --- Section B: key numbers -------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t("sectionKpis")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t("kpiTotalPosts")}
            value={totalPosts}
            loading={statsLoading}
            icon={<AppstoreOutlined />}
            delta={<CountDelta current={postsToday} previous={postsPrev} />}
          />
          <StatCard
            title={t("kpiTotalComments")}
            value={totalComments}
            loading={commentsLoading}
            icon={<CommentOutlined />}
            delta={<CountDelta current={commentsToday} previous={commentsPrev} />}
          />
          <StatCard
            title={t("kpiSuccessRate")}
            value={success.rate === null ? "—" : `${success.rate.toFixed(1)}%`}
            loading={jobsLoading}
            icon={<CheckCircleOutlined />}
            tone={successTone}
            href="/jobs"
            hint={
              success.finished > 0
                ? t("kpiSuccessRateHint", { done: success.done, failed: success.failed })
                : t("kpiJobSuccessEmpty")
            }
          />
          <StatCard
            title={t("kpiAvailableAccounts")}
            value={`${readyAccounts} / ${totalAccounts}`}
            loading={accountsLoading}
            icon={<TeamOutlined />}
            href="/settings?tab=accounts"
            hint={t("kpiAvailableAccountsHint", { ready: readyAccounts, total: totalAccounts })}
          />
        </div>
      </section>

      {/* --- Section C: collection activity ------------------------------ */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title={t("sectionCollection")}
          desc={t("opsQueueSummary", { running: runningJobs, queued: queuedJobs })}
          actions={
            <Link href="/jobs">
              <Button size="small">{t("crawlQueueViewAll")}</Button>
            </Link>
          }
        />
        <CrawlQueuePanel compact />
      </section>

      {/* --- Section D: platform health ---------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t("sectionPlatformHealth")} />
        {statsLoading && !stats ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel-block h-[136px] rounded-[10px]" />
            ))}
          </div>
        ) : (
          <PlatformHealthSection
            stats={stats ?? []}
            commentCounts={commentCounts ?? []}
            errors={errorsByPlatform}
            warnings={warningsByPlatform}
          />
        )}
      </section>

      {/* --- Section E: analytics ---------------------------------------- */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t("sectionAnalytics")} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <DashboardCard
            className="h-full xl:col-span-3"
            title={
              <CardHeading
                icon={<FieldTimeOutlined />}
                title={t("analyticsActivityTitle")}
                desc={t("analyticsActivityDesc")}
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
            title={
              <CardHeading
                icon={<AppstoreOutlined />}
                title={t("analyticsDistributionTitle")}
                desc={t("analyticsDistributionDesc")}
              />
            }
          >
            <div className="flex w-full items-center justify-center" style={{ minHeight: 300 }}>
              {statsLoading && <ChartCardSkeleton height={300} />}
              {!statsLoading && !hasPlatformChartData && (
                <p className="m-0 text-sm text-[var(--muted)]">{t("noPostsYet")}</p>
              )}
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DashboardCard
            className="h-full"
            title={
              <CardHeading
                icon={<ClockCircleOutlined />}
                title={t("dailyVolumeLast14Days")}
                desc={`${t("chartPosts")} · ${t("chartComments")}`}
              />
            }
          >
            <div className="flex w-full items-center justify-center" style={{ minHeight: CHART_HEIGHT }}>
              {trendLoading && <ChartCardSkeleton height={CHART_HEIGHT} />}
              {!trendLoading && !hasTrendData && (
                <p className="m-0 text-sm text-[var(--muted)]">{t("noPostsInWindow")}</p>
              )}
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
                icon={<AppstoreOutlined />}
                title={t("platformTrendTitle")}
                desc={t("platformTrendDesc", { days: TIMESERIES_DAYS })}
              />
            }
          >
            <div className="flex w-full items-center justify-center" style={{ minHeight: CHART_HEIGHT }}>
              {timeseriesLoading && <ChartCardSkeleton height={CHART_HEIGHT} />}
              {!timeseriesLoading && (timeseries?.length ?? 0) === 0 && (
                <p className="m-0 text-sm text-[var(--muted)]">{t("noPostsInWindow")}</p>
              )}
              {!timeseriesLoading && (timeseries?.length ?? 0) > 0 && (
                <div className="w-full">
                  <PlatformTrendChart points={timeseries ?? []} />
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </section>

      {/* --- Secondary operational detail -------------------------------- */}
      <div className="section-rule">{t("sectionResources")}</div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard
          className="h-full"
          title={<CardHeading icon={<TeamOutlined />} title={t("accountPoolTitle")} desc={t("accountPoolDesc")} />}
        >
          {accountsLoading ? (
            <ChartCardSkeleton height={220} />
          ) : accountSummaries.length === 0 ? (
            <p className="m-0 py-6 text-center text-sm text-[var(--muted)]">{t("noPostsYet")}</p>
          ) : (
            <AccountPoolGauges summaries={accountSummaries} />
          )}
        </DashboardCard>
        <div className="h-full">
          <AccountIssuesCard accounts={accounts ?? []} loading={accountsLoading} />
        </div>
      </div>

      <IngestFunnelCard hours={hourlyWindow} />

      <div className="section-rule">{t("sectionInfra")}</div>
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
              <StatusBadge tone="neutral">{t("systemPerfRss", { mb: opsCurrent.rss_mb })}</StatusBadge>
              {(opsCurrent.done_15m ?? 0) > 0 ? (
                <StatusBadge tone="ok">{t("systemPerfDone15m", { n: opsCurrent.done_15m ?? 0 })}</StatusBadge>
              ) : null}
              {(opsCurrent.failed_15m ?? 0) > 0 ? (
                <StatusBadge tone="danger">{t("systemPerfFailed15m", { n: opsCurrent.failed_15m ?? 0 })}</StatusBadge>
              ) : null}
            </div>
          ) : undefined
        }
      >
        <div className="flex w-full items-center justify-center" style={{ minHeight: 240 }}>
          {opsLoading && !hasOpsData && <ChartCardSkeleton height={220} />}
          {!opsLoading && !hasOpsData && (
            <p className="m-0 text-sm text-[var(--muted)]">{t("systemPerfNoData")}</p>
          )}
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
