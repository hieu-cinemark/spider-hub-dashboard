"use client";

import { PlayCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, InputNumber, Switch, Table, Tooltip, Typography } from "antd";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import {
  useAutoLoginHistory,
  useAutoLoginSettings,
  useRunAutoLogin,
  useSetAutoLoginSettings,
} from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { AutoLoginPlatform, AutoLoginRunHistoryEntry, AutoLoginSettings } from "@/lib/types";

// Hour-amount presets for the interval input - clicking a chip writes
// the matching seconds value, same UX as the cleanup `grace_hours`
// presets. 1h is the default; 30min is for operators who have a
// frequent-failure pattern they want picked up fast; 12h and 24h are
// for low-priority accounts where the operator doesn't need them
// alive within the hour.
const INTERVAL_PRESETS_HOURS = [0.5, 1, 6, 12, 24];

function shortNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function durationSec(started: string, finished: string | null): string | null {
  if (!finished) return null;
  const ms = new Date(finished).getTime() - new Date(started).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function intervalHours(seconds: number): number {
  return Math.max(0.0166, seconds / 3600);
}

function intervalSeconds(hours: number): number {
  // Round to the nearest minute so the schema's ge=60 check is met
  // even when an operator drags the InputNumber's step below 1.
  return Math.max(60, Math.round(hours * 3600));
}

export default function AutoLoginCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data, isLoading } = useAutoLoginSettings();
  const setSettings = useSetAutoLoginSettings();
  const runNow = useRunAutoLogin();
  const { data: history, isLoading: historyLoading } = useAutoLoginHistory(50);

  const values: AutoLoginSettings = data?.values ?? {
    enabled: false,
    interval_seconds: 3600,
    platforms: ["facebook", "threads"],
    dry_run: false,
    min_age_seconds: 0,
    telegram_alert: true,
  };
  const running = data?.running ?? false;
  const lastRunAt = data?.last_run_at ?? null;

  function persist(patch: Partial<AutoLoginSettings>) {
    setSettings.mutate(patch);
  }

  function togglePlatform(platform: AutoLoginPlatform, checked: boolean) {
    const current = values.platforms;
    const next = checked ? Array.from(new Set([...current, platform])) : current.filter((p) => p !== platform);
    if (next.length === 0) return; // refuse empty list - operator would just turn the scheduler off instead
    persist({ platforms: next });
  }

  const historyRows: AutoLoginRunHistoryEntry[] = history ?? [];
  const historyPaging = usePagedList(historyRows);
  const historyTablePaging = historyPaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  return (
    <DashboardCard
      title={
        <CardHeading
          icon={<SafetyCertificateOutlined />}
          title={t("autoLoginTitle")}
          desc={t("autoLoginDesc")}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {running ? (
          <Alert
            type="info"
            showIcon
            message={t("autoLoginRunningAlert")}
            description={t("autoLoginRunningAlertDesc")}
          />
        ) : null}

        {mdUp ? (
          <Table
            size="middle"
            loading={isLoading}
            pagination={false}
            rowKey={() => "auto-login"}
            dataSource={[values]}
            columns={[
              {
                title: t("autoLoginEnabled"),
                key: "enabled",
                align: "center",
                width: 80,
                render: () => (
                  <Switch
                    size="small"
                    checked={values.enabled}
                    onChange={(checked) => persist({ enabled: checked })}
                  />
                ),
              },
              {
                title: (
                  <Tooltip title={t("autoLoginIntervalHelp")}>
                    {t("autoLoginInterval")}
                  </Tooltip>
                ),
                key: "interval",
                width: 130,
                render: () => (
                  <InputNumber
                    size="small"
                    min={0.0166}
                    max={24}
                    step={0.5}
                    value={intervalHours(values.interval_seconds)}
                    addonAfter="h"
                    onChange={(value) => {
                      if (value == null) return;
                      persist({ interval_seconds: intervalSeconds(Number(value)) });
                    }}
                  />
                ),
              },
              {
                title: t("autoLoginPlatforms"),
                key: "platforms",
                render: () => (
                  <div className="flex items-center gap-3">
                    {(["facebook", "threads"] as AutoLoginPlatform[]).map((p) => (
                      <Checkbox
                        key={p}
                        checked={values.platforms.includes(p)}
                        onChange={(e) => togglePlatform(p, e.target.checked)}
                      >
                        {p === "facebook" ? t("autoLoginPlatformFacebook") : t("autoLoginPlatformThreads")}
                      </Checkbox>
                    ))}
                  </div>
                ),
              },
              {
                title: (
                  <Tooltip title={t("autoLoginDryRunHelp")}>
                    {t("autoLoginDryRun")}
                  </Tooltip>
                ),
                key: "dry_run",
                align: "center",
                width: 100,
                render: () => (
                  <Switch
                    size="small"
                    checked={values.dry_run}
                    onChange={(checked) => persist({ dry_run: checked })}
                  />
                ),
              },
              {
                title: t("autoLoginLastRun"),
                key: "last_run",
                render: () =>
                  lastRunAt ? (
                    <span className="text-xs text-[var(--muted)]">{formatRelativeTime(lastRunAt, t)}</span>
                  ) : (
                    <Typography.Text type="secondary">{t("autoLoginNeverRan")}</Typography.Text>
                  ),
              },
              {
                title: t("cleanupActions"),
                key: "actions",
                width: 160,
                align: "right",
                render: () => (
                  <Tooltip title={running ? t("autoLoginRunBusyHint") : t("autoLoginRunNowHint")}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      loading={runNow.isPending}
                      disabled={running}
                      onClick={() => runNow.mutate()}
                    >
                      {t("autoLoginRunNow")}
                    </Button>
                  </Tooltip>
                ),
              },
            ]}
          />
        ) : (
          <ItemCardList items={[values]} loading={isLoading} rowKey={() => "auto-login"}>
            {(record) => (
              <ItemCard>
                <ItemField label={t("autoLoginEnabled")}>
                  <Switch
                    size="small"
                    checked={record.enabled}
                    onChange={(checked) => persist({ enabled: checked })}
                  />
                </ItemField>
                <ItemField label={t("autoLoginInterval")}>
                  <InputNumber
                    size="small"
                    min={0.0166}
                    max={24}
                    step={0.5}
                    value={intervalHours(record.interval_seconds)}
                    addonAfter="h"
                    onChange={(value) => {
                      if (value == null) return;
                      persist({ interval_seconds: intervalSeconds(Number(value)) });
                    }}
                  />
                </ItemField>
                <ItemField label={t("autoLoginPlatforms")}>
                  <div className="flex flex-col gap-1">
                    {(["facebook", "threads"] as AutoLoginPlatform[]).map((p) => (
                      <Checkbox
                        key={p}
                        checked={record.platforms.includes(p)}
                        onChange={(e) => togglePlatform(p, e.target.checked)}
                      >
                        {p === "facebook" ? t("autoLoginPlatformFacebook") : t("autoLoginPlatformThreads")}
                      </Checkbox>
                    ))}
                  </div>
                </ItemField>
                <ItemField label={t("autoLoginDryRun")}>
                  <Switch
                    size="small"
                    checked={record.dry_run}
                    onChange={(checked) => persist({ dry_run: checked })}
                  />
                </ItemField>
                <ItemField label={t("autoLoginLastRun")}>
                  {lastRunAt ? (
                    formatRelativeTime(lastRunAt, t)
                  ) : (
                    <Typography.Text type="secondary">{t("autoLoginNeverRan")}</Typography.Text>
                  )}
                </ItemField>
                <div className="mt-3">
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={runNow.isPending}
                    disabled={running}
                    onClick={() => runNow.mutate()}
                    block
                  >
                    {t("autoLoginRunNow")}
                  </Button>
                </div>
              </ItemCard>
            )}
          </ItemCardList>
        )}

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--text)]">{t("cleanupPresets")}: </span>
          {t("autoLoginInterval")} {INTERVAL_PRESETS_HOURS.join(" / ")} h
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text)]">
            <SafetyCertificateOutlined />
            {t("autoLoginHistoryTitle")}
          </div>
          <Table<AutoLoginRunHistoryEntry>
            size="small"
            loading={historyLoading}
            rowKey={(r) => `${r.started_at}-${r.triggered_by}`}
            dataSource={historyRows}
            pagination={historyTablePaging}
            columns={[
              {
                title: t("autoLoginHistoryStarted"),
                dataIndex: "started_at",
                width: 180,
                render: (v: string) => formatRelativeTime(v, t),
              },
              {
                title: t("autoLoginHistoryTrigger"),
                dataIndex: "triggered_by",
                width: 110,
                render: (v: "schedule" | "manual") =>
                  v === "manual" ? t("autoLoginHistoryTriggerManual") : t("autoLoginHistoryTriggerSchedule"),
              },
              {
                title: t("autoLoginHistoryAttempted"),
                dataIndex: "total_attempted",
                align: "right",
                width: 100,
                render: shortNumber,
              },
              {
                title: t("autoLoginHistoryKafkaPublished"),
                dataIndex: "kafka_published",
                align: "right",
                width: 100,
                render: shortNumber,
              },
              {
                title: t("autoLoginHistoryKafkaFailed"),
                dataIndex: "kafka_publish_failed",
                align: "right",
                width: 110,
                render: (n: number) =>
                  n > 0 ? <Typography.Text type="warning">{shortNumber(n)}</Typography.Text> : shortNumber(n),
              },
              {
                title: t("autoLoginHistoryDuration"),
                key: "duration",
                width: 110,
                render: (_: unknown, row: AutoLoginRunHistoryEntry) => {
                  if (row.error) return <Typography.Text type="danger">{t("autoLoginHistoryErrorLabel")}</Typography.Text>;
                  const d = durationSec(row.started_at, row.finished_at);
                  return d ?? <Typography.Text type="secondary">{t("autoLoginHistoryRunning")}</Typography.Text>;
                },
              },
            ]}
            expandable={{
              expandedRowRender: (row) => (
                <div className="rounded-md bg-[var(--surface-muted)] p-3">
                  <div className="mb-2 text-xs text-[var(--muted)]">
                    {t("autoLoginHistoryPlatform")}: {row.platforms.join(", ")} · {row.dry_run ? "DRY-RUN" : "REAL"}
                  </div>
                  <Table<{ platform: string; attempted: number; needs_human: number; failed: number; error: number }>
                    size="small"
                    pagination={false}
                    rowKey="platform"
                    dataSource={Object.entries(row.per_platform).map(([platform, stats]) => ({
                      platform,
                      attempted: Number(stats.attempted) || 0,
                      needs_human: Number(stats.needs_human) || 0,
                      failed: Number(stats.failed) || 0,
                      error: Number(stats.error) || 0,
                    }))}
                    columns={[
                      { title: t("autoLoginHistoryPlatform"), dataIndex: "platform", width: 100 },
                      { title: t("autoLoginHistoryAttempted"), dataIndex: "attempted", align: "right", width: 100, render: shortNumber },
                      { title: t("autoLoginHistoryNeedsHuman"), dataIndex: "needs_human", align: "right", width: 100, render: shortNumber },
                      { title: t("autoLoginHistoryFailed"), dataIndex: "failed", align: "right", width: 100, render: shortNumber },
                      { title: t("autoLoginHistoryError"), dataIndex: "error", align: "right", width: 100, render: shortNumber },
                    ]}
                  />
                  {row.error ? (
                    <div className="mt-2 text-xs text-[var(--danger)]">{row.error}</div>
                  ) : null}
                </div>
              ),
            }}
            locale={{
              emptyText: historyLoading ? " " : t("autoLoginHistoryEmpty"),
            }}
          />
        </div>
      </div>
    </DashboardCard>
  );
}