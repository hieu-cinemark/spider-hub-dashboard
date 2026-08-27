"use client";

import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Skeleton, Space, Tag, Typography } from "antd";
import { useTokenStatus } from "@/hooks/useTokenStatus";
import { platformLabel } from "@/lib/platform";

function formatTtl(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function TokenStatusBadge({ platform }: { platform: string }) {
  const { data, isLoading } = useTokenStatus(platform);

  if (isLoading || !data) return <Skeleton.Button active size="small" />;

  return (
    <Space size="small">
      <Tag
        icon={data.valid ? <CheckCircleFilled /> : <CloseCircleFilled />}
        color={data.valid ? "success" : "error"}
      >
        {platformLabel(platform)} session {data.valid ? "valid" : "expired"}
      </Tag>
      {data.account && (
        <Typography.Text type="secondary" className="text-xs">
          account: {data.account}
          {data.valid && data.expires_in_seconds != null ? ` · expires in ${formatTtl(data.expires_in_seconds)}` : ""}
        </Typography.Text>
      )}
    </Space>
  );
}
