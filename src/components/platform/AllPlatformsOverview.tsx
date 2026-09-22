"use client";

import { CommentOutlined, DashboardOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Col, Empty, Row, Tag } from "antd";
import { ChartCardSkeleton, SkelBlock } from "@/components/PageSkeleton";
import type { CSSProperties, ReactNode } from "react";
import dynamic from "next/dynamic";
import { CountDelta } from "@/components/CountDelta";
import CrawlHealthBanner from "@/components/CrawlHealthBanner";
import CrawlQueuePanel from "@/components/CrawlQueuePanel";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import StatCard from "@/components/StatCard";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useOpsMetrics } from "@/hooks/useJobs";
import { useCommentCounts, useCommentTimeseries, useTimeseries, usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { CHART_HEIGHT, STALE_CRAWL_MS } from "@/lib/constants";
import { PlatformIcon, platformCssColor, platformLabel } from "@/lib/platform";

const PlatformTotalsChart = dynamic(() => import("@/components/PlatformTotalsChart"), {
  ssr: false,
  loading: () => <SkelBlock className="w-full rounded-xl" style={{ height: CHART_HEIGHT }} />,
});
const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), {
  ssr: false,
  loading: () => <SkelBlock className="w-full rounded-xl" style={{ height: CHART_HEIGHT }} />,
});
const SystemPerformanceChart = dynamic(() => import("@/components/SystemPerformanceChart"), {
  ssr: false,
  loading: () => <SkelBlock className="w-full rounded-xl" style={{ height: Math.min(CHART_HEIGHT, 260) }} />,
});
const KeywordVolumeTable = dynamic(() => import("@/components/KeywordVolumeTable"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={280} />,
});

function ChartFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-1 items-center justify-center" style={{ minHeight: CHART_HEIGHT }}>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return <SkelBlock className="w-full rounded-xl" style={{ height: CHART_HEIGHT }} />;
}

function isStale(lastScrapedAt: string | null): boolean {
  if (!lastScrapedAt) return true;
  const then = new Date(lastScrapedAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then > STALE_CRAWL_MS;
}

export default function AllPlatformsOverview() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();
  const { data: commentCounts, isLoading: commentsLoading } = useCommentCounts();
  const { data: commentTimeseries, isLoading: commentTrendLoading } = useCommentTimeseries();
  const { data: opsMetrics, isLoading: opsLoading } = useOpsMetrics();
  const { health } = useCrawlHealth();

  const totalPosts = stats?.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const totalComments = commentCounts?.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const platformChartLoading = statsLoading;
  const trendLoading = timeseriesLoading || commentTrendLoading;
  const hasPlatformChartData = (stats?.length ?? 0) > 0 || (commentCounts?.length ?? 0) > 0;
  const hasTrendData = (timeseries?.length ?? 0) > 0 || (commentTimeseries?.length ?? 0) > 0;
  const opsSeries = opsMetrics?.series ?? [];
  const opsCurrent = opsMetrics?.current;
  const hasOpsData = opsSeries.length > 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <CrawlHealthBanner />
      <CrawlQueuePanel compact />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          title={t("totalPostsCollected")}
          value={totalPosts}
          loading={statsLoading}
          icon={<DatabaseOutlined />}
          delta={
            stats ? (
              <CountDelta
                current={stats.reduce((sum, row) => sum + (row.count_today ?? 0), 0)}
                previous={stats.reduce((sum, row) => sum + (row.count_prev ?? 0), 0)}
              />
            ) : undefined
          }
        />
        <StatCard
          title={t("totalCommentsCollected")}
          value={totalComments}
          loading={commentsLoading}
          icon={<CommentOutlined />}
          color="#c2410c"
          delta={
            commentCounts ? (
              <CountDelta
                current={commentCounts.reduce((sum, row) => sum + (row.count_today ?? 0), 0)}
                previous={commentCounts.reduce((sum, row) => sum + (row.count_prev ?? 0), 0)}
              />
            ) : undefined
          }
        />
      </div>

      {(stats ?? []).length > 0 ? (
        <div
          className="platform-kpi-grid"
          style={{ "--platform-count": (stats ?? []).length } as CSSProperties}
        >
          {(stats ?? []).map((row) => {
            const issues = health.byPlatform[row.platform];
            const stale = isStale(row.last_scraped_at);
            const tone = issues?.errors ? "danger" : issues?.warnings || stale ? "warning" : undefined;
            const hint = issues?.errors
              ? t("crawlIssueErrors", { n: issues.errors })
              : issues?.warnings
                ? t("crawlIssueWarnings", { n: issues.warnings })
                : stale
                  ? t("crawlIssueStale")
                  : undefined;
            return (
              <StatCard
                key={row.platform}
                title={platformLabel(row.platform)}
                value={row.count}
                color={tone === "danger" ? "#e11d48" : platformCssColor(row.platform)}
                icon={<PlatformIcon platform={row.platform} />}
                tone={tone}
                href={issues?.errors ? `/logs?log=spider-hub&level=error&q=${row.platform}` : `/?tab=${row.platform}`}
                hint={hint}
                delta={<CountDelta current={row.count_today ?? 0} previous={row.count_prev ?? 0} />}
              />
            );
          })}
        </div>
      ) : null}

      <DashboardCard
        title={
          <CardHeading
            icon={<DashboardOutlined />}
            title={t("systemPerformanceTitle")}
            desc={t("systemPerformanceDesc", { minutes: 20 })}
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
        <div className="flex w-full items-center justify-center" style={{ minHeight: Math.min(CHART_HEIGHT, 260) }}>
          {opsLoading && !hasOpsData && <SkelBlock className="w-full rounded-xl" style={{ height: Math.min(CHART_HEIGHT, 260) }} />}
          {!opsLoading && !hasOpsData && <Empty description={t("systemPerfNoData")} />}
          {hasOpsData && (
            <div className="w-full">
              <SystemPerformanceChart
                series={opsSeries}
                runningLabel={t("systemPerfRunning")}
                queuedLabel={t("systemPerfQueued")}
                loadLabel={t("systemPerfLoad")}
              />
            </div>
          )}
        </div>
      </DashboardCard>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={10} className="flex">
          <DashboardCard className="h-full w-full" title={<CardHeading icon={<DatabaseOutlined />} title={t("volumePerPlatform")} desc={`${t("chartPosts")} · ${t("chartComments")}`} />}>
            <ChartFrame>
              {platformChartLoading && <ChartSkeleton />}
              {!platformChartLoading && !hasPlatformChartData && <Empty description={t("noPostsYet")} />}
              {!platformChartLoading && hasPlatformChartData && (
                <div className="w-full">
                  <PlatformTotalsChart
                    posts={stats ?? []}
                    comments={commentCounts ?? []}
                    postsLabel={t("chartPosts")}
                    commentsLabel={t("chartComments")}
                  />
                </div>
              )}
            </ChartFrame>
          </DashboardCard>
        </Col>
        <Col xs={24} lg={14} className="flex">
          <DashboardCard className="h-full w-full" title={<CardHeading icon={<CommentOutlined />} title={t("dailyVolumeLast14Days")} desc={t("dailyPostsLast14Days")} />}>
            <ChartFrame>
              {trendLoading && <ChartSkeleton />}
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
            </ChartFrame>
          </DashboardCard>
        </Col>
      </Row>

      <KeywordVolumeTable />
    </div>
  );
}
