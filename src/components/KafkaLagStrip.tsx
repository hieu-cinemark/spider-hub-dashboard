"use client";

import { RadarChartOutlined, WarningFilled } from "@ant-design/icons";
import { Empty, Tag, Tooltip } from "antd";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useKafkaLag } from "@/hooks/useJobs";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import type { KafkaLagEntry } from "@/lib/types";

const KAFKA_LAG_PLATFORMS = new Set(["facebook", "threads", "tiktok"]);

// Above this many unprocessed messages a queue is treated as "not
// draining" rather than a normal in-flight burst - crawl/ingest queues sit
// at 0-100 in steady state, so 1k means the consumer is down or wedged
// (e.g. lake_writer not restarted after a deploy).
export const KAFKA_LAG_ALERT = 1_000;

function kafkaLagPlatform(label: string): string | null {
  if (KAFKA_LAG_PLATFORMS.has(label)) return label;
  const m = /^auto_login_(\w+)$/.exec(label);
  return m ? m[1] : null;
}

export function kafkaLagLabel(t: ReturnType<typeof useTranslation>["t"], label: string): string {
  if (label === "ingest_posts") return t("kafkaLagIngestPosts");
  if (label === "ingest_comments") return t("kafkaLagIngestComments");
  if (label === "lake_posts") return t("kafkaLagLakePosts");
  if (label === "lake_comments") return t("kafkaLagLakeComments");
  if (KAFKA_LAG_PLATFORMS.has(label)) return t("kafkaLagCrawl", { platform: platformLabel(label) });
  const autoLogin = /^auto_login_(\w+)$/.exec(label);
  if (autoLogin) return t("kafkaLagAutoLogin", { platform: platformLabel(autoLogin[1]) });
  return label;
}

export default function KafkaLagStrip() {
  const { t } = useTranslation();
  const { data, isLoading } = useKafkaLag();
  // Worst backlog first, so a stuck consumer is the first thing you read.
  const rows: KafkaLagEntry[] = [...(data ?? [])].sort((a, b) => (b.lag ?? -1) - (a.lag ?? -1));

  return (
    <DashboardCard
      loading={isLoading}
      title={<CardHeading icon={<RadarChartOutlined />} title={t("kafkaLagTitle")} desc={t("kafkaLagDesc")} />}
    >
      <div className="flex flex-wrap gap-2">
        {rows.length === 0 ? (
          <Empty description={t("kafkaLagUnavailable")} />
        ) : (
          rows.map((row) => {
            const lag = row.lag ?? 0;
            const alert = !row.error && lag >= KAFKA_LAG_ALERT;
            const platform = kafkaLagPlatform(row.label);
            const chip = (
              <div
                key={row.label}
                className="flex items-center gap-1.5 rounded-xl border bg-[var(--paper-deep)] px-3 py-1.5"
                style={{ borderColor: alert ? "var(--danger)" : "var(--line)" }}
                title={alert ? undefined : `${row.topic} · ${row.group_id}`}
              >
                {platform ? <PlatformIcon platform={platform} style={{ fontSize: 14 }} /> : null}
                {alert ? <WarningFilled className="text-[var(--danger)]" /> : null}
                <span className="text-sm text-[var(--ink-soft)]">{kafkaLagLabel(t, row.label)}</span>
                <Tag
                  className="!mr-0 tabular-nums"
                  color={row.error ? "default" : alert ? "error" : lag > 0 ? "gold" : "success"}
                >
                  {row.error ? t("kafkaLagUnavailable") : lag.toLocaleString()}
                </Tag>
              </div>
            );
            return alert ? (
              <Tooltip key={row.label} title={`${t("kafkaLagHigh")} (${row.topic} · ${row.group_id})`}>
                {chip}
              </Tooltip>
            ) : (
              chip
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
