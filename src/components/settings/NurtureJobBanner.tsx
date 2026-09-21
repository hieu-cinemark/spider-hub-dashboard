"use client";

import { LoadingOutlined, StopOutlined } from "@ant-design/icons";
import { Alert, App, Button, Space } from "antd";
import { useEffect, useMemo, useRef } from "react";
import { useJobsSnapshot } from "@/hooks/useJobs";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";
import { platformLabel } from "@/lib/platform";

const NURTURE_PLATFORMS = ["facebook", "threads"] as const;

export default function NurtureJobBanner() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { data: jobs } = useJobsSnapshot("slow");
  const prevRunning = useRef<Record<string, boolean>>({});

  const runningByPlatform = useMemo(() => {
    const map: Record<string, { label: string }> = {};
    for (const row of jobs?.running ?? []) {
      if (row.type === "nurture") map[row.platform] = { label: row.label };
    }
    return map;
  }, [jobs?.running]);

  useEffect(() => {
    for (const platform of NURTURE_PLATFORMS) {
      const running = platform in runningByPlatform;
      if (prevRunning.current[platform] && !running) {
        message.success(t("toastNurtureFinished", { platform: platformLabel(platform) }));
      }
      prevRunning.current[platform] = running;
    }
  }, [runningByPlatform, message, t]);

  const active = NURTURE_PLATFORMS.filter((platform) => platform in runningByPlatform);
  if (active.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {active.map((platform) => (
        <NurtureAlert key={platform} platform={platform} account={runningByPlatform[platform]?.label} />
      ))}
    </div>
  );
}

function NurtureAlert({ platform, account }: { platform: string; account?: string | null }) {
  const { t } = useTranslation();
  const { stopCrawl } = useTriggerCrawl(platform);
  return (
    <Alert
      type="info"
      showIcon
      icon={<LoadingOutlined spin />}
      message={t("nurtureJobRunning", { platform: platformLabel(platform) })}
      description={account ? t("nurtureJobAccount", { account }) : t("nurtureJobUntilDone")}
      action={
        <Space>
          <Button size="small" danger icon={<StopOutlined />} onClick={() => stopCrawl.mutate()}>
            {t("stopQueue")}
          </Button>
        </Space>
      }
    />
  );
}
