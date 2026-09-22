"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ImportOutlined,
  KeyOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, App, Button, Input, Select } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import CrawlTriggerForm from "@/components/platform/CrawlTriggerForm";
import ChannelVideosForm from "@/components/platform/ChannelVideosForm";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useRefreshTokenStream } from "@/hooks/useRefreshTokenStream";
import { useAccountMutations, useAccounts } from "@/hooks/useSettings";
import { useTokenStatus } from "@/hooks/useTokenStatus";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PLATFORMS_WITH_TOKEN_REFRESH, QUERY_KEYS } from "@/lib/constants";
import { platformLabel } from "@/lib/platform";

function formatTtl(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PlatformActions({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const hasTokenRefresh = (PLATFORMS_WITH_TOKEN_REFRESH as readonly string[]).includes(platform);
  const isTiktok = platform === "tiktok";
  const { importCookies, restoreSession, stopCrawl } = useTriggerCrawl(platform);
  const { data: jobStatus } = useJobStatus(platform);
  const { data: tokenStatus, isLoading: tokenLoading } = useTokenStatus(platform, hasTokenRefresh);

  const stream = useRefreshTokenStream(platform, hasTokenRefresh);
  const isRefreshing = stream.status === "running";
  const canCancelRefresh = jobStatus?.running && jobStatus.type === "refresh_token";

  const { data: accounts } = useAccounts();
  const { totpCode } = useAccountMutations();

  // Session restore/import only offers accounts the pool can still use.
  const platformAccounts = (accounts ?? []).filter((a) => a.platform === platform && a.enabled);
  const [importAccountId, setImportAccountId] = useState<number | undefined>(undefined);
  const [cookiesText, setCookiesText] = useState("");

  useEffect(() => {
    if (platformAccounts.length === 0) {
      if (importAccountId !== undefined) setImportAccountId(undefined);
      return;
    }
    const stillThere = importAccountId !== undefined && platformAccounts.some((a) => a.id === importAccountId);
    if (stillThere) return;
    const expired = tokenStatus?.account;
    const match = expired
      ? platformAccounts.find((a) => a.account_id === expired || a.email === expired)
      : undefined;
    setImportAccountId((match ?? platformAccounts[0]).id);
  }, [importAccountId, platformAccounts, tokenStatus?.account]);

  // After a refresh finishes, re-check token + accounts (TikTok identity
  // lands in platform_accounts, not Redis session_cache).
  useEffect(() => {
    if (stream.status !== "success" && stream.status !== "failed") return;
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tokenStatus(platform) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settingsAccounts });
  }, [stream.status, platform, queryClient]);

  const tokenValid = Boolean(tokenStatus?.valid);
  const needsRepair = !tokenLoading && tokenStatus != null && !tokenValid;

  const accountLabel = tokenStatus?.account
    ? t("accountLabel", { account: tokenStatus.account })
    : undefined;
  const validDescription =
    tokenStatus?.account != null
      ? `${t("accountLabel", { account: tokenStatus.account })}${
          !isTiktok && tokenStatus.expires_in_seconds != null
            ? t("expiresIn", { ttl: formatTtl(tokenStatus.expires_in_seconds) })
            : ""
        }`
      : undefined;

  // One status only — never show "refreshed" beside "needs new token".
  let statusNode: ReactNode = null;
  if (tokenLoading && !tokenStatus) {
    statusNode = <div className="skel-block h-12 w-full rounded-xl" />;
  } else if (isRefreshing) {
    statusNode = (
      <Alert
        type="info"
        showIcon
        icon={<LoadingOutlined spin />}
        className="!mb-0"
        message={t("refreshingEllipsis")}
        description={accountLabel}
        action={
          canCancelRefresh ? (
            <Button size="small" danger icon={<StopOutlined />} onClick={() => stopCrawl.mutate()}>
              {t("cancelRefreshToken")}
            </Button>
          ) : undefined
        }
      />
    );
  } else if (stream.status === "failed") {
    statusNode = (
      <Alert
        type="error"
        showIcon
        icon={<CloseCircleOutlined />}
        className="crawl-alert-error !mb-0"
        message={t("refreshFailed")}
        description={t("sessionRefreshFailedHint")}
      />
    );
  } else if (stream.status === "success" && needsRepair) {
    statusNode = (
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        className="crawl-alert-warning !mb-0"
        message={t("sessionRefreshStillInvalid", { platform: platformLabel(platform) })}
        description={
          accountLabel ? (
            <span>
              {accountLabel}
              <span className="mt-1 block">{t("sessionRefreshStillInvalidHint")}</span>
            </span>
          ) : (
            t("sessionRefreshStillInvalidHint")
          )
        }
      />
    );
  } else if (needsRepair) {
    statusNode = (
      <Alert
        type="error"
        showIcon
        className="crawl-alert-error !mb-0"
        message={t(isTiktok ? "sessionExpiredTikTok" : "sessionExpired", { platform: platformLabel(platform) })}
        description={accountLabel}
      />
    );
  } else if (tokenValid) {
    statusNode = (
      <Alert
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        className="!mb-0"
        message={t(isTiktok ? "sessionValidTikTok" : "sessionValid", { platform: platformLabel(platform) })}
        description={validDescription}
      />
    );
  }

  return (
    <div className={`grid items-stretch gap-4 ${hasTokenRefresh ? "lg:grid-cols-2" : ""}`}>
      <div className="flex flex-col gap-4">
        {/* h-full only when this is the column's only card (matches the
            token-refresh column's height) - with ChannelVideosForm also
            stacked below it (TikTok), height:100% on this first card
            fights its sibling for the items-stretch'd column's height,
            and DashboardCard's own overflow:hidden then clips the
            sibling's bottom content (its Max pages field + Run button -
            confirmed happening for real on the TikTok actions page). */}
        <DashboardCard
          className={isTiktok ? "" : "h-full"}
          title={<CardHeading icon={<PlayCircleOutlined />} title={t("runACrawl")} />}
        >
          <CrawlTriggerForm platform={platform} />
        </DashboardCard>
        {isTiktok && (
          <DashboardCard title={<CardHeading icon={<PlayCircleOutlined />} title={t("channelVideosTitle")} />}>
            <ChannelVideosForm />
          </DashboardCard>
        )}
      </div>

      {hasTokenRefresh && (
        <DashboardCard className="h-full" title={<CardHeading icon={<KeyOutlined />} title={t("token")} />}>
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {statusNode}

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold tracking-wide text-[var(--muted)]">
                {t("importCookiesAccountPlaceholder")}
              </span>
              <Select
                className="w-full"
                size="large"
                placeholder={t("importCookiesAccountPlaceholder")}
                value={importAccountId}
                onChange={setImportAccountId}
                notFoundContent={t("noEnabledAccountsForPlatform")}
                options={platformAccounts.map((a) => ({
                  value: a.id,
                  label: a.email ? `${a.account_id} (${a.email})` : a.account_id,
                }))}
              />
            </div>

            <div className="inset-panel flex flex-col gap-3 p-4">
              <div>
                <div className="text-[13px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  1 · {t("restoreSavedSessionAction")}
                </div>
                <p className="mt-1 mb-0 text-sm leading-relaxed text-[var(--muted)]">
                  {t(isTiktok ? "restoreSavedSessionDescTikTok" : "restoreSavedSessionDesc")}
                </p>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                disabled={importAccountId === undefined || isRefreshing}
                loading={restoreSession.isPending}
                onClick={() => importAccountId !== undefined && restoreSession.mutate(importAccountId)}
              >
                {t("restoreSavedSessionAction")}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[var(--line)] p-4">
              <div>
                <div className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  2 · {t("importCookiesTitle")}
                </div>
                <p className="mt-1 mb-0 text-sm leading-relaxed text-[var(--muted)]">
                  {t(isTiktok ? "importCookiesDescTikTok" : "importCookiesDesc")}
                </p>
              </div>
              {!isTiktok && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    icon={<KeyOutlined />}
                    disabled={importAccountId === undefined}
                    loading={totpCode.isPending}
                    onClick={() =>
                      importAccountId !== undefined &&
                      totpCode.mutate(importAccountId, {
                        onError: () => message.error(t("toastTotpCodeFailed")),
                      })
                    }
                  >
                    {t("get2faCodeAction")}
                  </Button>
                  {totpCode.data && (
                    <span className="rounded-lg bg-[var(--paper-deep)] px-2.5 py-1 font-mono text-sm tabular-nums">
                      {totpCode.data.code} · {t("totpCodeExpiresIn", { n: totpCode.data.expires_in_seconds })}
                    </span>
                  )}
                </div>
              )}
              <Input.TextArea
                rows={4}
                className="font-mono text-xs"
                placeholder={t(isTiktok ? "importCookiesPlaceholderTikTok" : "importCookiesPlaceholder")}
                value={cookiesText}
                onChange={(e) => setCookiesText(e.target.value)}
              />
              <Button
                icon={<ImportOutlined />}
                disabled={importAccountId === undefined || !cookiesText.trim() || isRefreshing}
                loading={importCookies.isPending}
                onClick={() => {
                  importCookies.mutate(
                    { accountId: importAccountId as number, cookies: cookiesText.trim() },
                    { onSuccess: () => setCookiesText("") },
                  );
                }}
              >
                {t("importCookiesAction")}
              </Button>
            </div>
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
