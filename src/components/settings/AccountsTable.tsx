"use client";

import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import AccountFormModal from "@/components/settings/AccountFormModal";
import { useAccountMutations, useAccounts } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { checkStatusLabelKey, checkStatusTagColor } from "@/lib/accountHealth";
import { TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { platformLabel } from "@/lib/platform";
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
  const { create, update, remove, check } = useAccountMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  // Counts against the *unfiltered* list, so a pill's own count doesn't
  // change as a result of clicking it or typing in the search box - it
  // always answers "how many accounts are on this platform overall".
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of accounts ?? []) counts[a.platform] = (counts[a.platform] ?? 0) + 1;
    return counts;
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (accounts ?? []).filter((a) => {
      if (platformFilter && a.platform !== platformFilter) return false;
      if (!needle) return true;
      return (
        a.account_id.toLowerCase().includes(needle) ||
        (a.email ?? "").toLowerCase().includes(needle) ||
        a.platform.toLowerCase().includes(needle)
      );
    });
  }, [accounts, search, platformFilter]);

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[#bfbfbf]" />}
          placeholder={t("searchAccountsPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1"
          style={{ maxWidth: 360 }}
        />
        <Space wrap size={[8, 8]}>
          <Button
            size="small"
            shape="round"
            type={platformFilter === null ? "primary" : "default"}
            onClick={() => setPlatformFilter(null)}
          >
            {t("allPlatformsFilter")} ({accounts?.length ?? 0})
          </Button>
          {TRIGGERABLE_PLATFORMS.map((p) => (
            <Button
              key={p}
              size="small"
              shape="round"
              type={platformFilter === p ? "primary" : "default"}
              onClick={() => setPlatformFilter(p)}
            >
              {platformLabel(p)} ({platformCounts[p] ?? 0})
            </Button>
          ))}
        </Space>
      </div>
      <Table
        size="small"
        scroll={{ x: "max-content" }}
        loading={isLoading}
        rowKey="id"
        dataSource={filteredAccounts}
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
            title: t("columnHealth"),
            dataIndex: "last_check_status",
            render: (status: string | null) => <Tag color={checkStatusTagColor(status)}>{t(checkStatusLabelKey(status))}</Tag>,
          },
          {
            title: t("columnLastChecked"),
            dataIndex: "last_checked_at",
            render: (v: string | null) => formatRelativeTime(v, t),
          },
          {
            title: t("enabled"),
            dataIndex: "enabled",
            align: "center",
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
                <Tooltip title={t("checkAccountAction")}>
                  <Button
                    size="small"
                    icon={<SafetyCertificateOutlined />}
                    loading={check.isPending && check.variables === record.id}
                    onClick={() => check.mutate(record.id)}
                  />
                </Tooltip>
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
