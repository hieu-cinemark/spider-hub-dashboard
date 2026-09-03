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
import { useTranslation } from "@/i18n/LocaleProvider";
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
  const { t } = useTranslation();
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
            <span className="text-sm font-semibold text-[#141414]">{t("authCredentialsTitle")}</span>
            <span className="text-xs font-normal text-[#8c8c8c]">{t("authCredentialsDesc")}</span>
          </div>
        </div>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t("addAccount")}
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
            title: t("platform"),
            dataIndex: "platform",
            render: (p: string) => <PlatformBadge platform={p} size={24} />,
          },
          { title: t("columnAccountId"), dataIndex: "account_id" },
          {
            title: t("columnEmail"),
            dataIndex: "email",
            render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text>,
          },
          {
            title: t("columnEmailPassword"),
            dataIndex: "email_password",
            render: (v: string) => <MaskedText value={v} />,
          },
          { title: t("columnPassword"), dataIndex: "password", render: (v: string) => <MaskedText value={v} /> },
          { title: t("column2fa"), dataIndex: "totp_secret", render: (v: string) => <MaskedText value={v} /> },
          {
            title: t("enabled"),
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
            title: t("actions"),
            key: "actions",
            render: (_: unknown, record: Account) => (
              <div className="flex gap-2">
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                <Popconfirm
                  title={t("removeAccountConfirm")}
                  onConfirm={() => remove.mutate(record.id)}
                  okText={t("remove")}
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
