"use client";

import { CommentOutlined, HeartOutlined, LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Empty, Table } from "antd";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import PlatformBadge from "@/components/PlatformBadge";
import PlatformFilter, { ALL_PLATFORM_QUERY } from "@/components/PlatformFilter";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import { useMdUp } from "@/hooks/useMdUp";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { useAllComments } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS, COMMENTS_PAGE_SIZE } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { CommentWithPost } from "@/lib/types";

const COMMENTS_QUERY = { platform: ALL_PLATFORM_QUERY, page: "1" };

export default function CommentsReview() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const [query, setQuery] = useQueryRecord(COMMENTS_QUERY);
  const platform = query.platform === ALL_PLATFORM_QUERY ? undefined : query.platform;
  const page = Math.max(0, (Number(query.page) || 1) - 1);
  const { data, isLoading, isPlaceholderData } = useAllComments(page, platform);

  return (
    <DashboardCard
      className="animate-fade-in-up"
      title={<CardHeading icon={<CommentOutlined />} title={t("recentlyCollectedComments")} />}
      extra={
        <PlatformFilter
          value={query.platform}
          platforms={COMMENT_SUPPORTED_PLATFORMS}
          onChange={(next) => setQuery({ platform: next, page: "1" })}
        />
      }
    >
      {mdUp ? (
      isLoading && !data ? (
        <TableRowsSkeleton rows={8} />
      ) : (
      <Table<CommentWithPost>
        size="middle"
        rowKey="id"
        loading={isPlaceholderData}
        dataSource={data?.items ?? []}
        locale={{ emptyText: <Empty description={t("noCommentsYet")} /> }}
        pagination={{
          current: page + 1,
          pageSize: COMMENTS_PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: (nextPage) => setQuery({ page: String(nextPage) }),
          showTotal: (total) => t("commentsTotal", { n: total.toLocaleString() }),
          showSizeChanger: false,
          hideOnSinglePage: false,
          responsive: true,
        }}
        columns={[
          {
            title: t("platform"),
            dataIndex: "platform",
            width: 120,
            render: (p: string) => <PlatformBadge platform={p} size={22} showLabel={false} />,
          },
          {
            title: t("columnContent"),
            dataIndex: "message",
            render: (v: string | null, record: CommentWithPost) => (
              <div className="cell-stack max-w-[360px]">
                {record.parent_external_id && (
                  <div className="cell-secondary line-clamp-1">
                    {record.parent_author_name || record.parent_message
                      ? t("inReplyTo", {
                          author: record.parent_author_name || "—",
                          text: record.parent_message || "",
                        })
                      : t("inReplyToUnknown")}
                  </div>
                )}
                <span className="cell-primary line-clamp-3">{v || "—"}</span>
              </div>
            ),
          },
          {
            title: t("columnAuthor"),
            dataIndex: "author_name",
            width: 140,
            render: (v: string | null) => <span className="cell-primary truncate">{v || "—"}</span>,
          },
          {
            title: t("columnOnPost"),
            key: "post",
            width: 240,
            render: (_: unknown, record: CommentWithPost) => (
              <div className="flex min-w-0 items-start gap-2">
                <div className="cell-stack min-w-0 flex-1">
                  <span className="cell-secondary truncate">
                    {record.movie_title || "—"}
                    {record.post_author ? ` · ${record.post_author}` : ""}
                  </span>
                  <span className="cell-primary line-clamp-2">{record.post_content || "—"}</span>
                </div>
                {record.post_url && (
                  <a
                    href={record.post_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 flex shrink-0 items-center text-[var(--accent)]"
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
            width: 120,
            render: (_: unknown, record: CommentWithPost) => (
              <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, auto))" }}>
                <span className="metric-item">
                  <HeartOutlined />
                  {record.reactions_count.toLocaleString()}
                </span>
                <span className="metric-item">
                  <MessageOutlined />
                  {record.replies_count.toLocaleString()}
                </span>
              </div>
            ),
          },
          {
            title: t("columnScraped"),
            dataIndex: "scraped_at",
            width: 120,
            render: (v: string) => <span className="cell-meta">{formatRelativeTime(v, t)}</span>,
          },
        ]}
      />
      )
      ) : (
          <ItemCardList
            items={data?.items ?? []}
            loading={isLoading || isPlaceholderData}
            empty={<Empty description={t("noCommentsYet")} />}
            rowKey={(c) => c.id}
            pagination={{
              current: page + 1,
              pageSize: COMMENTS_PAGE_SIZE,
              total: data?.total ?? 0,
              onChange: (nextPage) => setQuery({ page: String(nextPage) }),
              showTotal: (total) => t("commentsTotal", { n: total.toLocaleString() }),
            }}
          >
            {(record) => (
              <ItemCard>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <PlatformBadge platform={record.platform} size={22} showLabel={false} />
                  <span className="text-xs text-[var(--muted)]">{formatRelativeTime(record.scraped_at, t)}</span>
                </div>
                <p className="mb-2 line-clamp-3 text-sm">{record.message || "—"}</p>
                {record.parent_external_id && (
                  <p className="mb-2 line-clamp-2 text-xs text-[var(--muted)]">
                    {record.parent_author_name || record.parent_message
                      ? t("inReplyTo", {
                          author: record.parent_author_name || "—",
                          text: record.parent_message || "",
                        })
                      : t("inReplyToUnknown")}
                  </p>
                )}
                <ItemField label={t("columnAuthor")}>{record.author_name || "—"}</ItemField>
                <ItemField label={t("columnOnPost")}>
                  <div>
                    <div className="text-xs text-[var(--muted)]">
                      {record.movie_title || "—"}
                      {record.post_author ? ` · ${record.post_author}` : ""}
                    </div>
                    <div className="line-clamp-2">{record.post_content || "—"}</div>
                  </div>
                </ItemField>
                <ItemField label={t("columnEngagement")}>
                  <div className="flex justify-end gap-2 text-xs text-[var(--muted)]">
                    <span>
                      <HeartOutlined /> {record.reactions_count.toLocaleString()}
                    </span>
                    <span>
                      <MessageOutlined /> {record.replies_count.toLocaleString()}
                    </span>
                  </div>
                </ItemField>
              </ItemCard>
            )}
          </ItemCardList>
      )}
    </DashboardCard>
  );
}
