"use client";

import { RadarChartOutlined, WarningFilled } from "@ant-design/icons";
import { Empty, Progress, Tag, Tooltip } from "antd";
import { useMemo } from "react";
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

// Mốc "đang ổn" để vẽ thanh tiến trình tương đối. Trên thang tuyến
// tính tới 1k, một hàng đang ổn (0-100 tin nhắn) chỉ chiếm 10% bề
// rộng - nhìn sẽ như đang không có gì. Thang sqrt giữ phần "lớn" đọc
// được mà vẫn thấy rõ hàng đang chạy bình thường.
function lagPercent(lag: number): number {
  if (lag <= 0) return 0;
  return Math.min(100, Math.round(Math.sqrt(lag / KAFKA_LAG_ALERT) * 100));
}

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
  const rows: KafkaLagEntry[] = useMemo(
    () => [...(data ?? [])].sort((a, b) => (b.lag ?? -1) - (a.lag ?? -1)),
    [data],
  );

  const totalLag = rows.reduce((sum, row) => sum + (row.lag ?? 0), 0);
  const stuck = rows.filter((row) => !row.error && (row.lag ?? 0) >= KAFKA_LAG_ALERT).length;

  return (
    <DashboardCard
      loading={isLoading}
      title={
        <CardHeading
          icon={<RadarChartOutlined />}
          title={t("kafkaLagTitle")}
          desc={t("kafkaLagDesc")}
        />
      }
      extra={
        rows.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="!mr-0 tabular-nums" color={totalLag > 0 ? "gold" : "success"}>
              {t("kafkaLagTotal", { n: totalLag.toLocaleString() })}
            </Tag>
            {stuck > 0 ? (
              <Tag color="error" className="!mr-0">
                {t("kafkaLagStuckCount", { n: stuck })}
              </Tag>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <Empty description={t("kafkaLagUnavailable")} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => {
            const lag = row.lag ?? 0;
            const alert = !row.error && lag >= KAFKA_LAG_ALERT;
            const platform = kafkaLagPlatform(row.label);
            const percent = lagPercent(lag);
            const barColor = row.error
              ? "#9aa1ae"
              : alert
                ? "var(--danger)"
                : lag > 0
                  ? "#d97706"
                  : "var(--ok)";

            const rowNode = (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--paper-deep)] sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]"
                style={alert ? { background: "color-mix(in srgb, var(--danger) 8%, transparent)" } : undefined}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {platform ? <PlatformIcon platform={platform} style={{ fontSize: 14 }} /> : null}
                  {alert ? <WarningFilled className="shrink-0 text-[var(--danger)]" /> : null}
                  <span className="truncate text-[13px] text-[var(--ink-soft)]">
                    {kafkaLagLabel(t, row.label)}
                  </span>
                </div>
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <Progress
                    percent={percent}
                    size="small"
                    showInfo={false}
                    strokeColor={barColor}
                    trailColor="var(--paper-deep)"
                    className="!m-0"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[11px] text-[var(--muted)]">
                    {row.topic} · {row.group_id}
                  </span>
                  <Tag
                    className="!mr-0 tabular-nums"
                    color={row.error ? "default" : alert ? "error" : lag > 0 ? "gold" : "success"}
                  >
                    {row.error ? t("kafkaLagUnavailable") : lag.toLocaleString()}
                  </Tag>
                </div>
              </div>
            );

            return alert ? (
              <Tooltip key={row.label} title={t("kafkaLagHigh")}>
                {rowNode}
              </Tooltip>
            ) : (
              <div key={row.label}>{rowNode}</div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
