"use client";

import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Skeleton, Space, Tag, Typography } from "antd";
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

  if (isLoading || !data) return <Skeleton.Button active size="small" />;

  return (
    <Space size="small">
      <Tag icon={data.valid ? <CheckCircleFilled /> : <CloseCircleFilled />} color={data.valid ? "success" : "error"}>
        {t(data.valid ? "sessionValid" : "sessionExpired", { platform: platformLabel(platform) })}
      </Tag>
      {data.account && (
        <Typography.Text type="secondary" className="text-xs">
          {t("accountLabel", { account: data.account })}
          {data.valid && data.expires_in_seconds != null ? t("expiresIn", { ttl: formatTtl(data.expires_in_seconds) }) : ""}
        </Typography.Text>
      )}
    </Space>
  );
}
