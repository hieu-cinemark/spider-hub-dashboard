"use client";

import { CloudServerOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useProxyProviders, useSetProxyProvider } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { ProxyProvider, ProxyProviderInput } from "@/lib/types";
import ProxyProviderFormModal from "./ProxyProviderFormModal";

export default function ProxyProvidersCard() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: providers, isLoading } = useProxyProviders();
  const setProvider = useSetProxyProvider();
  const [editing, setEditing] = useState<ProxyProvider | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = providers ?? [];
  const paging = usePagedList(rows).paging((n) => t("tableTotal", { n: n.toLocaleString() }));

  function submit(key: string, input: ProxyProviderInput) {
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

  const tokenTag = (r: ProxyProvider) =>
    r.token_set ? (
      <Tag color="green">{t("proxyProviderTokenInDb")}</Tag>
    ) : (
      <Tag color="orange">{t("proxyProviderTokenMissing")}</Tag>
    );

  const modeTag = (r: ProxyProvider) =>
    r.ip_allowlist ? <Tag>{t("proxyProviderModeIpAllow")}</Tag> : <Tag>{t("proxyProviderModeUserPass")}</Tag>;

  const usage = (r: ProxyProvider) =>
    r.last_used_at ? (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[var(--muted)]">{formatRelativeTime(r.last_used_at, t)}</span>
        {r.last_status && r.last_status.startsWith("ok") ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tooltip title={r.last_status}>
            <Tag color="red" className="max-w-[200px] break-all">
              {r.last_status ?? t("proxyProviderNeverUsed")}
            </Tag>
          </Tooltip>
        )}
      </div>
    ) : (
      <Typography.Text type="secondary">{t("proxyProviderNeverUsed")}</Typography.Text>
    );

  const columns: ResponsiveColumnType<ProxyProvider>[] = [
    {
      title: t("proxyProviderKey"),
      dataIndex: "key",
      width: 200,
      mobilePrimary: true,
      render: (k: string) => <code className="break-all">{k}</code>,
    },
    {
      title: t("proxyProviderApiUrl"),
      dataIndex: "api_url",
      render: (v: string) => <span className="break-all">{v || "—"}</span>,
    },
    { title: t("proxyProviderMode"), key: "mode", width: 160, render: (_: unknown, r: ProxyProvider) => modeTag(r) },
    { title: t("proxyProviderToken"), key: "token", width: 260, render: (_: unknown, r: ProxyProvider) => tokenTag(r) },
    {
      title: t("columnLastTriggered"),
      key: "last_used_at",
      width: 220,
      render: (_: unknown, r: ProxyProvider) => usage(r),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      mobileHidden: true,
      render: (_: unknown, r: ProxyProvider) => <Button onClick={() => setEditing(r)}>{t("edit")}</Button>,
    },
  ];

  return (
    <DashboardCard
      title={<CardHeading icon={<CloudServerOutlined />} title={t("proxyProvidersTitle")} desc={t("proxyProvidersDesc")} />}
      extra={
        <Button icon={<PlusOutlined />} onClick={() => setAdding(true)}>
          {t("addProxyProvider")}
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

      <ProxyProviderFormModal
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
