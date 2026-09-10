"use client";

import { AppstoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Skeleton, Tabs, Typography } from "antd";
import { useQueryParam } from "@/hooks/useQueryParam";
import { usePlatformStats, useTimeseries } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import { PLATFORM_META, PlatformIcon, platformLabel } from "@/lib/platform";
import AllPlatformsOverview from "./AllPlatformsOverview";
import PlatformDetail from "./PlatformDetail";

const HIDDEN_PLATFORMS = new Set(["instagram"]);

export default function PlatformTabs() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useQueryParam("tab", "all");
  const { data: stats, isLoading, error, dataUpdatedAt, refetch: refetchStats } = usePlatformStats();
  const { refetch: refetchTimeseries } = useTimeseries();

  if (isLoading && !stats) return <Skeleton active paragraph={{ rows: 6 }} />;

  const platforms = Array.from(
    new Set([...Object.keys(PLATFORM_META), ...(stats ?? []).map((s) => s.platform)]),
  ).filter((p) => !HIDDEN_PLATFORMS.has(p));

  return (
    <>
      {error && <Alert type="error" showIcon title={t("couldNotReachApi")} description={error.message} className="mb-4" />}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={
          <div className="flex items-center gap-2">
            {dataUpdatedAt > 0 && (
              <Typography.Text type="secondary" className="text-xs">
                {t("statsUpdatedAt", { time: formatRelativeTime(new Date(dataUpdatedAt).toISOString(), t) })}
              </Typography.Text>
            )}
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={isLoading}
              onClick={() => {
                refetchStats();
                refetchTimeseries();
              }}
            >
              {t("refresh")}
            </Button>
          </div>
        }
        items={[
          {
            key: "all",
            label: (
              <span>
                <AppstoreOutlined /> {t("allTab")}
              </span>
            ),
            children: <AllPlatformsOverview />,
          },
          ...platforms.map((platform) => ({
            key: platform,
            label: (
              <span>
                <PlatformIcon platform={platform} /> {platformLabel(platform)}
              </span>
            ),
            children: <PlatformDetail platform={platform} />,
          })),
        ]}
      />
    </>
  );
}
