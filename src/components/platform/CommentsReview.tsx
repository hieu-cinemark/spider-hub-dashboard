"use client";

import {
  ApartmentOutlined,
  DislikeOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  LinkOutlined,
  MessageOutlined,
  MinusCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Empty, Table, Tooltip } from "antd";
import { useMemo, useState } from "react";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import CommentTree, { countReplies, buildCommentTree } from "@/components/platform/CommentTree";
import CommentDetailDrawer from "@/components/platform/CommentDetailDrawer";
import FilterChip from "@/components/ui/FilterChip";
import KeywordFilter from "@/components/KeywordFilter";
import PlatformBadge from "@/components/PlatformBadge";
import { UserAvatar } from "@/components/UserAvatar";
import PlatformFilter, { ALL_PLATFORM_QUERY } from "@/components/PlatformFilter";
import { TableRowsSkeleton } from "@/components/PageSkeleton";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useQueryRecord } from "@/hooks/useQueryParam";
import { useAllComments } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { CommentWithPost } from "@/lib/types";

const COMMENTS_QUERY = { platform: ALL_PLATFORM_QUERY, keyword: "", sentiment: "positive" };
const SENTIMENT_TABS = ["positive", "negative", "neutral"] as const;

function OnPostQuote({ record }: { record: CommentWithPost }) {
  const { t } = useTranslation();
  const meta = [record.movie_title, record.keyword, record.post_author ? `@${record.post_author}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="on-post-quote">
      <div className="on-post-quote-body">
        <span className="on-post-quote-kicker">{t("commentedOnPost")}</span>
        {meta ? <span className="cell-secondary truncate-1">{meta}</span> : null}
        <span className="cell-primary clamp-2">{record.post_content || "—"}</span>
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
  const isMobile = useIsMobile();
  const [query, setQuery] = useQueryRecord(COMMENTS_QUERY);
  // "tree" nhìn bình luận có reply theo dạng cây; "list" là bảng phẳng cũ.
  const [view, setView] = useState<"tree" | "list">("tree");
  const [detail, setDetail] = useState<CommentWithPost | null>(null);
  const platform = query.platform === ALL_PLATFORM_QUERY ? undefined : query.platform;
  const keywordId = query.keyword || undefined;
  const sentiment = SENTIMENT_TABS.includes(query.sentiment as (typeof SENTIMENT_TABS)[number])
    ? query.sentiment
    : "positive";
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useAllComments(platform, keywordId, sentiment);
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const replyCount = useMemo(() => countReplies(buildCommentTree(items)), [items]);

  const columns: ResponsiveColumnType<CommentWithPost>[] = [
    {
      title: t("columnContent"),
      dataIndex: "message",
      mobilePrimary: true,
      render: (v: string | null, record: CommentWithPost) => (
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar src={record.author_profile_picture} name={record.author_name} size={36} />
          <div className="cell-stack min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="cell-primary truncate-1">{record.author_name || "—"}</span>
              <PlatformBadge platform={record.platform} size={20} showLabel={false} />
            </div>
            {record.parent_external_id && (
              <div className="cell-secondary truncate-1">
                {record.parent_author_name || record.parent_message
                  ? t("inReplyTo", {
                      author: record.parent_author_name || "—",
                      text: record.parent_message || "",
                    })
                  : t("inReplyToUnknown")}
              </div>
            )}
            <span className="cell-primary !font-normal clamp-2">{v || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      title: t("columnOnPost"),
      key: "post",
      width: 300,
      render: (_: unknown, record: CommentWithPost) => <OnPostQuote record={record} />,
    },
    {
      title: t("columnEngagement"),
      key: "engagement",
      width: 132,
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
      width: 116,
      render: (v: string) => <span className="cell-meta">{formatRelativeTime(v, t)}</span>,
    },
    {
      title: t("actions"),
      key: "actions",
      width: 76,
      align: "right",
      mobileHidden: true,
      render: (_: unknown, record: CommentWithPost) => (
        <Tooltip title={t("viewDetails")}>
          <Button
            size="small"
            type="text"
            icon={<InfoCircleOutlined />}
            aria-label={t("viewDetails")}
            onClick={() => setDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Mọi bộ lọc nằm chung một thanh: nền tảng + từ khoá + cảm xúc +
          kiểu hiển thị. Không tách "cảm xúc" ra tab riêng nữa. */}
      <div className="filter-bar">
        <KeywordFilter
          platform={platform}
          value={keywordId}
          onChange={(next) => setQuery({ keyword: next ?? "" })}
        />
        <PlatformFilter
          value={query.platform}
          platforms={COMMENT_SUPPORTED_PLATFORMS}
          onChange={(next) => setQuery({ platform: next, keyword: "" })}
        />
        <div className="filter-bar-scroll">
          <FilterChip
            active={sentiment === "positive"}
            icon={<LikeOutlined />}
            label={t("commentsPositive")}
            accent="#16a34a"
            onClick={() => setQuery({ sentiment: "positive" })}
          />
          <FilterChip
            active={sentiment === "negative"}
            icon={<DislikeOutlined />}
            label={t("commentsNegative")}
            accent="#dc2626"
            onClick={() => setQuery({ sentiment: "negative" })}
          />
          <FilterChip
            active={sentiment === "neutral"}
            icon={<MinusCircleOutlined />}
            label={t("commentsNeutral")}
            accent="#64748b"
            onClick={() => setQuery({ sentiment: "neutral" })}
          />
        </div>
        <span className="mx-1 hidden h-5 w-px bg-[var(--line)] sm:block" aria-hidden />
        <div className="filter-bar-scroll">
          <FilterChip
            active={view === "tree"}
            icon={<ApartmentOutlined />}
            label={
              <span className="inline-flex items-center gap-1.5">
                {t("commentsViewTree")}
                {replyCount > 0 ? (
                  <span className="rounded-full bg-[var(--accent)]/15 px-1.5 text-[11px] font-semibold tabular-nums text-[var(--accent-deep)]">
                    {replyCount}
                  </span>
                ) : null}
              </span>
            }
            accent="var(--accent)"
            onClick={() => setView("tree")}
          />
          <FilterChip
            active={view === "list"}
            icon={<UnorderedListOutlined />}
            label={t("commentsViewList")}
            accent="var(--accent-2)"
            onClick={() => setView("list")}
          />
        </div>
      </div>
      {view === "tree" ? (
        <div className="flex flex-col gap-3">
          {isLoading && !data ? (
            <TableRowsSkeleton rows={6} />
          ) : items.length === 0 ? (
            <Empty description={t("noCommentsYet")} />
          ) : (
            <>
              <CommentTree items={items} />
              {hasNextPage ? (
                <div className="flex justify-center">
                  <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()} size="small">
                    {t("loadMore")}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : isMobile ? (
        <MobileTable
          loading={isLoading && !data}
          rowKey={(c) => c.id}
          dataSource={items}
          columns={columns}
          empty={<Empty description={t("noCommentsYet")} />}
          loadMore={{
            hasMore: !!hasNextPage,
            loading: isFetchingNextPage,
            onLoadMore: () => fetchNextPage(),
            label: t("loadMore"),
          }}
        />
      ) : isLoading && !data ? (
        <TableRowsSkeleton rows={8} />
      ) : (
        <Table<CommentWithPost>
          className="data-table"
          size="middle"
          rowKey="id"
          dataSource={items}
          locale={{ emptyText: <Empty description={t("noCommentsYet")} /> }}
          pagination={false}
          footer={
            hasNextPage
              ? () => (
                  <div className="flex justify-center">
                    <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()} size="small">
                      {t("loadMore")}
                    </Button>
                  </div>
                )
              : undefined
          }
          columns={columns}
        />
      )}
      <CommentDetailDrawer comment={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
