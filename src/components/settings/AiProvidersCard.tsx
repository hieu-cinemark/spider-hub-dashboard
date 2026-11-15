"use client";

import { ApiOutlined, CheckCircleFilled, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Table, Tag, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import {
  useAiProviders,
  useDeleteAiProvider,
  useSetActiveAiProvider,
  useSetAiProvider,
} from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { AiProvider, AiProviderInput } from "@/lib/types";
import AiProviderFormModal from "./AiProviderFormModal";

// The list of AI providers. Exactly one is "in use": it serves every AI task (classification, reports, chat, image
// reading) - no per-task or per-provider differences.
export default function AiProvidersCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: providers, isLoading } = useAiProviders();
  const setProvider = useSetAiProvider();
  const setActive = useSetActiveAiProvider();
  const remove = useDeleteAiProvider();
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

  const ready = (r: AiProvider) => r.api_key_set && !!r.base_url && !!r.model;

  const actions = (r: AiProvider) => (
    <div className="flex items-center justify-end gap-2">
      {r.active ? null : (
        <Button
          type="primary"
          ghost
          disabled={!ready(r)}
          loading={setActive.isPending && setActive.variables === r.key}
          onClick={() => setActive.mutate(r.key)}
        >
          {t("aiProviderUse")}
        </Button>
      )}
      <Button onClick={() => setEditing(r)}>{t("edit")}</Button>
      <Popconfirm
        title={t("aiProviderDeleteConfirm", { key: r.key })}
        disabled={r.active}
        okText={t("remove")}
        cancelText={t("cancel")}
        onConfirm={() => remove.mutate(r.key)}
      >
        <Button danger icon={<DeleteOutlined />} disabled={r.active} aria-label={t("remove")} />
      </Popconfirm>
    </div>
  );

  const columns: ResponsiveColumnType<AiProvider>[] = [
    {
      title: t("aiProviderKey"),
      dataIndex: "key",
      width: 160,
      mobilePrimary: true,
      render: (k: string, r: AiProvider) => (
        <span className="inline-flex items-center gap-2">
          <code className="break-all">{k}</code>
          {r.active ? (
            <Tag color="green" icon={<CheckCircleFilled />} className="!m-0">
              {t("aiProviderInUse")}
            </Tag>
          ) : null}
        </span>
      ),
    },
    {
      title: t("aiProviderBaseUrl"),
      dataIndex: "base_url",
      render: (v: string) => <span className="break-all">{v || "—"}</span>,
    },
    { title: t("aiProviderModel"), dataIndex: "model", width: 220, render: (v: string) => v || "—" },
    {
      title: t("aiProviderApiKey"),
      key: "status",
      width: 130,
      render: (_: unknown, r: AiProvider) =>
        ready(r) ? <Tag color="green">{t("aiProviderConfigured")}</Tag> : <Tag color="orange">{t("aiProviderNotConfigured")}</Tag>,
    },
    { title: "", key: "actions", width: 260, mobileHidden: true, render: (_: unknown, r: AiProvider) => actions(r) },
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
      {!isLoading && rows.length > 0 && !rows.some((r) => r.active) ? (
        <Typography.Paragraph type="warning" className="!mb-3">
          {t("aiNoActiveProvider")}
        </Typography.Paragraph>
      ) : null}
      {mdUp ? (
        <Table size="middle" loading={isLoading} rowKey="key" dataSource={rows} pagination={paging} columns={columns} />
      ) : (
        <MobileTable
          loading={isLoading}
          rowKey={(r) => r.key}
          dataSource={rows}
          columns={columns}
          pagination={paging}
          title={(record) => actions(record)}
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
