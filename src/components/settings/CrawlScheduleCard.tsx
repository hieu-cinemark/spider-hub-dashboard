"use client";

import { ClockCircleOutlined } from "@ant-design/icons";
import { Switch, Table, TimePicker, Tooltip, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import PlatformBadge from "@/components/PlatformBadge";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useCrawlSchedule, useSetCrawlSchedule } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { CrawlSchedule } from "@/lib/types";

const NURTURE_SCHEDULE_PLATFORMS = new Set(["facebook", "threads", "tiktok"]);
const TIME_FORMAT = "HH:mm";
const DEFAULT_RUN_TIME = "07:00";

// One row per platform we can trigger, whether or not it has a
// crawl_schedules row yet (a platform with no row just hasn't had its
// schedule saved for the first time - see cinemark-api's
// upsert_crawl_schedule) - not showing it at all until then would make the
// card look incomplete/broken rather than "not configured yet".
function rowFor(platform: string, schedules: CrawlSchedule[] | undefined): CrawlSchedule {
  const found = schedules?.find((s) => s.platform === platform);
  return {
    platform,
    run_time: found?.run_time ?? DEFAULT_RUN_TIME,
    enabled: found?.enabled ?? false,
    nurture_before: found?.nurture_before ?? false,
    nurture_after: found?.nurture_after ?? false,
    last_triggered_date: found?.last_triggered_date ?? null,
    updated_at: found?.updated_at ?? "",
  };
}

export default function CrawlScheduleCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: schedules, isLoading } = useCrawlSchedule();
  const setSchedule = useSetCrawlSchedule();

  const rows = TRIGGERABLE_PLATFORMS.map((p) => rowFor(p, schedules));
  const schedulePaging = usePagedList(rows);
  const paging = schedulePaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  function persist(record: CrawlSchedule, patch: Partial<CrawlSchedule>) {
    setSchedule.mutate({
      platform: record.platform,
      input: {
        run_time: patch.run_time ?? record.run_time,
        enabled: patch.enabled ?? record.enabled,
        nurture_before: patch.nurture_before ?? record.nurture_before,
        nurture_after: patch.nurture_after ?? record.nurture_after,
      },
    });
  }

  return (
    <DashboardCard
      title={<CardHeading icon={<ClockCircleOutlined />} title={t("crawlScheduleTitle")} desc={t("crawlScheduleDesc")} />}
    >
      {mdUp ? (
      <Table
        size="middle"
        loading={isLoading}
        rowKey="platform"
        dataSource={rows}
        pagination={paging}
        columns={[
          {
            title: t("platform"),
            dataIndex: "platform",
            width: 160,
            render: (p: string) => <PlatformBadge platform={p} size={22} />,
          },
          {
            title: t("columnRunTime"),
            key: "run_time",
            width: 128,
            render: (_: unknown, record: CrawlSchedule) => (
              <TimePicker
                size="small"
                format={TIME_FORMAT}
                value={dayjs(record.run_time, TIME_FORMAT)}
                allowClear={false}
                onChange={(value: Dayjs | null) => {
                  if (!value) return;
                  persist(record, { run_time: value.format(TIME_FORMAT) });
                }}
              />
            ),
          },
          {
            title: t("enabled"),
            key: "enabled",
            align: "center",
            width: 80,
            render: (_: unknown, record: CrawlSchedule) => (
              <Switch
                size="small"
                checked={record.enabled}
                loading={setSchedule.isPending && setSchedule.variables?.platform === record.platform}
                onChange={(checked) => persist(record, { enabled: checked })}
              />
            ),
          },
          {
            title: t("columnSessionWarmup"),
            key: "warmup",
            width: 200,
            render: (_: unknown, record: CrawlSchedule) => {
              const allowed = NURTURE_SCHEDULE_PLATFORMS.has(record.platform);
              const loading = setSchedule.isPending && setSchedule.variables?.platform === record.platform;
              return (
                <div className="flex items-center gap-4">
                  <Tooltip title={allowed ? t("nurtureBeforeCrawlHint") : t("nurtureScheduleUnsupported")}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--muted)]">{t("nurtureWarmupBeforeShort")}</span>
                      <Switch
                        size="small"
                        disabled={!allowed}
                        checked={allowed && record.nurture_before}
                        loading={loading}
                        onChange={(checked) => persist(record, { nurture_before: checked })}
                      />
                    </span>
                  </Tooltip>
                  <Tooltip title={allowed ? t("nurtureAfterCrawlHint") : t("nurtureScheduleUnsupported")}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--muted)]">{t("nurtureWarmupAfterShort")}</span>
                      <Switch
                        size="small"
                        disabled={!allowed}
                        checked={allowed && record.nurture_after}
                        loading={loading}
                        onChange={(checked) => persist(record, { nurture_after: checked })}
                      />
                    </span>
                  </Tooltip>
                </div>
              );
            },
          },
          {
            title: t("columnLastTriggered"),
            key: "last_triggered_date",
            render: (_: unknown, record: CrawlSchedule) =>
              record.last_triggered_date ? (
                <span className="text-xs text-[var(--muted)]">{formatRelativeTime(record.last_triggered_date, t)}</span>
              ) : (
                <Typography.Text type="secondary">{t("crawlScheduleNotSet")}</Typography.Text>
              ),
          },
        ]}
      />
      ) : (
        <ItemCardList items={rows} loading={isLoading} rowKey={(r) => r.platform} pagination={paging}>
          {(record) => (
            <ItemCard>
              <div className="mb-2">
                <PlatformBadge platform={record.platform} size={22} />
              </div>
              <ItemField label={t("columnRunTime")}>
                <TimePicker
                  size="small"
                  format={TIME_FORMAT}
                  value={dayjs(record.run_time, TIME_FORMAT)}
                  allowClear={false}
                  onChange={(value: Dayjs | null) => {
                    if (!value) return;
                    persist(record, { run_time: value.format(TIME_FORMAT) });
                  }}
                />
              </ItemField>
              <ItemField label={t("enabled")}>
                <Switch
                  size="small"
                  checked={record.enabled}
                  loading={setSchedule.isPending && setSchedule.variables?.platform === record.platform}
                  onChange={(checked) => persist(record, { enabled: checked })}
                />
              </ItemField>
              <ItemField label={t("nurtureBeforeCrawl")}>
                <Switch
                  size="small"
                  disabled={!NURTURE_SCHEDULE_PLATFORMS.has(record.platform)}
                  checked={NURTURE_SCHEDULE_PLATFORMS.has(record.platform) && record.nurture_before}
                  loading={setSchedule.isPending && setSchedule.variables?.platform === record.platform}
                  onChange={(checked) => persist(record, { nurture_before: checked })}
                />
              </ItemField>
              <ItemField label={t("nurtureAfterCrawl")}>
                <Switch
                  size="small"
                  disabled={!NURTURE_SCHEDULE_PLATFORMS.has(record.platform)}
                  checked={NURTURE_SCHEDULE_PLATFORMS.has(record.platform) && record.nurture_after}
                  loading={setSchedule.isPending && setSchedule.variables?.platform === record.platform}
                  onChange={(checked) => persist(record, { nurture_after: checked })}
                />
              </ItemField>
              <ItemField label={t("columnLastTriggered")}>
                {record.last_triggered_date ? (
                  formatRelativeTime(record.last_triggered_date, t)
                ) : (
                  <Typography.Text type="secondary">{t("crawlScheduleNotSet")}</Typography.Text>
                )}
              </ItemField>
            </ItemCard>
          )}
        </ItemCardList>
      )}
    </DashboardCard>
  );
}
