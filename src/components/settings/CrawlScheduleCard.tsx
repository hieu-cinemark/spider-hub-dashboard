"use client";

import { ClockCircleOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Switch, Table, TimePicker, Tooltip, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
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
const MAX_RUNS_PER_DAY = 8;
const MIN_GAP_MINUTES = 60;

const toMinutes = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

/** Next free slot for "+": 6h after the last run, nudged forward until it is MIN_GAP_MINUTES from every run. */
function nextRunTime(times: string[]): string {
  let candidate = (toMinutes(times[times.length - 1] ?? DEFAULT_RUN_TIME) + 360) % 1440;
  for (let i = 0; i < 24; i++) {
    const ok = times.every((t) => {
      const d = Math.abs(toMinutes(t) - candidate);
      return Math.min(d, 1440 - d) >= MIN_GAP_MINUTES;
    });
    if (ok) break;
    candidate = (candidate + 60) % 1440;
  }
  return `${String(Math.floor(candidate / 60)).padStart(2, "0")}:${String(candidate % 60).padStart(2, "0")}`;
}

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
    run_times: found?.run_times?.length ? found.run_times : [found?.run_time ?? DEFAULT_RUN_TIME],
    enabled: found?.enabled ?? false,
    nurture_before: found?.nurture_before ?? false,
    nurture_after: found?.nurture_after ?? false,
    last_triggered_date: found?.last_triggered_date ?? null,
    updated_at: found?.updated_at ?? "",
  };
}

// 1-3 daily runs: one TimePicker per run, "+" adds one (6h after the last), "x" removes one. The API rejects runs
// closer than MIN_GAP_MINUTES apart and shows its error toast; the picker snaps back to the saved value.
function RunTimesEditor({ record, onSave }: { record: CrawlSchedule; onSave: (runTimes: string[]) => void }) {
  const { t } = useTranslation();
  const times = record.run_times ?? [record.run_time];
  const save = (next: string[]) => onSave([...new Set(next)].sort());
  return (
    <div className="flex flex-col gap-1">
      {times.map((time, index) => (
        <div key={`${time}-${index}`} className="flex items-center gap-1">
          <TimePicker
            size="small"
            format={TIME_FORMAT}
            value={dayjs(time, TIME_FORMAT)}
            allowClear={false}
            onChange={(value: Dayjs | null) => {
              if (!value) return;
              save(times.map((existing, i) => (i === index ? value.format(TIME_FORMAT) : existing)));
            }}
          />
          {times.length > 1 && (
            <Tooltip title={t("removeRunTime")}>
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => save(times.filter((_, i) => i !== index))} />
            </Tooltip>
          )}
        </div>
      ))}
      {times.length < MAX_RUNS_PER_DAY && (
        <Tooltip title={t("runTimesHint")}>
          <Button size="small" type="dashed" icon={<PlusOutlined />} className="self-start" onClick={() => save([...times, nextRunTime(times)])}>
            {t("addRunTime")}
          </Button>
        </Tooltip>
      )}
    </div>
  );
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
        run_times: patch.run_times ?? record.run_times ?? [record.run_time],
        enabled: patch.enabled ?? record.enabled,
        nurture_before: patch.nurture_before ?? record.nurture_before,
        nurture_after: patch.nurture_after ?? record.nurture_after,
      },
    });
  }

  const columns: ResponsiveColumnType<CrawlSchedule>[] = [
    {
      title: t("platform"),
      dataIndex: "platform",
      width: 160,
      mobilePrimary: true,
      render: (p: string) => <PlatformBadge platform={p} size={22} />,
    },
    {
      title: t("columnRunTime"),
      key: "run_time",
      width: 190,
      render: (_: unknown, record: CrawlSchedule) => (
        <RunTimesEditor record={record} onSave={(runTimes) => persist(record, { run_times: runTimes })} />
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
          <div className="flex flex-wrap items-center gap-4">
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
  ];

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
        columns={columns}
      />
      ) : (
        <MobileTable
          loading={isLoading}
          rowKey={(r) => r.platform}
          dataSource={rows}
          columns={columns}
          pagination={paging}
        />
      )}
    </DashboardCard>
  );
}
