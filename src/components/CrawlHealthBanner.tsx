"use client";

import { WarningFilled } from "@ant-design/icons";
import { Alert, Button, Tag } from "antd";
import Link from "next/link";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatLogClock } from "@/lib/logParser";
import { platformLabel } from "@/lib/platform";

function logsHref(platform?: string) {
  const params = new URLSearchParams({ log: "spider-hub", level: "error" });
  if (platform) params.set("q", platform);
  return `/logs?${params.toString()}`;
}

export default function CrawlHealthBanner({ platform }: { platform?: string }) {
  const { t } = useTranslation();
  const { health } = useCrawlHealth();

  const scoped = platform ? health.byPlatform[platform] : null;
  const errorCount = platform ? (scoped?.errors ?? 0) : health.errorCount;
  const warningCount = platform ? (scoped?.warnings ?? 0) : health.warningCount;
  const lastMessage = platform ? (scoped?.lastError ?? null) : (health.lastError?.message ?? null);
  const lastClock = platform ? null : formatLogClock(health.lastError?.timestamp ?? null);

  if (errorCount === 0 && warningCount === 0) return null;

  const isError = errorCount > 0;
  const title = isError
    ? t(platform ? "crawlErrorsForPlatform" : "crawlErrorsRecent", {
        n: errorCount,
        platform: platform ? platformLabel(platform) : "",
      })
    : t(platform ? "crawlWarningsForPlatform" : "crawlWarningsRecent", {
        n: warningCount,
        platform: platform ? platformLabel(platform) : "",
      });

  const description = lastClock && lastMessage ? `${lastClock} · ${lastMessage}` : lastMessage;

  const chips =
    !platform &&
    Object.entries(health.byPlatform)
      .filter(([, row]) => row.errors > 0 || row.warnings > 0)
      .map(([name, row]) => (
        <Link key={name} href={logsHref(name)}>
          <Tag color={row.errors > 0 ? "error" : "warning"} className="!m-0 cursor-pointer">
            {platformLabel(name)} · {row.errors > 0 ? t("crawlIssueErrors", { n: row.errors }) : t("crawlIssueWarnings", { n: row.warnings })}
          </Tag>
        </Link>
      ));

  return (
    <Alert
      type={isError ? "error" : "warning"}
      showIcon
      icon={<WarningFilled />}
      className={isError ? "crawl-alert-error" : "crawl-alert-warning"}
      message={<span className="font-semibold">{title}</span>}
      description={
        <div className="flex flex-col gap-2">
          {description ? <span className="break-words">{description}</span> : null}
          {chips && chips.length > 0 ? <div className="flex flex-wrap gap-1.5">{chips}</div> : null}
        </div>
      }
      action={
        <Link href={logsHref(platform)}>
          <Button size="small" danger={isError}>
            {t("viewLogs")}
          </Button>
        </Link>
      }
    />
  );
}
