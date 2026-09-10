"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Empty, Table, Typography } from "antd";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useAllComments } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { CommentWithPost } from "@/lib/types";

export default function CommentsReview() {
  const { t } = useTranslation();
  const [pageParam, setPageParam] = useQueryParam("page", "1");
  const page = Math.max(0, (Number(pageParam) || 1) - 1);
  const setPage = (nextPage: number) => setPageParam(String(nextPage + 1));
  const { data, isLoading, isPlaceholderData } = useAllComments(page);

  return (
    <DashboardCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={5} className="!mb-0">
          {t("recentlyCollectedComments")}
        </Typography.Title>
      </div>
      <Table<CommentWithPost>
        size="small"
        rowKey="id"
        scroll={{ x: "max-content" }}
        loading={isLoading || isPlaceholderData}
        dataSource={data?.items ?? []}
        locale={{ emptyText: <Empty description={t("noCommentsYet")} /> }}
        pagination={{
          current: page + 1,
          pageSize: COMMENTS_PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: (nextPage) => setPage(nextPage - 1),
          showTotal: (total) => t("commentsTotal", { n: total.toLocaleString() }),
          responsive: true,
        }}
        columns={[
          {
            title: t("platform"),
            dataIndex: "platform",
            width: 100,
            render: (p: string) => <PlatformBadge platform={p} size={24} />,
          },
          {
            title: t("columnAuthor"),
            dataIndex: "author_name",
            width: 160,
            render: (v: string | null) => v || "—",
          },
          {
            title: t("columnContent"),
            dataIndex: "message",
            width: 320,
            render: (v: string | null) => <span className="line-clamp-2 text-sm">{v || "—"}</span>,
          },
          {
            title: t("columnOnPost"),
            key: "post",
            width: 280,
            render: (_: unknown, record: CommentWithPost) => (
              <div className="flex items-center gap-2">
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-xs text-[#8c8c8c]">
                    {record.movie_title ?? <Typography.Text type="secondary">—</Typography.Text>}
                    {record.post_author ? ` · ${record.post_author}` : ""}
                  </span>
                  <span className="line-clamp-1 text-sm">{record.post_content || "—"}</span>
                </div>
                {record.post_url && (
                  <a
                    href={record.post_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex shrink-0 items-center"
                  >
                    <LinkOutlined />
                  </a>
                )}
              </div>
            ),
          },
          {
            title: t("columnEngagement"),
            key: "engagement",
            width: 130,
            render: (_: unknown, record: CommentWithPost) => (
              <div className="flex gap-2 text-xs text-[#8c8c8c]">
                <span>
                  <HeartOutlined /> {record.reactions_count.toLocaleString()}
                </span>
                <span>
                  <MessageOutlined /> {record.replies_count.toLocaleString()}
                </span>
              </div>
            ),
          },
          {
            title: t("columnScraped"),
            dataIndex: "scraped_at",
            width: 110,
            render: (v: string) => formatRelativeTime(v, t),
          },
        ]}
      />
    </DashboardCard>
  );
}
