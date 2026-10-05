"use client";

import { DeleteOutlined, PlayCircleOutlined, ScheduleOutlined } from "@ant-design/icons";
import { Alert, Button, InputNumber, Switch, Table, TimePicker, Tooltip, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useCleanupHistory, useCleanupSettings, useRunCleanup, useSetCleanupSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { CleanupRunSummary, CleanupSettings } from "@/lib/types";

const TIME_FORMAT = "HH:mm";
const HISTORY_PAGE_SIZE = 10;

const GRACE_PRESETS_H = [12, 24, 48, 72, 168];

// Row shape used in the history table - one entry per recorded run, newest
// first, with the same shape cinemark-api's GET /settings/cleanup/history
// returns. Kept inline so the card doesn't need to import the heavier
// paged-list paging state until the operator actually expands the section.
type HistoryRow = CleanupRunSummary;

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

export default function CleanupScheduleCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data, isLoading } = useCleanupSettings();
  const setSettings = useSetCleanupSettings();
  const runNow = useRunCleanup();
  const { data: history, isLoading: historyLoading } = useCleanupHistory(50);

  const values: CleanupSettings = data?.values ?? {
    run_time: "03:00",
    enabled: true,
    grace_hours: 24,
  };
  const running = data?.running ?? false;
  const lastRun = data?.last_run_summary ?? null;

  function persist(patch: Partial<CleanupSettings>) {
    setSettings.mutate(patch);
  }

  const historyRows: HistoryRow[] = history ?? [];
  const historyPaging = usePagedList(historyRows);
  const historyTablePaging = historyPaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  return (
    <DashboardCard
      title={
        <CardHeading
          icon={<ScheduleOutlined />}
          title={t("cleanupScheduleTitle")}
          desc={t("cleanupScheduleDesc")}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {running ? (
          <Alert
            type="info"
            showIcon
            message={t("cleanupRunningAlert")}
            description={t("cleanupRunningAlertDesc")}
          />
        ) : null}

        {mdUp ? (
          <Table
            size="middle"
            loading={isLoading}
            pagination={false}
            rowKey={(r) => Object.keys(r).join("|")}
            dataSource={[values]}
            columns={[
              {
                title: t("columnRunTime"),
                key: "run_time",
                width: 128,
                render: (_: unknown, record: CleanupSettings) => (
                  <TimePicker
                    size="small"
                    format={TIME_FORMAT}
                    value={dayjs(record.run_time, TIME_FORMAT)}
                    allowClear={false}
                    onChange={(value: Dayjs | null) => {
                      if (!value) return;
                      persist({ run_time: value.format(TIME_FORMAT) });
                    }}
                  />
                ),
              },
              {
                title: t("enabled"),
                key: "enabled",
                align: "center",
                width: 80,
                render: (_: unknown, record: CleanupSettings) => (
                  <Switch
                    size="small"
                    checked={record.enabled}
                    onChange={(checked) => persist({ enabled: checked })}
                  />
                ),
              },
              {
                title: (
                  <Tooltip title={t("cleanupGraceHoursHint")}>
                    {t("cleanupGraceHours")}
                  </Tooltip>
                ),
                key: "grace_hours",
                width: 160,
                render: (_: unknown, record: CleanupSettings) => (
                  <InputNumber
                    size="small"
                    min={0}
                    max={720}
                    value={record.grace_hours}
                    addonAfter="h"
                    onChange={(value) => {
                      if (value == null) return;
                      persist({ grace_hours: Number(value) });
                    }}
                  />
                ),
              },
              {
                title: t("cleanupLastRun"),
                key: "last_run",
                render: () =>
                  lastRun ? (
                    <span className="text-xs text-[var(--muted)]">
                      {formatRelativeTime(lastRun.started_at, t)} · {shortNumber(lastRun.posts_deleted)} posts ·{" "}
                      {shortNumber(lastRun.comments_deleted)} cmts
                    </span>
                  ) : (
                    <Typography.Text type="secondary">{t("cleanupNeverRan")}</Typography.Text>
                  ),
              },
              {
                title: t("cleanupActions"),
                key: "actions",
                width: 160,
                align: "right",
                render: () => (
                  <Tooltip title={running ? t("cleanupRunBusyHint") : t("cleanupRunNowHint")}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      loading={runNow.isPending}
                      disabled={running}
                      onClick={() => runNow.mutate()}
                    >
                      {t("cleanupRunNow")}
                    </Button>
                  </Tooltip>
                ),
              },
            ]}
          />
        ) : (
          <ItemCardList items={[values]} loading={isLoading} rowKey={() => "cleanup"}>
            {(record) => (
              <ItemCard>
                <ItemField label={t("columnRunTime")}>
                  <TimePicker
                    size="small"
                    format={TIME_FORMAT}
                    value={dayjs(record.run_time, TIME_FORMAT)}
                    allowClear={false}
                    onChange={(value: Dayjs | null) => {
                      if (!value) return;
                      persist({ run_time: value.format(TIME_FORMAT) });
                    }}
                  />
                </ItemField>
                <ItemField label={t("enabled")}>
                  <Switch size="small" checked={record.enabled} onChange={(checked) => persist({ enabled: checked })} />
                </ItemField>
                <ItemField label={t("cleanupGraceHours")}>
                  <InputNumber
                    size="small"
                    min={0}
                    max={720}
                    value={record.grace_hours}
                    addonAfter="h"
                    onChange={(value) => {
                      if (value == null) return;
                      persist({ grace_hours: Number(value) });
                    }}
                  />
                </ItemField>
                <ItemField label={t("cleanupLastRun")}>
                  {lastRun ? (
                    formatRelativeTime(lastRun.started_at, t)
                  ) : (
                    <Typography.Text type="secondary">{t("cleanupNeverRan")}</Typography.Text>
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
                    {t("cleanupRunNow")}
                  </Button>
                </div>
              </ItemCard>
            )}
          </ItemCardList>
        )}

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--text)]">{t("cleanupPresets")}: </span>
          {t("cleanupGrace")} {GRACE_PRESETS_H.join(" / ")} h
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text)]">
            <DeleteOutlined />
            {t("cleanupHistoryTitle")}
          </div>
          <Table<HistoryRow>
            size="small"
            loading={historyLoading}
            rowKey="id"
            dataSource={historyRows}
            pagination={historyTablePaging}
            columns={[
              {
                title: t("cleanupHistoryStarted"),
                dataIndex: "started_at",
                width: 200,
                render: (v: string) => formatRelativeTime(v, t),
              },
              {
                title: t("cleanupHistoryTrigger"),
                dataIndex: "triggered_by",
                width: 110,
                render: (v: "schedule" | "manual") =>
                  v === "manual" ? t("cleanupHistoryTriggerManual") : t("cleanupHistoryTriggerSchedule"),
              },
              {
                title: t("cleanupHistoryPosts"),
                dataIndex: "posts_deleted",
                align: "right",
                width: 110,
                render: shortNumber,
              },
              {
                title: t("cleanupHistoryComments"),
                dataIndex: "comments_deleted",
                align: "right",
                width: 110,
                render: shortNumber,
              },
              {
                title: t("cleanupHistorySnapshots"),
                dataIndex: "snapshots_deleted",
                align: "right",
                width: 110,
                render: shortNumber,
              },
              {
                title: t("cleanupHistoryRemaining"),
                dataIndex: "remaining_posts",
                align: "right",
                width: 130,
                render: shortNumber,
              },
              {
                title: t("cleanupHistoryDuration"),
                key: "duration",
                width: 110,
                render: (_: unknown, row: HistoryRow) => {
                  if (row.error) {
                    return <Typography.Text type="danger">{t("cleanupHistoryError")}</Typography.Text>;
                  }
                  const d = durationSec(row.started_at, row.finished_at);
                  return d ?? <Typography.Text type="secondary">{t("cleanupHistoryRunning")}</Typography.Text>;
                },
              },
            ]}
            locale={{
              emptyText: historyLoading ? " " : t("cleanupHistoryEmpty"),
            }}
          />
        </div>
      </div>
    </DashboardCard>
  );
}
