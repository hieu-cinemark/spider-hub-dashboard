"use client";

import { FundOutlined } from "@ant-design/icons";
import { App, Button, Progress, Table, Tag, Tooltip, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import type { KeywordYield } from "@/lib/types";

/** Hiệu quả từng từ khoá Facebook/Threads (cinemark-api app/services/keyword_yield.py): % bài liên quan 14 ngày qua,
 * từ khoá bị tự tắt vì toàn ra rác (bật lại được), từ khoá kém chỉ được cào ít trang. */
export default function KeywordYieldCard({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["keyword-yield", platform], queryFn: () => api.keywordYield(platform), staleTime: 5 * 60_000 });
  const toggle = useMutation({
    mutationFn: (row: KeywordYield) => api.setKeywordEnabled(platform, row.id, !row.enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["keyword-yield", platform] });
      void queryClient.invalidateQueries({ queryKey: ["keywords", platform] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const status = (row: KeywordYield) => {
    if (row.auto_paused) return <Tag color="red">{t("keywordYieldAutoPaused")}</Tag>;
    if (!row.enabled) return <Tag>{t("keywordYieldOff")}</Tag>;
    if (row.ratio !== null && row.sample >= 150 && row.ratio < 0.4) return <Tag color="orange">{t("keywordYieldLowPages")}</Tag>;
    return <Tag color="green">{t("keywordYieldOn")}</Tag>;
  };

  const columns: ResponsiveColumnType<KeywordYield>[] = [
    {
      title: t("keyword"),
      dataIndex: "keyword",
      mobilePrimary: true,
      render: (v: string) => <span className="font-medium break-words">{v}</span>,
    },
    { title: t("movie"), dataIndex: "movie_title", render: (v: string) => <span className="break-words">{v || "—"}</span> },
    {
      title: t("keywordYieldRatio"),
      width: 180,
      render: (_: unknown, row: KeywordYield) =>
        row.ratio === null ? (
          <Typography.Text type="secondary">—</Typography.Text>
        ) : (
          <Tooltip title={t("keywordYieldRatioHint", { matched: row.matched ?? 0, dropped: row.dropped ?? 0, stored: row.stored ?? 0, relevant: row.relevant ?? 0 })}>
            <Progress
              percent={Math.round(row.ratio * 100)}
              size="small"
              strokeColor={row.ratio < 0.1 ? "#ef4444" : row.ratio < 0.4 ? "#f59e0b" : "#10b981"}
            />
          </Tooltip>
        ),
    },
    { title: t("keywordYieldSample"), dataIndex: "sample", width: 90, align: "right" },
    { title: t("keywordYieldStatus"), width: 150, render: (_: unknown, row: KeywordYield) => status(row) },
    {
      title: "",
      width: 90,
      mobileHidden: true,
      render: (_: unknown, row: KeywordYield) => (
        <Button size="small" loading={toggle.isPending && toggle.variables?.id === row.id} onClick={() => toggle.mutate(row)}>
          {row.enabled ? t("keywordYieldDisable") : t("keywordYieldEnable")}
        </Button>
      ),
    },
  ];

  return (
    <DashboardCard title={<CardHeading icon={<FundOutlined />} title={t("keywordYieldTitle")} desc={t("keywordYieldDesc")} />}>
      {isMobile ? (
        <MobileTable
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          columns={columns}
        />
      ) : (
      <Table<KeywordYield>
        size="small"
        rowKey="id"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        pagination={{ pageSize: 15, size: "small" }}
        scroll={{ x: 760 }}
        columns={columns}
      />
      )}
    </DashboardCard>
  );
}
