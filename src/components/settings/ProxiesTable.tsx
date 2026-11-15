"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Space, Switch, Table, Tooltip, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import PlatformBadge from "@/components/PlatformBadge";
import TableActions from "@/components/TableActions";
import StatusBadge, { toneFromTagColor } from "@/components/ui/StatusBadge";
import CopyButton from "@/components/ui/CopyButton";
import ImportWithAiModal from "@/components/settings/ImportWithAiModal";
import ProxyDetailDrawer from "@/components/settings/ProxyDetailDrawer";
import ProxyFormModal from "@/components/settings/ProxyFormModal";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useProxies, useProxyMutations } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import { poolStatusInfo } from "@/lib/poolStatus";
import type { Proxy, ProxyInput, ProxyIpType } from "@/lib/types";

const IP_TYPE_INFO = {
  static: { labelKey: "ipTypeStatic", tone: "ok" as const },
  rotating: { labelKey: "ipTypeRotating", tone: "info" as const },
  unknown: { labelKey: "ipTypeUnknown", tone: "neutral" as const },
} as const satisfies Record<ProxyIpType, { labelKey: TranslationKey; tone: "ok" | "info" | "neutral" }>;

function MaskedText({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  if (!value) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      {visible ? value : "•".repeat(Math.min(value.length, 12))}
      <Button
        type="text"
        size="small"
        icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={() => setVisible((v) => !v)}
      />
    </span>
  );
}

// The full address can carry credentials and a long query string. The table
// shows host:port; the full value stays in the row tooltip, the detail
// drawer and the copy button - nothing is ever silently dropped.
function shortProxyLabel(url: string): string {
  try {
    const parsed = new URL(url.includes("://") ? url : `http://${url}`);
    return parsed.host;
  } catch {
    return url;
  }
}

