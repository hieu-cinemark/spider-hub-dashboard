"use client";

import { ApiOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useAiProviders, useSetAiProvider } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { AiProvider, AiProviderInput } from "@/lib/types";
import AiProviderFormModal from "./AiProviderFormModal";

export default function AiProvidersCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: providers, isLoading } = useAiProviders();
  const setProvider = useSetAiProvider();
  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = providers ?? [];
  const paging = usePagedList(rows).paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  function submit(key: string, input: AiProviderInput) {
    setProvider.mutate(
      { key, input },
      {
        onSuccess: () => {
          setEditing(null);
          setAdding(false);
        },
      },
    );
  }

  const statusTag = (record: AiProvider) =>
    record.api_key_set && record.base_url ? (
      <Tag color="green">{t("aiProviderConfigured")}</Tag>
    ) : (
      <Tag color="orange">{t("aiProviderNotConfigured")}</Tag>
    );

  const columns: ResponsiveColumnType<AiProvider>[] = [
    {
      title: t("aiProviderKey"),
      dataIndex: "key",
      width: 140,
      mobilePrimary: true,
      render: (k: string) => <code className="break-all">{k}</code>,
    },
    {
      title: t("aiProviderBaseUrl"),
      dataIndex: "base_url",
      render: (v: string) => <span className="break-all">{v || "—"}</span>,
    },
    { title: t("aiProviderChatModel"), dataIndex: "model", width: 180, render: (v: string) => v || "—" },
    { title: t("aiProviderImageModel"), dataIndex: "image_model", width: 180, render: (v: string) => v || "—" },
    {
      title: t("aiProviderApiKey"),
      key: "status",
      width: 140,
      render: (_: unknown, r: AiProvider) => statusTag(r),
    },
    {
      title: t("columnLastTriggered"),
      key: "updated_at",
      width: 160,
      render: (_: unknown, r: AiProvider) =>
        r.updated_at ? (
          <span className="text-xs text-[var(--muted)]">{formatRelativeTime(r.updated_at, t)}</span>
        ) : (
          <Typography.Text type="secondary">{t("crawlScheduleNotSet")}</Typography.Text>
        ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      mobileHidden: true,
      render: (_: unknown, r: AiProvider) => <Button onClick={() => setEditing(r)}>{t("edit")}</Button>,
    },
  ];

  return (
    <DashboardCard
      title={<CardHeading icon={<ApiOutlined />} title={t("aiProvidersTitle")} desc={t("aiProvidersDesc")} />}
      extra={
        <Button icon={<PlusOutlined />} onClick={() => setAdding(true)}>
          {t("addAiProvider")}
        </Button>
      }
    >
      {mdUp ? (
        <Table
          size="middle"
          loading={isLoading}
          rowKey="key"
          dataSource={rows}
          pagination={paging}
          columns={columns}
        />
      ) : (
        <MobileTable
          loading={isLoading}
          rowKey={(r) => r.key}
          dataSource={rows}
          columns={columns}
          pagination={paging}
          title={(record) => (
            <Button size="small" onClick={() => setEditing(record)}>
              {t("edit")}
            </Button>
          )}
        />
      )}

      <AiProviderFormModal
        open={adding || !!editing}
        provider={editing}
        loading={setProvider.isPending}
        onCancel={() => {
          setEditing(null);
          setAdding(false);
        }}
        onSubmit={submit}
      />
    </DashboardCard>
  );
}
