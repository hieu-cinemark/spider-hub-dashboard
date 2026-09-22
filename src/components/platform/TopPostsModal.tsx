"use client";

import { LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Empty, Modal, Table, Typography } from "antd";
import EngagementMetrics from "@/components/EngagementMetrics";
import PlatformBadge from "@/components/PlatformBadge";
import { PostMediaThumb, UserAvatar } from "@/components/UserAvatar";
import SharedPostCard from "@/components/SharedPostCard";
import {
  useRunCommentsBulk,
  useTopPostsByKeyword,
  useTopPostsByMovie,
} from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TOP_POSTS_COMMENT_PLATFORMS, TOP_POSTS_LIMIT } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";

export default function TopPostsModal({
  keywordId,
  movieId,
  label,
  platform,
  onClose,
}: {
  keywordId?: string | null;
  movieId?: string | null;
  label: string | null;
  platform?: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const byKeyword = useTopPostsByKeyword(keywordId ?? undefined);
  const byMovie = useTopPostsByMovie(movieId ?? undefined);
  const { data, isLoading } = movieId ? byMovie : byKeyword;
  const runCommentsBulk = useRunCommentsBulk();
  const items = data?.items ?? [];
  const commentTargets = items.filter((post) =>
    (TOP_POSTS_COMMENT_PLATFORMS as readonly string[]).includes(post.platform),
  );
  const showCommentsButton =
    commentTargets.length > 0 &&
    (platform == null ||
      (TOP_POSTS_COMMENT_PLATFORMS as readonly string[]).includes(platform));

  return (
    <Modal
      key={keywordId ?? movieId ?? "closed"}
      open={keywordId != null || movieId != null}
      onCancel={onClose}
      footer={null}
      width={1120}
      centered
      title={t("topPostsTitle", {
        n: String(TOP_POSTS_LIMIT),
        keyword: label ?? "",
      })}
      destroyOnHidden
      className="top-posts-modal"
      styles={{
        root: {
          maxHeight: "90vh",
        },
        body: {
          maxHeight: "calc(90vh - 110px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingTop: 16,
        },
      }}
    >
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <Typography.Text
          type="secondary"
          className="block max-w-[640px] text-sm leading-relaxed"
        >
          {t("topPostsDesc")}
        </Typography.Text>
        {showCommentsButton ? (
          <Button
            type="primary"
            icon={<MessageOutlined />}
            loading={runCommentsBulk.isPending}
            onClick={() =>
              runCommentsBulk.mutate(
                commentTargets.map((post) => ({
                  platform: post.platform,
                  postId: post.id,
                })),
              )
            }
          >
            {t("fetchCommentsTopPosts", { n: String(commentTargets.length) })}
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <Table<Post>
          size="middle"
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          className="data-table data-table-roomy"
          locale={{ emptyText: <Empty description={t("noTopPostsYet")} /> }}
          pagination={{
            pageSize: 20,
            hideOnSinglePage: true,
            showTotal: (total) => t("postsTotal", { n: total.toLocaleString() }),
            showSizeChanger: false,
          }}
          tableLayout="fixed"
          columns={[
            {
              title: t("platform"),
              dataIndex: "platform",
              width: 128,
              render: (p: string) => <PlatformBadge platform={p} size={22} />,
            },
            {
              title: t("columnContent"),
              dataIndex: "content",
              render: (v: string | null, record: Post) => (
                <div className="flex min-w-0 items-start gap-3.5">
                  <PostMediaThumb mediaUrl={record.media_url} mediaType={record.media_type} alt={v} size={88} />
                  <div className="cell-stack min-w-0 flex-1">
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
              title: t("columnAuthor"),
              dataIndex: "author",
              width: 148,
              ellipsis: true,
              render: (v: string | null) => (
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar name={v} size={28} />
                  <span className="cell-primary block truncate">{v || "—"}</span>
                </div>
              ),
            },
            {
              title: t("columnEngagement"),
              key: "engagement",
              width: 210,
              render: (_: unknown, record: Post) => (
                <EngagementMetrics
                  likes={record.like_count}
                  replies={record.reply_count}
                  reposts={record.repost_count}
                />
              ),
            },
            {
              title: t("columnScraped"),
              dataIndex: "scraped_at",
              width: 128,
              render: (v: string) => (
                <span className="cell-meta">{formatRelativeTime(v, t)}</span>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
}
