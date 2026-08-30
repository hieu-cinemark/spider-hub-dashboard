"use client";

import { ClockCircleOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Col, Empty, Row, Skeleton, Table } from "antd";
import dynamic from "next/dynamic";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import StatCard from "@/components/StatCard";
import { useTimeseries, usePlatformStats } from "@/hooks/useStats";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel } from "@/lib/platform";

const PlatformTotalsChart = dynamic(() => import("@/components/PlatformTotalsChart"), { ssr: false });
const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), { ssr: false });

export default function AllPlatformsOverview() {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();

  const total = stats?.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total posts collected" value={total} loading={statsLoading} icon={<DatabaseOutlined />} />
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
          <DashboardCard title="Posts per platform">
            {statsLoading && <Skeleton active />}
            {!statsLoading && (stats?.length ?? 0) === 0 && <Empty description="No posts yet" />}
            {!statsLoading && (stats?.length ?? 0) > 0 && <PlatformTotalsChart data={stats!} />}
          </DashboardCard>
        </Col>
        <Col xs={24} lg={14}>
          <DashboardCard title="Daily posts, last 14 days">
            {timeseriesLoading && <Skeleton active />}
            {!timeseriesLoading && (timeseries?.length ?? 0) === 0 && <Empty description="No posts in this window" />}
            {!timeseriesLoading && (timeseries?.length ?? 0) > 0 && <TimeseriesChart data={timeseries!} />}
          </DashboardCard>
        </Col>
      </Row>

      <DashboardCard
        title={
          <span>
            <ClockCircleOutlined className="mr-2" />
            Last crawl per platform
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
              title: "Platform",
              dataIndex: "platform",
              render: (p: string) => <PlatformBadge platform={p} size={24} />,
            },
            { title: "Posts collected", dataIndex: "count" },
            {
              title: "Last scraped",
              dataIndex: "last_scraped_at",
              render: (v: string | null) => formatRelativeTime(v),
            },
          ]}
        />
      </DashboardCard>
    </div>
  );
}
