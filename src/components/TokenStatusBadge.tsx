"use client";

import { CheckCircleFilled, RobotOutlined } from "@ant-design/icons";
import { Alert, Space, Tag, Typography } from "antd";
import { SkelBlock } from "@/components/PageSkeleton";
import { useAccounts } from "@/hooks/useSettings";
import { useTokenStatus } from "@/hooks/useTokenStatus";
import { useTranslation } from "@/i18n/LocaleProvider";
import { platformLabel } from "@/lib/platform";

function formatTtl(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function TokenStatusBadge({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useTokenStatus(platform);
  // Same accounts list AccountsTable already fetches/caches (react-query
  // dedups this, no extra request) - just to pull one account's own
  // last_check_note, the AI diagnosis spider-hub generates the moment it
  // hard-disables an account (see services/kira.diagnose_account_failure).
  // Surfacing it right here, next to the exact "session expired" signal
  // someone's debugging a failed refresh from, saves a trip to the
  // Accounts tab to find the same information.
  const { data: accounts } = useAccounts();
  const matchedAccount = accounts?.find(
    (a) => a.platform === platform && (a.account_id === data?.account || a.email === data?.account),
  );

  if (isLoading || !data) return <SkelBlock className="h-8 w-40 rounded-lg" />;

  if (!data.valid) {
    return (
      <Alert
        type="error"
        showIcon
        className="crawl-alert-error !mb-0"
        message={t("sessionExpired", { platform: platformLabel(platform) })}
        description={
          <div className="flex flex-col gap-1">
            {data.account && <span>{t("accountLabel", { account: data.account })}</span>}
            <span className="text-xs">{t("sessionExpiredHint")}</span>
            {matchedAccount?.last_check_note && (
              <span className="flex items-start gap-1">
                <RobotOutlined className="mt-0.5 shrink-0" />
                {matchedAccount.last_check_note}
              </span>
            )}
          </div>
        }
      />
    );
  }

  return (
    <Space size="small">
      <Tag icon={<CheckCircleFilled />} color="success">
        {t("sessionValid", { platform: platformLabel(platform) })}
      </Tag>
      {data.account && (
        <Typography.Text type="secondary" className="text-xs">
          {t("accountLabel", { account: data.account })}
          {data.expires_in_seconds != null ? t("expiresIn", { ttl: formatTtl(data.expires_in_seconds) }) : ""}
        </Typography.Text>
      )}
    </Space>
  );
}
