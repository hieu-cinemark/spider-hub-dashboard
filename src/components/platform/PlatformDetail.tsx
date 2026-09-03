"use client";

import { ClockCircleOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Col, Empty, Row, Skeleton, Typography } from "antd";
import dynamic from "next/dynamic";
import { useTimeseries, usePlatformStats } from "@/hooks/useStats";
import DashboardCard from "@/components/DashboardCard";
import StatCard from "@/components/StatCard";
import PlatformActions from "@/components/platform/PlatformActions";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel, platformSource } from "@/lib/platform";

const TimeseriesChart = dynamic(() => import("@/components/TimeseriesChart"), { ssr: false });

export default function PlatformDetail({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: timeseries, isLoading: timeseriesLoading } = useTimeseries();

  const row = stats?.find((s) => s.platform === platform);
  const series = (timeseries ?? []).filter((point) => point.platform === platform);
  const isTriggerable = (TRIGGERABLE_PLATFORMS as readonly string[]).includes(platform);
  const color = platformColor(platform);
  const label = platformLabel(platform);

  return (
    <div className="flex flex-col gap-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={t("platformPostsTitle", { platform: label })}
            value={row?.count ?? 0}
            icon={<PlatformIcon platform={platform} />}
            color={color}
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={t("columnLastScraped")}
            value={formatRelativeTime(row?.last_scraped_at ?? null, t)}
            icon={<ClockCircleOutlined />}
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={t("fedBy")}
            value={platformSource(platform) === "spider-hub" ? t("sourceCollector") : t("sourceOtherSystem")}
            icon={<DatabaseOutlined />}
          />
        </Col>
      </Row>

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

      <DashboardCard title={t("platformDailyPostsTitle", { platform: label })}>
        {timeseriesLoading && <Skeleton active />}
        {!timeseriesLoading && series.length === 0 && <Empty description={t("noPostsInWindow")} />}
        {!timeseriesLoading && series.length > 0 && <TimeseriesChart data={series} />}
      </DashboardCard>
    </div>
  );
}
