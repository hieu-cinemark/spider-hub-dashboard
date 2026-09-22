"use client";

import { LinkOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Checkbox, Empty, Table, Typography } from "antd";
import { type Key, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import EngagementMetrics from "@/components/EngagementMetrics";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
import KeywordFilter from "@/components/KeywordFilter";
import SharedPostCard from "@/components/SharedPostCard";
import PlatformBadge from "@/components/PlatformBadge";
import { PostMediaThumb, UserAvatar } from "@/components/UserAvatar";
import PlatformFilter, { ALL_PLATFORM_QUERY } from "@/components/PlatformFilter";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import { useMdUp } from "@/hooks/useMdUp";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { usePosts, useRunCommentsBulk } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS, POSTS_PAGE_SIZE, TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";
import PostDetailModal from "./PostDetailModal";

const POSTS_QUERY = { platform: ALL_PLATFORM_QUERY, page: "1", keyword: "" };

export default function PostsReview() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const [query, setQuery] = useQueryRecord(POSTS_QUERY);
  const platform = query.platform === ALL_PLATFORM_QUERY ? undefined : query.platform;
  const keywordId = query.keyword || undefined;
  const page = Math.max(0, (Number(query.page) || 1) - 1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading, isPlaceholderData } = usePosts(platform, page, keywordId);
  const runCommentsBulk = useRunCommentsBulk();

  function goToPage(nextPage: number) {
    setSelectedRowKeys([]);
    setQuery({ page: String(nextPage + 1) });
  }

  return (
    <DashboardCard
      className="animate-fade-in-up"
      title={<CardHeading icon={<UnorderedListOutlined />} title={t("recentlyScrapedPosts")} />}
      extra={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <KeywordFilter
            platform={platform}
            value={keywordId}
            onChange={(next) => {
              setSelectedRowKeys([]);
              setQuery({ keyword: next ?? "", page: "1" });
            }}
          />
          <PlatformFilter
            value={query.platform}
            platforms={TRIGGERABLE_PLATFORMS}
            onChange={(next) => {
              setSelectedRowKeys([]);
              setQuery({ platform: next, page: "1", keyword: "" });
            }}
          />
        </div>
      }
    >
      {selectedRowKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] px-4 py-3">
          <Typography.Text className="text-sm text-[var(--ink-soft)]">{t("selectPostsCommentsHint")}</Typography.Text>
          <Button
            type="primary"
            loading={runCommentsBulk.isPending}
            onClick={() => {
              const byId = new Map((data?.items ?? []).map((p) => [p.id, p]));
              const posts = selectedRowKeys
                .map((key) => byId.get(String(key)))
                .filter((p): p is Post => p !== undefined)
                .map((p) => ({ platform: p.platform, postId: p.id }));
              runCommentsBulk.mutate(posts);
              setSelectedRowKeys([]);
            }}
          >
            {t("fetchCommentsSelected", { n: String(selectedRowKeys.length) })}
          </Button>
        </div>
      )}
      {mdUp ? (
      isLoading && !data ? (
        <TableRowsSkeleton rows={8} />
      ) : (
      <Table<Post>
        className="data-table data-table-roomy"
        size="middle"
        rowKey="id"
        loading={isPlaceholderData}
        dataSource={data?.items ?? []}
        locale={{ emptyText: <Empty description={t("noPostsYet")} /> }}
        onRow={(record) => ({ onClick: () => setSelectedPost(record), className: "cursor-pointer" })}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record: Post) => ({
            disabled: !(COMMENT_SUPPORTED_PLATFORMS as readonly string[]).includes(record.platform),
          }),
        }}
        pagination={{
          current: page + 1,
          pageSize: POSTS_PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: (nextPage) => goToPage(nextPage - 1),
          showTotal: (total) => t("postsTotal", { n: total.toLocaleString() }),
          showSizeChanger: false,
          hideOnSinglePage: false,
          responsive: true,
        }}
        columns={[
          {
            title: t("platform"),
            dataIndex: "platform",
            width: 132,
            render: (p: string) => <PlatformBadge platform={p} size={22} />,
          },
          {
            title: t("columnContent"),
            dataIndex: "content",
            render: (v: string | null, record: Post) => (
              <div className="flex min-w-0 items-start gap-3.5">
                <PostMediaThumb mediaUrl={record.media_url} mediaType={record.media_type} alt={record.content} size={96} />
                <div className="cell-stack min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start gap-2">
                    <span className="cell-primary line-clamp-4">{v || "—"}</span>
                    {record.url && (
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 flex shrink-0 items-center text-[var(--accent)]"
                      >
                        <LinkOutlined />
                      </a>
                    )}
                  </div>
                  <SharedPostCard quoted={record.quoted} />
                </div>
              </div>
            ),
          },
          {
            title: t("columnMovieKeyword"),
            key: "movie",
            width: 180,
            render: (_: unknown, record: Post) => (
              <div className="cell-stack">
                <span className="cell-primary truncate">{record.movie_title ?? "—"}</span>
                {record.keyword ? <span className="cell-secondary truncate">{record.keyword}</span> : null}
              </div>
            ),
          },
          {
            title: t("columnAuthor"),
            dataIndex: "author",
            width: 168,
            render: (v: string | null) => (
              <div className="flex min-w-0 items-center gap-2">
                <UserAvatar name={v} size={28} />
                <span className="cell-primary truncate">{v || "—"}</span>
              </div>
            ),
          },
          {
            title: t("columnEngagement"),
            key: "engagement",
            width: 210,
            render: (_: unknown, record: Post) => (
              <EngagementMetrics likes={record.like_count} replies={record.reply_count} reposts={record.repost_count} />
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
            empty={<Empty description={t("noPostsYet")} />}
            rowKey={(p) => p.id}
            pagination={{
              current: page + 1,
              pageSize: POSTS_PAGE_SIZE,
              total: data?.total ?? 0,
              onChange: (nextPage) => goToPage(nextPage - 1),
              showTotal: (total) => t("postsTotal", { n: total.toLocaleString() }),
            }}
          >
            {(record) => {
              const canSelect = (COMMENT_SUPPORTED_PLATFORMS as readonly string[]).includes(record.platform);
              const selected = selectedRowKeys.includes(record.id);
              return (
                <ItemCard onClick={() => setSelectedPost(record)}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {canSelect && (
                        <Checkbox
                          checked={selected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setSelectedRowKeys((keys) =>
                              e.target.checked ? [...keys, record.id] : keys.filter((k) => k !== record.id),
                            );
                          }}
                        />
                      )}
                      <PlatformBadge platform={record.platform} size={22} showLabel={false} />
                    </div>
                    <span className="text-xs text-[var(--muted)]">{formatRelativeTime(record.scraped_at, t)}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <PostMediaThumb mediaUrl={record.media_url} mediaType={record.media_type} alt={record.content} size={88} />
                    <p className="cell-primary mb-0 line-clamp-4 min-w-0 flex-1">{record.content || "—"}</p>
                  </div>
                  <SharedPostCard quoted={record.quoted} />
                  <ItemField label={t("columnAuthor")}>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={record.author} size={24} />
                      <span>{record.author || "—"}</span>
                    </div>
                  </ItemField>
                  <ItemField label={t("columnMovieKeyword")}>
                    <div className="cell-stack">
                      <span>{record.movie_title || "—"}</span>
                      {record.keyword ? <span className="cell-secondary">{record.keyword}</span> : null}
                    </div>
                  </ItemField>
                  <ItemField label={t("columnEngagement")}>
                    <EngagementMetrics likes={record.like_count} replies={record.reply_count} reposts={record.repost_count} />
                  </ItemField>
                </ItemCard>
              );
            }}
          </ItemCardList>
      )}
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </DashboardCard>
  );
}
