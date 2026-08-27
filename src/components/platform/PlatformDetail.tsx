"use client";

import { ClockCircleOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Row, Skeleton, Typography } from "antd";
import dynamic from "next/dynamic";
import { useTimeseries, usePlatformStats } from "@/hooks/useStats";
import StatCard from "@/components/StatCard";
import PlatformActions from "@/components/platform/PlatformActions";
import { TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel, platformSource } from "@/lib/platform";

const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), { ssr: false });

export default function PlatformDetail({ platform }: { platform: string }) {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();

  const row = stats?.find((s) => s.platform === platform);
  const series = (timeseries ?? []).filter((t) => t.platform === platform);
  const isTriggerable = (TRIGGERABLE_PLATFORMS as readonly string[]).includes(platform);
  const color = platformColor(platform);

  return (
    <div className="flex flex-col gap-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={`${platformLabel(platform)} posts`}
            value={row?.count ?? 0}
            icon={<PlatformIcon platform={platform} />}
            color={color}
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Last scraped"
            value={formatRelativeTime(row?.last_scraped_at ?? null)}
            icon={<ClockCircleOutlined />}
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard title="Fed by" value={platformSource(platform)} icon={<DatabaseOutlined />} />
        </Col>
      </Row>

      {isTriggerable && <PlatformActions platform={platform} />}

      {!isTriggerable && platformSource(platform) === "spider-hub" && (
        <Typography.Text type="secondary" className="text-xs">
          {platformLabel(platform)} is crawled by spider-hub but isn&apos;t wired to a dashboard trigger yet -
          run it manually (scrapy crawl) until that&apos;s built.
        </Typography.Text>
      )}

      {!isTriggerable && platformSource(platform) !== "spider-hub" && (
        <Typography.Text type="secondary" className="text-xs">
          {platformLabel(platform)} is scraped by cinemark-scraper&apos;s own Worker, not spider-hub - no
          trigger button here.
        </Typography.Text>
      )}

      <Card title={`${platformLabel(platform)} - daily posts (last 14 days)`}>
        {timeseriesLoading && <Skeleton active />}
        {!timeseriesLoading && series.length === 0 && <Empty description="No posts in this window" />}
        {!timeseriesLoading && series.length > 0 && <TimeseriesChart data={series} />}
      </Card>
    </div>
  );
}
