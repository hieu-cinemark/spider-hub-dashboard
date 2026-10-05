"use client";

import { RightOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Empty, Table, Tag, Tooltip } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import { accountBucket } from "@/lib/accountPool";
import { formatRelativeTime } from "@/lib/format";
import type { Account } from "@/lib/types";

const MAX_ROWS = 6;
// Matches spider-hub's pool: a few failures in a row usually precedes a
// checkpoint or a logout, so it's worth surfacing before it gets there.
const FAILURE_STREAK = 3;

type Issue = { account: Account; key: TranslationKey | "failures"; color: string; rank: number };

function issueOf(account: Account): Issue | null {
  const bucket = accountBucket(account);
  if (bucket === "checkpoint") return { account, key: "poolStatusCheckpoint", color: "volcano", rank: 0 };
  if (bucket === "dead") return { account, key: "checkStatusDead", color: "error", rank: 1 };
  if (bucket === "cooldown") return { account, key: "poolStatusCooldown", color: "warning", rank: 3 };
  if (account.enabled && (account.consecutive_failures ?? 0) >= FAILURE_STREAK) {
    return { account, key: "failures", color: "warning", rank: 2 };
  }
  return null;
}

export default function AccountIssuesCard({ accounts, loading }: { accounts: Account[]; loading: boolean }) {
  const { t } = useTranslation();
  const issues = useMemo(
    () =>
      accounts
        .map(issueOf)
        .filter((row): row is Issue => row !== null)
        .sort((a, b) => a.rank - b.rank || (b.account.last_used_at ?? "").localeCompare(a.account.last_used_at ?? "")),
    [accounts],
  );
  const shown = issues.slice(0, MAX_ROWS);

  return (
    <DashboardCard
      className="h-full"
      loading={loading}
      title={
        <CardHeading
          icon={<WarningOutlined />}
          title={`${t("accountIssuesTitle")}${issues.length ? ` (${issues.length})` : ""}`}
          desc={t("accountIssuesDesc")}
        />
      }
      extra={
        <Link href="/settings?tab=accounts-proxies">
          <Button size="small" icon={<RightOutlined />} iconPlacement="end">
            {t("openInSettings")}
          </Button>
        </Link>
      }
    >
      {issues.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("accountIssuesEmpty")} />
      ) : (
        <>
          <Table<Issue>
            className="data-table"
            size="small"
            rowKey={(row) => row.account.id}
            dataSource={shown}
            pagination={false}
            columns={[
              {
                title: t("platform"),
                key: "platform",
                width: 64,
                render: (_: unknown, row: Issue) => (
                  <PlatformBadge platform={row.account.platform} size={20} showLabel={false} />
                ),
              },
              {
                title: t("columnAccountId"),
                key: "account",
                ellipsis: true,
                render: (_: unknown, row: Issue) => (
                  <Link
                    href={`/settings?tab=accounts-proxies&q=${encodeURIComponent(row.account.account_id)}`}
                    className="block min-w-0 text-inherit"
                  >
                    <div className="truncate font-medium">{row.account.account_id}</div>
                    <div className="truncate text-xs text-[var(--muted)]">{row.account.email || "—"}</div>
                  </Link>
                ),
              },
              {
                title: t("columnIssue"),
                key: "issue",
                width: 150,
                render: (_: unknown, row: Issue) => {
                  const tag = (
                    <Tag className="!m-0" color={row.color}>
                      {row.key === "failures"
                        ? t("accountIssueFailures", { n: row.account.consecutive_failures ?? 0 })
                        : t(row.key)}
                    </Tag>
                  );
                  return row.account.last_check_note ? <Tooltip title={row.account.last_check_note}>{tag}</Tooltip> : tag;
                },
              },
              {
                title: t("columnLastUsed"),
                key: "used",
                width: 120,
                render: (_: unknown, row: Issue) => (
                  <span className="cell-meta whitespace-nowrap">{formatRelativeTime(row.account.last_used_at, t)}</span>
                ),
              },
            ]}
          />
          {issues.length > MAX_ROWS ? (
            <div className="mt-2 text-right text-xs text-[var(--muted)]">
              {t("accountIssuesMore", { n: issues.length - MAX_ROWS })}
            </div>
          ) : null}
        </>
      )}
    </DashboardCard>
  );
}
