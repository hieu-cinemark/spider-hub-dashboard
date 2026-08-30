"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined, RetweetOutlined } from "@ant-design/icons";
import { Empty, Select, Space, Table, Typography } from "antd";
import { useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import PlatformBadge from "@/components/PlatformBadge";
import { useQueryParam } from "@/hooks/useQueryParam";
import { usePosts } from "@/hooks/useStats";
import { POSTS_PAGE_SIZE } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";
import PostDetailModal from "./PostDetailModal";
import PostMediaThumbnail from "./PostMediaThumbnail";

const PLATFORM_FILTER_OPTIONS = [
  { value: undefined, label: "All platforms" },
  { value: "facebook", label: "Facebook" },
  { value: "threads", label: "Threads" },
  { value: "tiktok", label: "TikTok" },
];

export default function PostsReview() {
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [pageParam, setPageParam] = useQueryParam("page", "1");
  const page = Math.max(0, (Number(pageParam) || 1) - 1);
  const setPage = (nextPage: number) => setPageParam(String(nextPage + 1));
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { data, isLoading, isPlaceholderData } = usePosts(platform, page);

  return (
    <DashboardCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={5} className="!mb-0">
          Recently scraped posts
        </Typography.Title>
        <Select
          allowClear
          placeholder="All platforms"
          className="w-full sm:w-auto"
          style={{ minWidth: 180 }}
          value={platform}
          onChange={(value) => {
            setPlatform(value);
            setPage(0);
          }}
          options={PLATFORM_FILTER_OPTIONS}
        />
      </div>
      <Table<Post>
        size="small"
        rowKey="id"
        scroll={{ x: "max-content" }}
        loading={isLoading || isPlaceholderData}
        dataSource={data?.items ?? []}
        locale={{ emptyText: <Empty description="No posts yet" /> }}
        onRow={(record) => ({ onClick: () => setSelectedPost(record), className: "cursor-pointer" })}
        pagination={{
          current: page + 1,
          pageSize: POSTS_PAGE_SIZE,
          total: data?.total ?? 0,
          onChange: (nextPage) => setPage(nextPage - 1),
          showTotal: (total) => `${total.toLocaleString()} posts`,
          responsive: true,
        }}
        columns={[
          {
            title: "Platform",
            dataIndex: "platform",
            width: 140,
            render: (p: string) => <PlatformBadge platform={p} size={24} />,
          },
          {
            title: "Media",
            key: "media",
            width: 64,
            render: (_: unknown, record: Post) => <PostMediaThumbnail post={record} />,
          },
          {
            title: "Movie / keyword",
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
          { title: "Author", dataIndex: "author", width: 140, render: (v: string | null) => v || "—" },
          {
            title: "Content",
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
            title: "Engagement",
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
            title: "Scraped",
            dataIndex: "scraped_at",
            width: 110,
            render: (v: string) => formatRelativeTime(v),
          },
        ]}
      />
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </DashboardCard>
  );
}
