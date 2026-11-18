"use client";

import DetailDrawer from "@/components/ui/DetailDrawer";
import { DetailRow, DetailSection } from "@/components/ui/CopyableValue";
import CopyButton from "@/components/ui/CopyButton";
import StatusBadge, { toneFromTagColor } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/i18n/LocaleProvider";
import { poolStatusInfo } from "@/lib/poolStatus";
import { formatRelativeTime } from "@/lib/format";
import type { Proxy } from "@/lib/types";

/**
 * The full proxy record.
 *
 * The proxy address is the only identifying thing about a proxy, and it is
 * long - credentials included. The table shows a shortened host:port with the
 * full address one hover away; everything technical (the row id, the vendor
 * key and reference, the circuit-breaker state) lives here.
 */
export default function ProxyDetailDrawer({
  proxy,
  onClose,
}: {
  proxy: Proxy | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!proxy) return null;

  const pool = poolStatusInfo("proxy", proxy.pool_status, proxy.cooldown_until, proxy.enabled);

  return (
    <DetailDrawer
      open
      onClose={onClose}
      width={520}
      title={proxy.proxy_url}
      subtitle={proxy.platform}
    >
      <DetailSection title={t("columnProxy")}>
        <DetailRow label={t("columnProxy")} mono>
          <span className="inline-flex items-center gap-1.5">
            {proxy.proxy_url}
            <CopyButton value={proxy.proxy_url} />
          </span>
        </DetailRow>
        <DetailRow label={t("platform")}>{proxy.platform}</DetailRow>
        <DetailRow label={t("columnIpType")}>{proxy.ip_type}</DetailRow>
        <DetailRow label={t("columnAuth")} mono>
          {proxy.username || "—"}
          {proxy.password ? ` · ${proxy.password}` : ""}
        </DetailRow>
      </DetailSection>

      <DetailSection title={t("columnPoolStatus")}>
        <DetailRow label={t("columnPoolStatus")}>
          <StatusBadge tone={toneFromTagColor(pool.tagColor)}>{t(pool.labelKey)}</StatusBadge>
        </DetailRow>
        <DetailRow label={t("columnLastUsed")}>
          {proxy.last_used_at ? formatRelativeTime(proxy.last_used_at, t) : "—"}
        </DetailRow>
        <DetailRow label={t("accountCooldownUntil")}>
          {proxy.cooldown_until ? new Date(proxy.cooldown_until).toLocaleString() : "—"}
        </DetailRow>
        <DetailRow label={t("accountConsecutiveFailures")}>{proxy.consecutive_failures ?? 0}</DetailRow>
      </DetailSection>

      <DetailSection title={t("proxyProviderSource")}>
        <DetailRow label={t("proxyProviderSource")} mono>
          {proxy.provider_key || "—"}
        </DetailRow>
        <DetailRow label="Ref" mono>
          {proxy.provider_ref || "—"}
        </DetailRow>
        <DetailRow label={t("columnLastUsed")}>
          {proxy.provider_last_used_at ? formatRelativeTime(proxy.provider_last_used_at, t) : "—"}
        </DetailRow>
        <DetailRow label="Status">{proxy.provider_last_status || "—"}</DetailRow>
      </DetailSection>

      <DetailSection title={t("accountTechnicalSection")}>
        <DetailRow label={t("accountRecordId")} mono>
          <span className="inline-flex items-center gap-1.5">
            {proxy.id}
            <CopyButton value={proxy.id} />
          </span>
        </DetailRow>
        <DetailRow label={t("accountCreated")}>{new Date(proxy.created_at).toLocaleString()}</DetailRow>
        <DetailRow label={t("columnUseForLogin")}>{proxy.login_use_proxy ? t("enabled") : t("accountFilterDisabled")}</DetailRow>
        <DetailRow label={t("enabled")}>{proxy.enabled ? t("enabled") : t("accountFilterDisabled")}</DetailRow>
      </DetailSection>
    </DetailDrawer>
  );
}
