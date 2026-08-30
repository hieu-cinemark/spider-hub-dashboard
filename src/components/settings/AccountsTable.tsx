"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Switch, Table, Typography } from "antd";
import { useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import AccountFormModal from "@/components/settings/AccountFormModal";
import { useAccountMutations, useAccounts } from "@/hooks/useSettings";
import type { Account, AccountInput } from "@/lib/types";

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

export default function AccountsTable() {
  const { data: accounts, isLoading } = useAccounts();
  const { create, update, remove } = useAccountMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setModalOpen(true);
  }

  function handleSubmit(input: AccountInput) {
    const mutation = editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input);
    mutation.then(() => setModalOpen(false));
  }

  return (
    <DashboardCard
      title={
        <div className="flex items-center gap-2 py-1">
          <KeyOutlined className="text-[#2f54eb]" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#141414]">Authentication credentials</span>
            <span className="text-xs font-normal text-[#8c8c8c]">Accounts used to log in and crawl each platform.</span>
          </div>
        </div>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add account
        </Button>
      }
    >
      <Table
        size="small"
        scroll={{ x: "max-content" }}
        loading={isLoading}
        rowKey="id"
        dataSource={accounts ?? []}
        pagination={false}
        columns={[
          {
            title: "Platform",
            dataIndex: "platform",
            render: (p: string) => <PlatformBadge platform={p} size={24} />,
          },
          { title: "Account ID", dataIndex: "account_id" },
          { title: "Email", dataIndex: "email", render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text> },
          { title: "Password", dataIndex: "password", render: (v: string) => <MaskedText value={v} /> },
          { title: "2FA secret", dataIndex: "totp_secret", render: (v: string) => <MaskedText value={v} /> },
          {
            title: "Enabled",
            dataIndex: "enabled",
            render: (enabled: boolean, record: Account) => (
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
            render: (_: unknown, record: Account) => (
              <div className="flex gap-2">
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                <Popconfirm
                  title="Remove this account?"
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
      <AccountFormModal
        open={modalOpen}
        account={editing}
        loading={create.isPending || update.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </DashboardCard>
  );
}
