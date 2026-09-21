"use client";

import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { App, Button, Checkbox, Dropdown, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import PlatformBadge from "@/components/PlatformBadge";
import AccountFormModal from "@/components/settings/AccountFormModal";
import ImportWithAiModal from "@/components/settings/ImportWithAiModal";
import NurtureAccountsModal from "@/components/settings/NurtureAccountsModal";
import NurtureJobBanner from "@/components/settings/NurtureJobBanner";
import PlatformFilter, { ALL_PLATFORM_QUERY } from "@/components/PlatformFilter";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { useAccountMutations, useAccounts, useProxies } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { poolStatusInfo } from "@/lib/poolStatus";
import type { Account, AccountInput } from "@/lib/types";

// Label stacked above value (not side-by-side) so a long value - a raw
// cookie header can run past 300 characters - wraps as a normal paragraph
// instead of getting squeezed into a narrow column next to its label.
// break-all (not just wrap) matters here specifically because a
// semicolon/equals-delimited cookie string has no natural word-break
// points a browser would otherwise wrap on, and without it the browser
// tries to keep the whole thing on one line, stretching the modal (or
// overflowing it) instead of actually wrapping.
function MaskedRow({ label, value }: { label: string; value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="py-1.5">
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--muted)]">{label}</span>
        {value && (
          <Button
            type="text"
            size="small"
            icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setVisible((v) => !v)}
          />
        )}
      </div>
      {value ? (
        <div className="break-all font-mono text-xs leading-relaxed">
          {visible ? value : "•".repeat(Math.min(value.length, 24))}
        </div>
      ) : (
        <Typography.Text type="secondary">—</Typography.Text>
      )}
    </div>
  );
}

