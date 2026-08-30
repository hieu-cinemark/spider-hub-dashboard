"use client";

import { ClockCircleOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Col, Empty, Row, Skeleton, Table } from "antd";
import dynamic from "next/dynamic";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import StatCard from "@/components/StatCard";
import { useTimeseries, usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel } from "@/lib/platform";

const PlatformTotalsChart = dynamic(() => import("@/components/PlatformTotalsChart"), { ssr: false });
const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), { ssr: false });

// Matches both charts' own `height` prop - a plain shimmering box the same
// size as the chart it's standing in for reads as "this is loading", where
// the default text-line Skeleton (sized for a paragraph, not a chart) just
// looked like unrelated placeholder content shrinking the layout.
const CHART_HEIGHT = 300;

function ChartSkeleton() {
  return <Skeleton.Node active style={{ width: "100%", height: CHART_HEIGHT }} />;
}

export default function AllPlatformsOverview() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();

  const total = stats?.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title={t("totalPostsCollected")} value={total} loading={statsLoading} icon={<DatabaseOutlined />} />
        </Col>
        {(stats ?? []).map((row) => (
          <Col xs={24} sm={12} lg={6} key={row.platform}>
            <StatCard
              title={platformLabel(row.platform)}
              value={row.count}
              color={platformColor(row.platform)}
              icon={<PlatformIcon platform={row.platform} />}
            />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <DashboardCard title={t("postsPerPlatform")}>
            {statsLoading && <ChartSkeleton />}
            {!statsLoading && (stats?.length ?? 0) === 0 && <Empty description={t("noPostsYet")} />}
            {!statsLoading && (stats?.length ?? 0) > 0 && <PlatformTotalsChart data={stats!} />}
          </DashboardCard>
        </Col>
        <Col xs={24} lg={14}>
          <DashboardCard title={t("dailyPostsLast14Days")}>
            {timeseriesLoading && <ChartSkeleton />}
            {!timeseriesLoading && (timeseries?.length ?? 0) === 0 && <Empty description={t("noPostsInWindow")} />}
            {!timeseriesLoading && (timeseries?.length ?? 0) > 0 && <TimeseriesChart data={timeseries!} />}
          </DashboardCard>
        </Col>
      </Row>

      <DashboardCard
        title={
          <span>
            <ClockCircleOutlined className="mr-2" />
            {t("lastCrawlPerPlatform")}
          </span>
        }
      >
        <Table
          size="small"
          scroll={{ x: "max-content" }}
          pagination={false}
          loading={statsLoading}
          dataSource={stats ?? []}
          rowKey="platform"
          columns={[
            {
              title: t("platform"),
              dataIndex: "platform",
              render: (p: string) => <PlatformBadge platform={p} size={24} />,
            },
            { title: t("columnPostsCollected"), dataIndex: "count" },
            {
              title: t("columnLastScraped"),
              dataIndex: "last_scraped_at",
              render: (v: string | null) => formatRelativeTime(v, t),
            },
          ]}
        />
      </DashboardCard>
    </div>
  );
}
