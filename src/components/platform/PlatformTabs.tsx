"use client";

import { AppstoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Tabs, Typography } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import CrawlHealthBanner from "@/components/CrawlHealthBanner";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useQueryParam } from "@/hooks/useQueryParam";
import { usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { QUERY_KEYS, TIMESERIES_DAYS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { PLATFORM_META, PlatformIcon, platformLabel } from "@/lib/platform";
import AllPlatformsOverview from "./AllPlatformsOverview";
import PlatformDetail from "./PlatformDetail";

const HIDDEN_PLATFORMS = new Set(["instagram"]);

export default function PlatformTabs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useQueryParam("tab", "all");
  const { data: stats, isLoading, error, dataUpdatedAt } = usePlatformStats();
  const { health } = useCrawlHealth();

  const platforms = Array.from(
    new Set([...Object.keys(PLATFORM_META), ...(stats ?? []).map((s) => s.platform)]),
  ).filter((p) => !HIDDEN_PLATFORMS.has(p));

  function refreshOverview() {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platformStats });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeseries(TIMESERIES_DAYS) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.commentCounts });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.commentTimeseries(TIMESERIES_DAYS) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keywordVolume(undefined) });
  }

  return (
    <>
      {error && <Alert type="error" showIcon title={t("couldNotReachApi")} description={error.message} className="mb-4" />}
      <Tabs
        className="ui-tabs"
        activeKey={activeTab}
        onChange={setActiveTab}
        destroyOnHidden
        tabBarExtraContent={
          <div className="flex items-center gap-2">
            {dataUpdatedAt > 0 && (
              <Typography.Text type="secondary" className="text-xs">
                {t("statsUpdatedAt", { time: formatRelativeTime(new Date(dataUpdatedAt).toISOString(), t) })}
              </Typography.Text>
            )}
            <Button size="small" icon={<ReloadOutlined />} loading={isLoading} onClick={refreshOverview}>
              {t("refresh")}
            </Button>
          </div>
        }
        items={[
          {
            key: "all",
            label: (
              <span className="inline-flex items-center gap-2">
                <AppstoreOutlined /> {t("allTab")}
              </span>
            ),
            children: <AllPlatformsOverview />,
          },
          ...platforms.map((platform) => {
            const issues = health.byPlatform[platform];
            const errorCount = issues?.errors ?? 0;
            return {
              key: platform,
              label: (
                <span className="inline-flex items-center gap-2">
                  <PlatformIcon platform={platform} />
                  {platformLabel(platform)}
                  {errorCount > 0 && <Badge overflowCount={99} count={errorCount} size="small" />}
                  {errorCount === 0 && (issues?.warnings ?? 0) > 0 && <Badge status="warning" />}
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4">
                  <CrawlHealthBanner platform={platform} />
                  <PlatformDetail platform={platform} />
                </div>
              ),
            };
          }),
        ]}
      />
    </>
  );
}