// A Modal, not a Popover - a click-triggered Popover inside a dense table
// (80+ rows) let two rows' popovers end up open and overlapping at once
// (clicking a second row's trigger doesn't reliably close the first one's
// popup), which looked exactly like visual corruption. A Modal is a
// singleton by construction (one open at a time, centered, its own
// backdrop) so that class of bug can't happen.
function CredentialsModal({ account, isTikTok }: { account: Account; isTikTok: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title={t("viewCredentialsAction")}>
        <Button size="small" icon={<LockOutlined />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={t("columnCredentials")}
        width={440}
        centered
        destroyOnHidden
      >
        <div className="flex flex-col gap-1">
          {!isTikTok && (
            <>
              <MaskedRow label={t("columnPassword")} value={account.password} />
              <MaskedRow label={t("column2fa")} value={account.totp_secret} />
              <MaskedRow label={t("columnEmailPassword")} value={account.email_password} />
            </>
          )}
          <MaskedRow label={t("columnCookie")} value={account.cookie} />
          <MaskedRow label={isTikTok ? t("odinId") : t("tokenReserved")} value={account.token} />
        </div>
      </Modal>
    </>
  );
}

function AccountPoolTag({ account }: { account: Account }) {
  const { t } = useTranslation();
  const info = poolStatusInfo("account", account.pool_status, account.cooldown_until, account.enabled);
  const tag = (
    <Tag className="!m-0" color={info.tagColor}>
      {t(info.labelKey)}
    </Tag>
  );
  if (info.labelKey === "poolStatusCooldown" && account.cooldown_until) {
    return (
      <Tooltip title={t("cooldownUntilTooltip", { time: new Date(account.cooldown_until).toLocaleString() })}>
        {tag}
      </Tooltip>
    );
  }
  if (account.last_check_note) {
    // AI diagnosis (see spider-hub's services/kira.
    // diagnose_account_failure) from the last hard-disable -
    // the icon signals there's more to read on hover, a
    // plain colored tag gives no such hint.
    return (
      <Tooltip title={account.last_check_note}>
        <Space size={4}>
          {tag}
          <InfoCircleOutlined className="text-[var(--muted)]" />
        </Space>
      </Tooltip>
    );
  }
  return tag;
}

const ACCOUNTS_QUERY = { platform: ALL_PLATFORM_QUERY, q: "", status: "all" };

type AccountStatusFilter = "all" | "active" | "disabled" | "checkpoint" | "cooldown";

function matchesAccountStatus(account: Account, status: AccountStatusFilter): boolean {
  if (status === "all") return true;
  const cooling =
    account.cooldown_until != null && new Date(account.cooldown_until).getTime() > Date.now();
  if (status === "disabled") return !account.enabled;
  if (status === "checkpoint") return account.pool_status === "checkpoint";
  if (status === "cooldown") return account.enabled && cooling;
  if (status === "active") {
    return account.enabled && account.pool_status !== "checkpoint" && !cooling;
  }
  return true;
}

export default function AccountsTable() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { modal } = App.useApp();
  const { data: accounts, isLoading } = useAccounts();
  const { data: proxies } = useProxies();
  const { create, update, remove, check, nurture, resetProxy, setProxy, bulkRemove } = useAccountMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [query, setQuery] = useQueryRecord(ACCOUNTS_QUERY);
  const search = query.q;
  const platformFilter = query.platform === ALL_PLATFORM_QUERY ? null : query.platform;
  const statusFilter = (["all", "active", "disabled", "checkpoint", "cooldown"] as const).includes(
    query.status as AccountStatusFilter,
  )
    ? (query.status as AccountStatusFilter)
    : "all";
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of accounts ?? []) {
      if (!matchesAccountStatus(a, statusFilter)) continue;
      counts[a.platform] = (counts[a.platform] ?? 0) + 1;
    }
    return counts;
  }, [accounts, statusFilter]);

  const filteredAccounts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (accounts ?? []).filter((a) => {
      if (platformFilter && a.platform !== platformFilter) return false;
      if (!matchesAccountStatus(a, statusFilter)) return false;
      if (!needle) return true;
      return (
        a.account_id.toLowerCase().includes(needle) ||
        (a.email ?? "").toLowerCase().includes(needle) ||
        a.platform.toLowerCase().includes(needle)
      );
    });
  }, [accounts, search, platformFilter, statusFilter]);

  const accountsPaging = usePagedList(filteredAccounts, `${search}|${platformFilter ?? ""}|${statusFilter}`);
  const paging = accountsPaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));

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

  function confirmDelete(record: Account) {
    modal.confirm({
      title: t("removeAccountConfirm"),
      okText: t("remove"),
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(record.id),
    });
  }

  function confirmBulkRemove() {
    modal.confirm({
      title: t("bulkRemoveConfirm", { n: selectedIds.length }),
      okText: t("bulkRemoveAction"),
      okButtonProps: { danger: true },
      onOk: () => bulkRemove.mutate(selectedIds, { onSuccess: () => setSelectedIds([]) }),
    });
  }

  return (
    <DashboardCard
      title={<CardHeading icon={<KeyOutlined />} title={t("authCredentialsTitle")} desc={t("authCredentialsDesc")} />}
      extra={
        <Space>
          <NurtureAccountsModal
            loading={nurture.isPending && nurture.variables?.account_id == null}
            onSubmit={(input) => nurture.mutateAsync(input)}
          />
          <ImportWithAiModal defaultTarget="accounts" />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t("addAccount")}
          </Button>
        </Space>
      }
    >
      <NurtureJobBanner />
      <div className="filter-bar mb-4">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-[var(--muted)]" />}
          placeholder={t("searchAccountsPlaceholder")}
          value={search}
          onChange={(e) => setQuery({ q: e.target.value })}
          className="min-w-[200px] flex-1"
          style={{ maxWidth: 320 }}
        />
        <Select
          value={statusFilter}
          onChange={(next: AccountStatusFilter) => setQuery({ status: next })}
          style={{ minWidth: 168 }}
          options={[
            { value: "all", label: t("accountFilterAllStatuses") },
            { value: "active", label: t("accountFilterActive") },
            { value: "disabled", label: t("accountFilterDisabled") },
            { value: "checkpoint", label: t("accountFilterCheckpoint") },
            { value: "cooldown", label: t("accountFilterCooldown") },
          ]}
          aria-label={t("accountFilterStatus")}
        />
        <PlatformFilter
          value={query.platform}
          platforms={TRIGGERABLE_PLATFORMS}
          counts={platformCounts}
          onChange={(next) => setQuery({ platform: next })}
        />
      </div>
      {selectedIds.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] px-3 py-2">
          <span className="text-xs font-medium text-[var(--accent-deep)]">{t("selectedCountLabel", { n: selectedIds.length })}</span>
          {/* No bulk enable/disable anymore - same reason the per-row Switch
              became read-only, see that column's comment. */}
          <Button size="small" danger loading={bulkRemove.isPending} onClick={confirmBulkRemove}>
            {t("bulkRemoveAction")}
          </Button>
        </div>
      )}
      {mdUp ? (
      isLoading && !accounts ? (
        <TableRowsSkeleton rows={8} />
      ) : (
      <Table
        size="middle"
        rowKey="id"
        dataSource={filteredAccounts}
        pagination={paging}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
        }}
        columns={[
            {
              title: t("platform"),
              dataIndex: "platform",
              width: 108,
              render: (p: string) => <PlatformBadge platform={p} size={22} showLabel={false} />,
            },
          {
            title: t("columnAccountId"),
            key: "account",
            ellipsis: true,
            render: (_: unknown, record: Account) => (
              <div className="min-w-0">
                <div className="truncate font-medium">{record.account_id}</div>
                <div className="truncate text-xs text-[var(--muted)]">{record.email || "—"}</div>
              </div>
            ),
          },
          {
            title: t("columnPoolStatus"),
            key: "health",
            width: 132,
            render: (_: unknown, record: Account) => <AccountPoolTag account={record} />,
          },
          {
            title: t("columnProxy"),
            key: "proxy",
            width: 200,
            ellipsis: true,
            onCell: () => ({ className: "min-w-0" }),
            render: (_: unknown, record: Account) => (
              <ProxyPicker account={record} proxies={proxies ?? []} setProxy={setProxy} resetProxy={resetProxy} />
            ),
          },
            {
              title: t("columnCredentials"),
              key: "credentials",
              width: 108,
              align: "center",
            render: (_: unknown, record: Account) => (
              <CredentialsModal account={record} isTikTok={record.platform === "tiktok"} />
            ),
          },
          {
            title: t("actions"),
            key: "actions",
            width: 108,
            align: "right",
            render: (_: unknown, record: Account) => (
              <div className="flex items-center gap-1">
                <Tooltip title={t("checkAccountAction")}>
                  <Button
                    size="small"
                    icon={<SafetyCertificateOutlined />}
                    loading={check.isPending && check.variables === record.id}
                    onClick={() => check.mutate(record.id)}
                  />
                </Tooltip>
                <Dropdown
                  menu={{
                    items: [
                      ...(record.platform === "facebook" || record.platform === "threads"
                        ? [{ key: "nurture", label: t("nurtureThisAccount"), icon: <HeartOutlined /> }]
                        : []),
                      { key: "edit", label: t("edit"), icon: <EditOutlined /> },
                      { key: "delete", label: t("remove"), icon: <DeleteOutlined />, danger: true },
                    ],
                    onClick: ({ key }) => {
                      if (key === "nurture") nurture.mutate({ account_id: record.id });
                      if (key === "edit") openEdit(record);
                      if (key === "delete") confirmDelete(record);
                    },
                  }}
                >
                  <Button size="small" icon={<DownOutlined />} />
                </Dropdown>
              </div>
            ),
          },
        ]}
      />
      )
      ) : (
        <ItemCardList
          items={filteredAccounts}
          loading={isLoading}
          rowKey={(a) => String(a.id)}
          pagination={paging}
        >
          {(record) => {
            const selected = selectedIds.includes(record.id);
            return (
              <ItemCard>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Checkbox
                      checked={selected}
                      onChange={(e) => {
                        setSelectedIds((ids) =>
                          e.target.checked ? [...ids, record.id] : ids.filter((id) => id !== record.id),
                        );
                      }}
                    />
                    <PlatformBadge platform={record.platform} size={22} showLabel={false} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip title={t("checkAccountAction")}>
                      <Button
                        size="small"
                        icon={<SafetyCertificateOutlined />}
                        loading={check.isPending && check.variables === record.id}
                        onClick={() => check.mutate(record.id)}
                      />
                    </Tooltip>
                    <Dropdown
                      menu={{
                        items: [
                          ...(record.platform === "facebook" || record.platform === "threads"
                            ? [{ key: "nurture", label: t("nurtureThisAccount"), icon: <HeartOutlined /> }]
                            : []),
                          { key: "edit", label: t("edit"), icon: <EditOutlined /> },
                          { key: "delete", label: t("remove"), icon: <DeleteOutlined />, danger: true },
                        ],
                        onClick: ({ key }) => {
                          if (key === "nurture") nurture.mutate({ account_id: record.id });
                          if (key === "edit") openEdit(record);
                          if (key === "delete") confirmDelete(record);
                        },
                      }}
                    >
                      <Button size="small" icon={<DownOutlined />} />
                    </Dropdown>
                  </div>
                </div>
                <ItemField label={t("columnAccountId")}>
                  <div className="font-medium">{record.account_id}</div>
                  <div className="text-xs text-[var(--muted)]">{record.email || "—"}</div>
                </ItemField>
                <ItemField label={t("columnPoolStatus")}>
                  <AccountPoolTag account={record} />
                </ItemField>
                <ItemField label={t("columnProxy")}>
                  <ProxyPicker account={record} proxies={proxies ?? []} setProxy={setProxy} resetProxy={resetProxy} />
                </ItemField>
                <ItemField label={t("columnCredentials")}>
                  <CredentialsModal account={record} isTikTok={record.platform === "tiktok"} />
                </ItemField>
              </ItemCard>
            );
          }}
        </ItemCardList>
      )}
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

