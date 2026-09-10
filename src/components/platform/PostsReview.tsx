"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined, RetweetOutlined } from "@ant-design/icons";
import { Button, Empty, Select, Space, Table, Typography } from "antd";
import { type Key, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import { useQueryParam } from "@/hooks/useQueryParam";
import { usePosts, useRunCommentsBulk } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS, POSTS_PAGE_SIZE } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";
import PostDetailModal from "./PostDetailModal";

export default function PostsReview() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [pageParam, setPageParam] = useQueryParam("page", "1");
  const page = Math.max(0, (Number(pageParam) || 1) - 1);
  const setPage = (nextPage: number) => setPageParam(String(nextPage + 1));
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // Cleared on every page/filter change (new `data.items`) rather than kept
  // across pages - Table's own rowSelection only knows about rows on the
  // currently rendered page, so a key surviving a page turn would silently
  // point at a post no longer visible/selectable, and a bulk-fetch button
  // stuck showing a mismatched count.
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const { data, isLoading, isPlaceholderData } = usePosts(platform, page);
  const runCommentsBulk = useRunCommentsBulk();

  const platformFilterOptions = [
    { value: undefined, label: t("allPlatformsFilter") },
    { value: "facebook", label: "Facebook" },
    { value: "threads", label: "Threads" },
    { value: "tiktok", label: "TikTok" },
  ];

  function goToPage(nextPage: number) {
    setSelectedRowKeys([]);
    setPage(nextPage);
  }

  return (
    <DashboardCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={5} className="!mb-0">
          {t("recentlyScrapedPosts")}
        </Typography.Title>
        <Select
          allowClear
          placeholder={platformFilterOptions[0].label}
          className="w-full sm:w-auto"
          style={{ minWidth: 180 }}
          value={platform}
          onChange={(value) => {
            setPlatform(value);
            goToPage(0);
          }}
          options={platformFilterOptions}
        />
      </div>
      {selectedRowKeys.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md bg-[#f0f5ff] px-3 py-2">
          <Typography.Text className="text-sm">{t("selectFacebookPostsHint")}</Typography.Text>
          <Button
            size="small"
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
      <Table<Post>
        size="small"
        rowKey="id"
        scroll={{ x: "max-content" }}
        loading={isLoading || isPlaceholderData}
        dataSource={data?.items ?? []}
        locale={{ emptyText: <Empty description={t("noPostsYet")} /> }}
        onRow={(record) => ({ onClick: () => setSelectedPost(record), className: "cursor-pointer" })}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          // Comments crawling is facebook-only (see cinemark-api's
          // get_comment_mapper) - a non-facebook row simply can't be
          // selected, rather than letting it through and failing silently
          // once the bulk request reaches the backend.
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
          responsive: true,
        }}
        columns={[
          {
            title: t("platform"),
            dataIndex: "platform",
            width: 140,
            render: (p: string) => <PlatformBadge platform={p} size={24} />,
          },
          {
            title: t("columnMovieKeyword"),
            key: "movie",
            width: 180,
            render: (_: unknown, record: Post) => (
              <div className="flex flex-col">
                <span>{record.movie_title ?? <Typography.Text type="secondary">—</Typography.Text>}</span>
                {record.keyword && (
                  <Typography.Text type="secondary" className="text-xs">
                    {record.keyword}
                  </Typography.Text>
                )}
              </div>
            ),
          },
          { title: t("columnAuthor"), dataIndex: "author", width: 140, render: (v: string | null) => v || "—" },
          {
            title: t("columnContent"),
            dataIndex: "content",
            width: 320,
            render: (v: string | null, record: Post) => (
              <div className="flex h-full items-center gap-2">
                <span className="line-clamp-2 text-sm">{v || "—"}</span>
                {record.url && (
                  <a
                    href={record.url}
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
            width: 170,
            render: (_: unknown, record: Post) => (
              <Space size="small" className="text-xs text-[#8c8c8c]">
                <span>
                  <HeartOutlined /> {record.like_count.toLocaleString()}
                </span>
                <span>
                  <MessageOutlined /> {record.reply_count.toLocaleString()}
                </span>
                <span>
                  <RetweetOutlined /> {record.repost_count.toLocaleString()}
                </span>
              </Space>
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
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </DashboardCard>
  );
}
