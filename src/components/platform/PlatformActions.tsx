"use client";

import { CheckCircleOutlined, CloseCircleOutlined, KeyOutlined, LoadingOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Select, Space, Tag } from "antd";
import { useState } from "react";
import CrawlTriggerForm from "@/components/platform/CrawlTriggerForm";
import RefreshLogPanel from "@/components/RefreshLogPanel";
import TokenStatusBadge from "@/components/TokenStatusBadge";
import { useJobStatus } from "@/hooks/useJobStatus";
import { useRefreshTokenStream } from "@/hooks/useRefreshTokenStream";
import { useAccountMutations, useAccounts } from "@/hooks/useSettings";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PLATFORMS_WITH_TOKEN_REFRESH } from "@/lib/constants";

export default function PlatformActions({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const hasTokenRefresh = (PLATFORMS_WITH_TOKEN_REFRESH as readonly string[]).includes(platform);
  const { refreshToken, stopCrawl } = useTriggerCrawl(platform);
  const { data: jobStatus } = useJobStatus(platform);

  const stream = useRefreshTokenStream(platform, hasTokenRefresh);
  const isRefreshing = stream.status === "running";
  const canCancelRefresh = jobStatus?.running && jobStatus.type === "refresh_token";

  // TikTok has no single "active" cached session to refresh like
  // Facebook/Threads (see PLATFORMS_WITH_TOKEN_REFRESH) - accounts rotate,
  // so resetting cookies needs to name which platform_accounts row.
  const isTiktok = platform === "tiktok";
  const { data: accounts } = useAccounts();
  const { resetCookies } = useAccountMutations();
  const tiktokAccounts = (accounts ?? []).filter((a) => a.platform === "tiktok");
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={
          <span>
            <PlayCircleOutlined className="mr-2" />
            {t("runACrawl")}
          </span>
        }
      >
        <CrawlTriggerForm platform={platform} />
      </Card>

      {hasTokenRefresh && (
        <Card
          title={
            <span>
              <KeyOutlined className="mr-2" />
              {t("token")}
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            <Space wrap size="middle" align="center">
              <Button
                icon={<SyncOutlined />}
                loading={refreshToken.isPending}
                disabled={isRefreshing}
                onClick={() => refreshToken.mutate()}
              >
                {t("refreshToken")}
              </Button>
              {canCancelRefresh && (
                <Button danger icon={<StopOutlined />} loading={stopCrawl.isPending} onClick={() => stopCrawl.mutate()}>
                  {t("cancelRefreshToken")}
                </Button>
              )}
              <TokenStatusBadge platform={platform} />
              {stream.status === "running" && (
                <Tag icon={<LoadingOutlined spin />} color="processing">
                  {t("refreshingEllipsis")}
                </Tag>
              )}
              {stream.status === "success" && (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  {t("refreshed")}
                </Tag>
              )}
              {stream.status === "failed" && (
                <Tag icon={<CloseCircleOutlined />} color="error">
                  {t("refreshFailed")}
                </Tag>
              )}
            </Space>

            {(stream.status === "running" || stream.lines.length > 0) && (
              <RefreshLogPanel lines={stream.lines} status={stream.status} />
            )}
          </div>
        </Card>
      )}

      {isTiktok && (
        <Card
          title={
            <span>
              <KeyOutlined className="mr-2" />
              {t("resetCookiesAction")}
            </span>
          }
        >
          <Space wrap size="middle" align="center">
            <Select
              allowClear
              placeholder={t("columnAccountId")}
              style={{ minWidth: 220 }}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={tiktokAccounts.map((a) => ({ value: a.id, label: a.account_id }))}
            />
            <Button
              icon={<ReloadOutlined />}
              disabled={selectedAccountId === undefined}
              loading={resetCookies.isPending && resetCookies.variables === selectedAccountId}
              onClick={() => selectedAccountId !== undefined && resetCookies.mutate(selectedAccountId)}
            >
              {t("resetCookiesAction")}
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
