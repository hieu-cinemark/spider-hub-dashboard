"use client";

import { CloudServerOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
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
          columns={[
            { title: t("proxyProviderKey"), dataIndex: "key", width: 200, render: (k: string) => <code>{k}</code> },
            { title: t("proxyProviderApiUrl"), dataIndex: "api_url", ellipsis: true },
            { title: t("proxyProviderMode"), key: "mode", width: 160, render: (_: unknown, r: ProxyProvider) => modeTag(r) },
            { title: t("proxyProviderToken"), key: "token", width: 260, render: (_: unknown, r: ProxyProvider) => tokenTag(r) },
            {
              title: t("columnLastTriggered"),
              key: "updated_at",
              width: 140,
              render: (_: unknown, r: ProxyProvider) =>
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
              render: (_: unknown, r: ProxyProvider) => <Button onClick={() => setEditing(r)}>{t("edit")}</Button>,
            },
          ]}
        />
      ) : (
        <ItemCardList items={rows} loading={isLoading} rowKey={(r) => r.key} pagination={paging}>
          {(record) => (
            <ItemCard onClick={() => setEditing(record)}>
              <ItemField label={t("proxyProviderKey")}>
                <code>{record.key}</code>
              </ItemField>
              <ItemField label={t("proxyProviderApiUrl")}>
                <span className="break-all">{record.api_url || "—"}</span>
              </ItemField>
              <ItemField label={t("proxyProviderMode")}>{modeTag(record)}</ItemField>
              <ItemField label={t("proxyProviderToken")}>{tokenTag(record)}</ItemField>
            </ItemCard>
          )}
        </ItemCardList>
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
