"use client";

import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Switch, Table, Tag, Typography } from "antd";
import { useState } from "react";
import ProxyFormModal from "@/components/settings/ProxyFormModal";
import { useProxies, useProxyMutations } from "@/hooks/useSettings";
import { platformColor, platformLabel } from "@/lib/platform";
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
  const { data: proxies, isLoading } = useProxies();
  const { create, update, remove } = useProxyMutations();
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add proxy
        </Button>
      </div>
      <Table
        size="small"
        loading={isLoading}
        rowKey="id"
        dataSource={proxies ?? []}
        pagination={false}
        columns={[
          {
            title: "Platform",
            dataIndex: "platform",
            render: (p: string) => (p === "all" ? <Tag>All (shared)</Tag> : <Tag color={platformColor(p)}>{platformLabel(p)}</Tag>),
          },
          { title: "Proxy", dataIndex: "proxy_url", render: (v: string) => <span className="font-mono text-xs">{v}</span> },
          { title: "Username", dataIndex: "username" },
          { title: "Password", dataIndex: "password", render: (v: string) => <MaskedText value={v} /> },
          {
            title: "Use for login",
            dataIndex: "login_use_proxy",
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
            title: "Enabled",
            dataIndex: "enabled",
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
            title: "Actions",
            key: "actions",
            render: (_: unknown, record: Proxy) => (
              <div className="flex gap-2">
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                <Popconfirm
                  title="Remove this proxy?"
                  onConfirm={() => remove.mutate(record.id)}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />
      <ProxyFormModal
        open={modalOpen}
        proxy={editing}
        loading={create.isPending || update.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