export default function ProxiesTable() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: proxies, isLoading } = useProxies();
  const { create, update, remove } = useProxyMutations();
  const proxyPaging = usePagedList(proxies ?? []);
  const paging = proxyPaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proxy | null>(null);
  const [detail, setDetail] = useState<Proxy | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(proxy: Proxy) {
    setEditing(proxy);
    setModalOpen(true);
  }

  function handleSubmit(input: ProxyInput) {
    const mutation = editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input);
    mutation.then(() => setModalOpen(false));
  }

  // Shared by the desktop table and the mobile card list - same fields,
  // nothing truncated on either.
  const columns: ResponsiveColumnType<Proxy>[] = [
    {
      title: t("platform"),
      dataIndex: "platform",
      width: 96,
      mobileHidden: true,
      render: (p: string) => (
        <PlatformBadge
          platform={p}
          label={p === "public" ? t("publicOnlyProxy") : undefined}
          size={22}
          showLabel={false}
        />
      ),
    },
    {
      title: t("columnProxy"),
      dataIndex: "proxy_url",
      width: 240,
      mobilePrimary: true,
      render: (v: string) => (
        <Tooltip title={v} styles={{ root: { maxWidth: 420 } }}>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="truncate-1 font-mono text-xs">{shortProxyLabel(v)}</span>
            <CopyButton value={v} />
          </span>
        </Tooltip>
      ),
    },
    {
      title: t("columnIpType"),
      dataIndex: "ip_type",
      width: 96,
      render: (v: ProxyIpType) => {
        const info = IP_TYPE_INFO[v] ?? IP_TYPE_INFO.unknown;
        return <StatusBadge tone={info.tone}>{t(info.labelKey)}</StatusBadge>;
      },
    },
    {
      title: t("columnAuth"),
      key: "auth",
      width: 168,
      render: (_: unknown, record: Proxy) => (
        <div className="min-w-0 leading-tight">
          <div className="truncate-1 text-xs">{record.username || "—"}</div>
          <MaskedText value={record.password} />
        </div>
      ),
    },
    {
      title: t("columnPoolStatus"),
      key: "pool_status",
      width: 124,
      render: (_: unknown, record: Proxy) => {
        const info = poolStatusInfo("proxy", record.pool_status, record.cooldown_until, record.enabled);
        const tag = <StatusBadge tone={toneFromTagColor(info.tagColor)}>{t(info.labelKey)}</StatusBadge>;
        if (info.labelKey === "poolStatusCooldown" && record.cooldown_until) {
          return (
            <Tooltip title={t("cooldownUntilTooltip", { time: new Date(record.cooldown_until).toLocaleString() })}>
              {tag}
            </Tooltip>
          );
        }
        return tag;
      },
    },
    {
      title: t("proxyProviderSource"),
      key: "provider",
      width: 168,
      render: (_: unknown, record: Proxy) =>
        record.provider_key ? (
          <Tooltip title={record.provider_ref ? `${record.provider_key} · ${record.provider_ref}` : record.provider_key}>
            <div className="min-w-0 leading-tight">
              <div className="truncate-1 text-xs">{record.provider_key}</div>
              {record.provider_ref ? (
                <div className="truncate-1 text-xs text-[var(--muted)]">{record.provider_ref}</div>
              ) : null}
            </div>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: t("columnProxyLoad"),
      dataIndex: "assigned_account_count",
      width: 72,
      align: "center",
      render: (n: number) => <span className="tabular-nums">{n}</span>,
    },
    {
      title: t("columnUseForLogin"),
      dataIndex: "login_use_proxy",
      width: 88,
      align: "center",
      render: (v: boolean, record: Proxy) => (
        <Switch
          size="small"
          checked={v}
          loading={update.isPending && update.variables?.id === record.id}
          onChange={(checked) => update.mutate({ id: record.id, input: { login_use_proxy: checked } })}
        />
      ),
    },
    {
      title: t("enabled"),
      dataIndex: "enabled",
      width: 72,
      align: "center",
      render: (enabled: boolean, record: Proxy) => (
        <Switch
          size="small"
          checked={enabled}
          loading={update.isPending && update.variables?.id === record.id}
          onChange={(checked) => update.mutate({ id: record.id, input: { enabled: checked } })}
        />
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 88,
      align: "right",
      mobileHidden: true,
      render: (_: unknown, record: Proxy) => (
        <TableActions
          actions={[
            {
              key: "details",
              label: t("viewDetails"),
              icon: <InfoCircleOutlined />,
              onClick: () => setDetail(record),
            },
            {
              key: "edit",
              label: t("edit"),
              icon: <EditOutlined />,
              onClick: () => openEdit(record),
            },
            {
              key: "delete",
              label: t("remove"),
              icon: <DeleteOutlined />,
              danger: true,
              confirm: {
                title: t("removeProxyConfirm"),
                onConfirm: () => remove.mutate(record.id),
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DashboardCard
      title={<CardHeading icon={<GlobalOutlined />} title={t("networkProxiesTitle")} desc={t("networkProxiesDesc")} />}
      extra={
        <Space>
          <ImportWithAiModal defaultTarget="proxies" />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t("addProxy")}
          </Button>
        </Space>
      }
    >
      {mdUp ? (
      isLoading && !proxies ? (
        <TableRowsSkeleton />
      ) : (
      <Table
        size="middle"
        rowKey="id"
        dataSource={proxies ?? []}
        pagination={paging}
        columns={columns}
      />
      )
      ) : (
        <MobileTable
          loading={isLoading}
          rowKey={(p) => String(p.id)}
          dataSource={proxies ?? []}
          columns={columns}
          pagination={paging}
          title={(record) => (
            <div className="flex gap-1">
              <Button size="small" icon={<InfoCircleOutlined />} onClick={() => setDetail(record)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            </div>
          )}
        />
      )}
      <ProxyFormModal
        open={modalOpen}
        proxy={editing}
        loading={create.isPending || update.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <ProxyDetailDrawer proxy={detail} onClose={() => setDetail(null)} />
    </DashboardCard>
  );
}
