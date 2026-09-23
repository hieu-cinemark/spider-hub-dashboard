"use client";

import { LinkOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Checkbox, Empty, Tabs, Typography } from "antd";
import { type Key, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import EngagementMetrics from "@/components/EngagementMetrics";
import KeywordFilter from "@/components/KeywordFilter";
import SharedPostCard from "@/components/SharedPostCard";
import PlatformBadge from "@/components/PlatformBadge";
import { PostGridSkeleton } from "@/components/PageSkeleton";
import { PostMediaCover, UserAvatar } from "@/components/UserAvatar";
import PlatformFilter, { ALL_PLATFORM_QUERY } from "@/components/PlatformFilter";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { usePosts, useRunCommentsBulk } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS, TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";
import PostDetailModal from "./PostDetailModal";

const POSTS_QUERY = { platform: ALL_PLATFORM_QUERY, keyword: "", match: "related" };
const MATCH_TABS = ["related", "unrelated"] as const;

function PostTile({
  post,
  selected,
  canSelect,
  onOpen,
  onToggleSelect,
}: {
  post: Post;
  selected: boolean;
  canSelect: boolean;
  onOpen: () => void;
  onToggleSelect: (checked: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[0_1px_2px_rgba(22,19,16,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={onOpen}
    >
      <div className="relative">
        <PostMediaCover mediaUrl={post.media_url} mediaType={post.media_type} alt={post.content} />
        {canSelect ? (
          <span className="absolute left-2.5 top-2.5" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onChange={(e) => onToggleSelect(e.target.checked)} />
          </span>
        ) : null}
        <span className="absolute right-2.5 top-2.5">
          <PlatformBadge platform={post.platform} size={20} showLabel={false} />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-2">
          <p className="cell-primary mb-0 line-clamp-2 min-w-0 flex-1 text-[15px] font-semibold leading-snug">
            {post.content || "—"}
          </p>
          {post.url ? (
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex shrink-0 items-center text-[var(--accent)]"
              aria-label={t("openOriginal")}
            >
              <LinkOutlined />
            </a>
          ) : null}
        </div>

        <SharedPostCard quoted={post.quoted} />

        <div className="mt-auto flex min-w-0 items-center gap-2">
          <UserAvatar name={post.author} size={28} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[var(--ink)]">{post.author || "—"}</div>
            <div className="truncate text-[12px] text-[var(--muted)]">
              {[post.movie_title, post.keyword].filter(Boolean).join(" · ") || t("columnMovieKeyword")}
            </div>
          </div>
          <span className="shrink-0 text-[12px] text-[var(--muted)]">{formatRelativeTime(post.scraped_at, t)}</span>
        </div>

        <EngagementMetrics likes={post.like_count} replies={post.reply_count} reposts={post.repost_count} />
      </div>
    </article>
  );
}

export default function PostsReview() {
  const { t } = useTranslation();
  const [query, setQuery] = useQueryRecord(POSTS_QUERY);
  const platform = query.platform === ALL_PLATFORM_QUERY ? undefined : query.platform;
  const keywordId = query.keyword || undefined;
  const match = MATCH_TABS.includes(query.match as (typeof MATCH_TABS)[number]) ? query.match : "related";
  const keywordMatch = match === "related";
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = usePosts(platform, keywordId, keywordMatch);
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const runCommentsBulk = useRunCommentsBulk();

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <DashboardCard
        title={<CardHeading icon={<UnorderedListOutlined />} title={t("recentlyScrapedPosts")} />}
        extra={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <KeywordFilter
              platform={platform}
              value={keywordId}
              onChange={(next) => {
                setSelectedRowKeys([]);
                setQuery({ keyword: next ?? "" });
              }}
            />
            <PlatformFilter
              value={query.platform}
              platforms={TRIGGERABLE_PLATFORMS}
              onChange={(next) => {
                setSelectedRowKeys([]);
                setQuery({ platform: next, keyword: "" });
              }}
            />
          </div>
        }
      >
        <Tabs
          className="ui-tabs"
          activeKey={match}
          onChange={(next) => {
            setSelectedRowKeys([]);
            setQuery({ match: next });
          }}
          items={[
            { key: "related", label: t("postsRelated") },
            { key: "unrelated", label: t("postsUnrelated") },
          ]}
        />
        {selectedRowKeys.length > 0 && (
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] px-4 py-3">
            <Typography.Text className="text-sm text-[var(--ink-soft)]">{t("selectPostsCommentsHint")}</Typography.Text>
            <Button
              type="primary"
              loading={runCommentsBulk.isPending}
              onClick={() => {
                const byId = new Map(items.map((p) => [p.id, p]));
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
      </DashboardCard>

      {isLoading && !data ? (
        <PostGridSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] py-16">
          <Empty description={t("noPostsYet")} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((post) => {
              const canSelect = (COMMENT_SUPPORTED_PLATFORMS as readonly string[]).includes(post.platform);
              return (
                <PostTile
                  key={post.id}
                  post={post}
                  canSelect={canSelect}
                  selected={selectedRowKeys.includes(post.id)}
                  onOpen={() => setSelectedPost(post)}
                  onToggleSelect={(checked) => {
                    setSelectedRowKeys((keys) =>
                      checked ? [...keys, post.id] : keys.filter((k) => k !== post.id),
                    );
                  }}
                />
              );
            })}
          </div>
          {hasNextPage ? (
            <div className="flex justify-center">
              <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                {t("loadMore")}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
