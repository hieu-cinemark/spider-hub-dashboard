"use client";

import DetailDrawer from "@/components/ui/DetailDrawer";
import { DetailRow, DetailSection } from "@/components/ui/CopyableValue";
import CopyButton from "@/components/ui/CopyButton";
import StatusBadge, { type StatusTone } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/i18n/LocaleProvider";
import { checkStatusLabelKey } from "@/lib/accountHealth";
import { poolStatusInfo } from "@/lib/poolStatus";
import { formatRelativeTime } from "@/lib/format";
import type { Account } from "@/lib/types";

/**
 * The full account record.
 *
 * The table shows the things an operator scans (platform, account id,
 * pool status, session status). The technical values - the record id, the
 * timestamps, the failure streak, the AI diagnosis - are here instead of
 * being squeezed into a column.
 */
export default function AccountDetailDrawer({
  account,
  onClose,
}: {
  account: Account | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!account) return null;

  const pool = poolStatusInfo("account", account.pool_status, account.cooldown_until, account.enabled);
  const sessionTone: StatusTone =
    account.last_check_status === "ok"
      ? "ok"
      : account.last_check_status === "warning"
        ? "warning"
        : account.last_check_status === "dead"
          ? "danger"
          : "neutral";

  return (
    <DetailDrawer open onClose={onClose} width={520} title={account.account_id} subtitle={account.email || undefined}>
      <DetailSection title={t("accountIdentity")}>
        <DetailRow label={t("platform")}>{account.platform}</DetailRow>
        <DetailRow label={t("columnAccountId")} mono>
          {account.account_id}
        </DetailRow>
        <DetailRow label="Email">{account.email || "—"}</DetailRow>
      </DetailSection>

      <DetailSection title={t("accountHealthSection")}>
        <DetailRow label={t("columnPoolStatus")}>
          <StatusBadge tone={pool.tagColor === "error" ? "danger" : pool.tagColor === "warning" ? "warning" : "ok"}>
            {t(pool.labelKey)}
          </StatusBadge>
        </DetailRow>
        <DetailRow label={t("columnSession")}>
          <StatusBadge tone={sessionTone}>{t(checkStatusLabelKey(account.last_check_status))}</StatusBadge>
        </DetailRow>
        <DetailRow label={t("columnLastUsed")}>
          {formatRelativeTime(account.last_used_at, t)}
        </DetailRow>
        <DetailRow label={t("accountCooldownUntil")}>
          {account.cooldown_until ? new Date(account.cooldown_until).toLocaleString() : "—"}
        </DetailRow>
        <DetailRow label={t("accountConsecutiveFailures")}>{account.consecutive_failures ?? 0}</DetailRow>
        {account.last_check_note ? (
          <DetailRow label={t("accountLastCheckNote")}>{account.last_check_note}</DetailRow>
        ) : null}
      </DetailSection>

      <DetailSection title={t("accountTechnicalSection")}>
        <DetailRow label={t("accountRecordId")} mono>
          <span className="inline-flex items-center gap-1.5">
            {account.id}
            <CopyButton value={account.id} />
          </span>
        </DetailRow>
        <DetailRow label={t("accountCreated")}>{new Date(account.created_at).toLocaleString()}</DetailRow>
        <DetailRow label={t("columnProxy")} mono>
          {account.assigned_proxy_id ? `#${account.assigned_proxy_id}` : t("autoAssignProxyOption")}
        </DetailRow>
        <DetailRow label="Enabled">{account.enabled ? t("enabled") : t("accountFilterDisabled")}</DetailRow>
      </DetailSection>
    </DetailDrawer>
  );
}
