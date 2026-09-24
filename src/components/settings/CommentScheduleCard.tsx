"use client";

import { CommentOutlined } from "@ant-design/icons";
import { InputNumber, Switch, Table, TimePicker, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import PlatformBadge from "@/components/PlatformBadge";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useCommentSchedule, useSetCommentSchedule } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { CommentSchedule } from "@/lib/types";

const TIME_FORMAT = "HH:mm";
const DEFAULT_RUN_TIME = "08:00";
const DEFAULT_TOP_N = 100;

// One row per platform with a comments spider, whether or not it has a
// comment_crawl_schedules row yet - same "not configured yet" vs "broken"
// reasoning as CrawlScheduleCard's own rowFor.
function rowFor(platform: string, schedules: CommentSchedule[] | undefined): CommentSchedule {
  const found = schedules?.find((s) => s.platform === platform);
  return {
    platform,
    run_time: found?.run_time ?? DEFAULT_RUN_TIME,
    enabled: found?.enabled ?? false,
    top_n: found?.top_n ?? DEFAULT_TOP_N,
    last_triggered_date: found?.last_triggered_date ?? null,
    updated_at: found?.updated_at ?? "",
  };
}

export default function CommentScheduleCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: schedules, isLoading } = useCommentSchedule();
  const setSchedule = useSetCommentSchedule();

  const rows = COMMENT_SUPPORTED_PLATFORMS.map((p) => rowFor(p, schedules));
  const schedulePaging = usePagedList(rows);
  const paging = schedulePaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  function persist(record: CommentSchedule, patch: Partial<CommentSchedule>) {
    setSchedule.mutate({
      platform: record.platform,
      input: {
        run_time: patch.run_time ?? record.run_time,
        enabled: patch.enabled ?? record.enabled,
        top_n: patch.top_n ?? record.top_n,
      },
    });
  }

  return (
    <DashboardCard
      title={<CardHeading icon={<CommentOutlined />} title={t("commentScheduleTitle")} desc={t("commentScheduleDesc")} />}
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
              render: (_: unknown, record: CommentSchedule) => (
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
              title: t("columnCommentTopN"),
              key: "top_n",
              width: 140,
              render: (_: unknown, record: CommentSchedule) => (
                <InputNumber
                  size="small"
                  min={1}
                  max={500}
                  value={record.top_n}
                  onChange={(value) => {
                    if (value == null) return;
                    persist(record, { top_n: Number(value) });
                  }}
                />
              ),
            },
            {
              title: t("enabled"),
              key: "enabled",
              align: "center",
              width: 80,
              render: (_: unknown, record: CommentSchedule) => (
                <Switch
                  size="small"
                  checked={record.enabled}
                  loading={setSchedule.isPending && setSchedule.variables?.platform === record.platform}
                  onChange={(checked) => persist(record, { enabled: checked })}
                />
              ),
            },
            {
              title: t("columnLastTriggered"),
              key: "last_triggered_date",
              render: (_: unknown, record: CommentSchedule) =>
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
              <ItemField label={t("columnCommentTopN")}>
                <InputNumber
                  size="small"
                  min={1}
                  max={500}
                  value={record.top_n}
                  onChange={(value) => {
                    if (value == null) return;
                    persist(record, { top_n: Number(value) });
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
