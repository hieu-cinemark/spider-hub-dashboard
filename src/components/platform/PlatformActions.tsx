"use client";

import { CheckCircleOutlined, CloseCircleOutlined, KeyOutlined, LoadingOutlined, PlayCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tag } from "antd";
import CrawlTriggerForm from "@/components/platform/CrawlTriggerForm";
import RefreshLogPanel from "@/components/RefreshLogPanel";
import TokenStatusBadge from "@/components/TokenStatusBadge";
import { useRefreshTokenStream } from "@/hooks/useRefreshTokenStream";
import { useTriggerCrawl } from "@/hooks/useTriggerCrawl";
import { PLATFORMS_WITH_TOKEN_REFRESH } from "@/lib/constants";

export default function PlatformActions({ platform }: { platform: string }) {
  const hasTokenRefresh = (PLATFORMS_WITH_TOKEN_REFRESH as readonly string[]).includes(platform);
  const { refreshToken } = useTriggerCrawl(platform);

  const stream = useRefreshTokenStream(platform, hasTokenRefresh);
  const isRefreshing = stream.status === "running";

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={
          <span>
            <PlayCircleOutlined className="mr-2" />
            Run a crawl
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
              Token
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
                Refresh token
              </Button>
              <TokenStatusBadge platform={platform} />
              {stream.status === "running" && (
                <Tag icon={<LoadingOutlined spin />} color="processing">
                  refreshing…
                </Tag>
              )}
              {stream.status === "success" && (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  refreshed
                </Tag>
              )}
              {stream.status === "failed" && (
                <Tag icon={<CloseCircleOutlined />} color="error">
                  refresh failed
                </Tag>
              )}
            </Space>

            {(stream.status === "running" || stream.lines.length > 0) && (
              <RefreshLogPanel lines={stream.lines} status={stream.status} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
