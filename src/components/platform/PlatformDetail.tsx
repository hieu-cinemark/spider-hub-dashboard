"use client";

import { ClockCircleOutlined, CommentOutlined } from "@ant-design/icons";
import { Empty, Typography } from "antd";
import dynamic from "next/dynamic";
import { CountDelta } from "@/components/CountDelta";
import CrawlQueuePanel from "@/components/CrawlQueuePanel";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ChartCardSkeleton, SkelBlock } from "@/components/PageSkeleton";
import StatCard from "@/components/StatCard";
import PlatformActions from "@/components/platform/PlatformActions";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useCommentCounts, useCommentTimeseries, useTimeseries, usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { CHART_HEIGHT, STALE_CRAWL_MS, TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformCssColor, platformLabel, platformSource } from "@/lib/platform";

const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), { ssr: false });
const KeywordVolumeTable = dynamic(() => import("@/components/KeywordVolumeTable"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={280} />,
});

function isStale(lastScrapedAt: string | null): boolean {
  if (!lastScrapedAt) return true;
  const then = new Date(lastScrapedAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then > STALE_CRAWL_MS;
}

export default function PlatformDetail({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();
  const { data: commentCounts, isLoading: commentsLoading } = useCommentCounts();
  const { data: commentTimeseries } = useCommentTimeseries();
  const { health } = useCrawlHealth();

  const row = stats?.find((s) => s.platform === platform);
  const commentRow = commentCounts?.find((s) => s.platform === platform);
  const postSeries = (timeseries ?? []).filter((point) => point.platform === platform);
  const commentSeries = (commentTimeseries ?? []).filter((point) => point.platform === platform);
  const isTriggerable = (TRIGGERABLE_PLATFORMS as readonly string[]).includes(platform);
  const color = platformCssColor(platform);
  const label = platformLabel(platform);
  const trendLoading = timeseriesLoading;
  const hasTrend = postSeries.length > 0 || commentSeries.length > 0;
  const issues = health.byPlatform[platform];
  const stale = isStale(row?.last_scraped_at ?? null);

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={t("platformPostsTitle", { platform: label })}
          value={row?.count ?? 0}
          icon={<PlatformIcon platform={platform} />}
          color={issues?.errors ? "#ff4d4f" : color}
          tone={issues?.errors ? "danger" : issues?.warnings ? "warning" : undefined}
          loading={statsLoading}
          hint={
            issues?.errors
              ? t("crawlIssueErrors", { n: issues.errors })
              : issues?.warnings
                ? t("crawlIssueWarnings", { n: issues.warnings })
                : undefined
          }
          href={issues?.errors ? `/logs?log=spider-hub&level=error&q=${platform}` : undefined}
          delta={<CountDelta current={row?.count_today ?? 0} previous={row?.count_prev ?? 0} />}
        />
        <StatCard
          title={t("platformCommentsTitle", { platform: label })}
          value={commentRow?.count ?? 0}
          icon={<CommentOutlined />}
          color="#c2410c"
          loading={commentsLoading}
          delta={<CountDelta current={commentRow?.count_today ?? 0} previous={commentRow?.count_prev ?? 0} />}
        />
        <StatCard
          title={t("columnLastScraped")}
          value={formatRelativeTime(row?.last_scraped_at ?? null, t)}
          icon={<ClockCircleOutlined />}
          loading={statsLoading}
          tone={stale ? "warning" : undefined}
          hint={stale ? t("crawlIssueStale") : undefined}
        />
      </div>

      {isTriggerable && <CrawlQueuePanel platform={platform} />}
      {isTriggerable && <PlatformActions platform={platform} />}

      {!isTriggerable && platformSource(platform) === "spider-hub" && (
        <Typography.Text type="secondary" className="text-xs">
          {t("notTriggerableSpiderHub", { platform: label })}
        </Typography.Text>
      )}

      {!isTriggerable && platformSource(platform) !== "spider-hub" && (
        <Typography.Text type="secondary" className="text-xs">
          {t("notTriggerableOther", { platform: label })}
        </Typography.Text>
      )}

      <DashboardCard title={<CardHeading icon={<CommentOutlined />} title={t("platformDailyVolumeTitle", { platform: label })} />}>
        <div className="flex w-full items-center justify-center" style={{ minHeight: CHART_HEIGHT }}>
          {trendLoading && <SkelBlock className="w-full rounded-xl" style={{ height: CHART_HEIGHT }} />}
          {!trendLoading && !hasTrend && <Empty description={t("noPostsInWindow")} />}
          {!trendLoading && hasTrend && (
            <div className="w-full">
              <TimeseriesChart
                posts={postSeries}
                comments={commentSeries}
                postsLabel={t("chartPosts")}
                commentsLabel={t("chartComments")}
              />
            </div>
          )}
        </div>
      </DashboardCard>

      <KeywordVolumeTable platform={platform} />
    </div>
  );
}
