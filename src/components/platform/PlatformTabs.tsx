"use client";

import { AppstoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, App, Badge, Button, Tabs, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CrawlHealthBanner from "@/components/CrawlHealthBanner";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useQueryParam } from "@/hooks/useQueryParam";
import { usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PLATFORM_META, PlatformIcon, platformLabel } from "@/lib/platform";
import AllPlatformsOverview from "./AllPlatformsOverview";
import PlatformDetail from "./PlatformDetail";

export default function PlatformTabs() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useQueryParam("tab", "all");
  const { message } = App.useApp();
  const { data: stats, error, dataUpdatedAt } = usePlatformStats();
  const [refreshing, setRefreshing] = useState(false);
  const { health } = useCrawlHealth();

  const platforms = Array.from(
    new Set([...Object.keys(PLATFORM_META), ...(stats ?? []).map((s) => s.platform)]),
  );

  // Refetches *everything currently on screen* right now, ignoring
  // staleTime: counts, every chart, the funnel, queue/Kafka/ops panels,
  // accounts, the alert bell, and the active platform tab's keyword table.
  // It used to invalidate a hand-picked list of five keys (half the page
  // never refreshed) with no spinner, so a click looked like a no-op.
  async function refreshAll() {
    setRefreshing(true);
    const startedAt = Date.now();
    try {
      // refetchQueries never rejects (throwOnError defaults to false) - a
      // failed panel shows up as a query whose error landed after startedAt.
      await queryClient.refetchQueries({ type: "active" }, { cancelRefetch: true });
      const failed = queryClient
        .getQueryCache()
        .findAll({ type: "active" })
        .some((query) => query.state.status === "error" && query.state.errorUpdatedAt >= startedAt);
      if (failed) message.warning({ content: t("refreshAllFailed"), key: "refresh-all" });
      else message.success({ content: t("refreshDone"), key: "refresh-all", duration: 1.5 });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      {error && <Alert type="error" showIcon title={t("couldNotReachApi")} description={error.message} className="mb-4" />}
      <Tabs
        className="ui-tabs"
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarExtraContent={
          <div className="flex items-center gap-2">
            {dataUpdatedAt > 0 && (
              <Tooltip title={new Date(dataUpdatedAt).toLocaleString()}>
                <Typography.Text className="text-xs font-medium tabular-nums text-[var(--ink-soft)]">
                  {t("statsUpdatedAt", {
                    time: new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour12: false }),
                  })}
                </Typography.Text>
              </Tooltip>
            )}
            <Button size="small" icon={<ReloadOutlined spin={refreshing} />} disabled={refreshing} onClick={refreshAll}>
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
