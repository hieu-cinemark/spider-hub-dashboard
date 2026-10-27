"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  GlobalOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import PlatformBadge from "@/components/PlatformBadge";
import ImportWithAiModal from "@/components/settings/ImportWithAiModal";
import ProxyFormModal from "@/components/settings/ProxyFormModal";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useProxies, useProxyMutations } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { poolStatusInfo } from "@/lib/poolStatus";
import type { Proxy, ProxyInput } from "@/lib/types";

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

export default function ProxiesTable() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: proxies, isLoading } = useProxies();
  const { create, update, remove } = useProxyMutations();
  const proxyPaging = usePagedList(proxies ?? []);
  const paging = proxyPaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proxy | null>(null);

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
      width: 108,
      mobileHidden: true,
      render: (p: string) => (
        <PlatformBadge
          platform={p}
          label={p === "all" ? t("allPlatformsShared") : undefined}
          size={22}
          showLabel={false}
        />
      ),
    },
    {
      title: t("columnProxy"),
      dataIndex: "proxy_url",
      mobilePrimary: true,
      render: (v: string) => <span className="font-mono text-xs break-all">{v}</span>,
    },
    {
      title: t("columnAuth"),
      key: "auth",
      width: 168,
      render: (_: unknown, record: Proxy) => (
        <div className="min-w-0 leading-tight">
          <div className="text-xs break-words">{record.username || "—"}</div>
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
        const tag = <Tag color={info.tagColor} className="!m-0">{t(info.labelKey)}</Tag>;
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
        <div className="flex justify-end gap-1">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title={t("removeProxyConfirm")}
            onConfirm={() => remove.mutate(record.id)}
            okText={t("remove")}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
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
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
              <Popconfirm
                title={t("removeProxyConfirm")}
                onConfirm={() => remove.mutate(record.id)}
                okText={t("remove")}
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
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
    </DashboardCard>
  );
}