// Inline picker (not a modal) so re-assigning an account's proxy is a single
// click from the row it's already showing "Health" for, instead of a
// separate action button that opens something else - see the FE-usability
// feedback this replaced (a "re-pin to least-loaded" icon button only).
function ProxyPicker({
  account,
  proxies,
  setProxy,
  resetProxy,
}: {
  account: Account;
  proxies: { id: number; platform: string; proxy_url: string }[];
  setProxy: ReturnType<typeof useAccountMutations>["setProxy"];
  resetProxy: ReturnType<typeof useAccountMutations>["resetProxy"];
}) {
  const { t } = useTranslation();
  const options = useMemo(() => {
    const matching = proxies.filter((p) => p.platform === account.platform || p.platform === "all");
    return [
      { value: 0, label: t("autoAssignProxyOption") },
      ...matching.map((p) => ({ value: p.id, label: p.proxy_url })),
    ];
  }, [proxies, account.platform, t]);

  const pending =
    (setProxy.isPending && setProxy.variables?.id === account.id) ||
    (resetProxy.isPending && resetProxy.variables === account.id);

  return (
    <Select
      size="small"
      className="w-full font-mono text-xs"
      popupMatchSelectWidth={false}
      value={account.assigned_proxy_id ?? 0}
      options={options}
      loading={pending}
      disabled={pending}
      onChange={(proxyId: number) => {
        if (proxyId === 0) resetProxy.mutate(account.id);
        else setProxy.mutate({ id: account.id, proxyId });
      }}
    />
  );
}
