"use client";

import { CommentOutlined, HeartOutlined, LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Empty, Table } from "antd";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import KeywordFilter from "@/components/KeywordFilter";
import PlatformBadge from "@/components/PlatformBadge";
import { UserAvatar } from "@/components/UserAvatar";
import PlatformFilter, { ALL_PLATFORM_QUERY } from "@/components/PlatformFilter";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import { useMdUp } from "@/hooks/useMdUp";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { useAllComments } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS, COMMENTS_PAGE_SIZE } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { CommentWithPost } from "@/lib/types";

const COMMENTS_QUERY = { platform: ALL_PLATFORM_QUERY, page: "1", keyword: "" };

function OnPostQuote({ record }: { record: CommentWithPost }) {
  const { t } = useTranslation();
  const meta = [record.movie_title, record.keyword, record.post_author ? `@${record.post_author}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="on-post-quote">
      <div className="on-post-quote-body">
        <span className="on-post-quote-kicker">{t("commentedOnPost")}</span>
        {meta ? <span className="cell-secondary truncate">{meta}</span> : null}
        <span className="cell-primary line-clamp-2">{record.post_content || "—"}</span>
      </div>
      {record.post_url ? (
        <a
          href={record.post_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex shrink-0 items-center text-[var(--accent)]"
        >
          <LinkOutlined />
        </a>
      ) : null}
    </div>
  );
}

export default function CommentsReview() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const [query, setQuery] = useQueryRecord(COMMENTS_QUERY);
  const platform = query.platform === ALL_PLATFORM_QUERY ? undefined : query.platform;
  const keywordId = query.keyword || undefined;
  const page = Math.max(0, (Number(query.page) || 1) - 1);
  const { data, isLoading, isPlaceholderData } = useAllComments(page, platform, keywordId);

  return (
    <DashboardCard
      className="animate-fade-in-up"
      title={<CardHeading icon={<CommentOutlined />} title={t("recentlyCollectedComments")} />}
      extra={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <KeywordFilter
            platform={platform}
            value={keywordId}
            onChange={(next) => setQuery({ keyword: next ?? "", page: "1" })}
          />
          <PlatformFilter
            value={query.platform}
            platforms={COMMENT_SUPPORTED_PLATFORMS}
            onChange={(next) => setQuery({ platform: next, page: "1", keyword: "" })}
          />
        </div>
      }
    >
      {mdUp ? (
      isLoading && !data ? (
        <TableRowsSkeleton rows={8} />
      ) : (
      <Table<CommentWithPost>
        className="data-table"
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
            title: t("columnContent"),
            dataIndex: "message",
            render: (v: string | null, record: CommentWithPost) => (
              <div className="flex min-w-0 items-start gap-3">
                <UserAvatar src={record.author_profile_picture} name={record.author_name} size={36} />
                <div className="cell-stack min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="cell-primary truncate">{record.author_name || "—"}</span>
                    <PlatformBadge platform={record.platform} size={20} showLabel={false} />
                  </div>
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
                  <span className="cell-primary line-clamp-3 font-normal">{v || "—"}</span>
                </div>
              </div>
            ),
          },
          {
            title: t("columnOnPost"),
            key: "post",
            width: 320,
            render: (_: unknown, record: CommentWithPost) => <OnPostQuote record={record} />,
          },
          {
            title: t("columnEngagement"),
            key: "engagement",
            width: 140,
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
                <OnPostQuote record={record} />
                <div className="mt-3 flex items-start gap-3">
                  <UserAvatar src={record.author_profile_picture} name={record.author_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="cell-primary truncate">{record.author_name || "—"}</span>
                        <PlatformBadge platform={record.platform} size={20} showLabel={false} />
                      </div>
                      <span className="text-xs text-[var(--muted)]">{formatRelativeTime(record.scraped_at, t)}</span>
                    </div>
                    {record.parent_external_id && (
                      <p className="mb-1 line-clamp-2 text-xs text-[var(--muted)]">
                        {record.parent_author_name || record.parent_message
                          ? t("inReplyTo", {
                              author: record.parent_author_name || "—",
                              text: record.parent_message || "",
                            })
                          : t("inReplyToUnknown")}
                      </p>
                    )}
                    <p className="mb-0 line-clamp-3 text-sm">{record.message || "—"}</p>
                  </div>
                </div>
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
