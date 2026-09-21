"use client";

import { LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Empty, Modal, Table, Typography } from "antd";
import EngagementMetrics from "@/components/EngagementMetrics";
import PlatformBadge from "@/components/PlatformBadge";
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
      width={960}
      centered
      title={t("topPostsTitle", {
        n: String(TOP_POSTS_LIMIT),
        keyword: label ?? "",
      })}
      destroyOnHidden
      // Keep the dialog inside the viewport so wheel scroll stays on the
      // table body instead of growing the modal and scrolling the page behind.
      styles={{
        root: {
          maxHeight: "90vh",
        },
        body: {
          maxHeight: "calc(90vh - 110px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
      <Table<Post>
        className="min-h-0 flex-1"
        size="middle"
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        locale={{ emptyText: <Empty description={t("noTopPostsYet")} /> }}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ y: "max(240px, calc(90vh - 280px))" }}
        columns={[
          {
            title: t("platform"),
            dataIndex: "platform",
            width: 88,
            render: (p: string) => (
              <PlatformBadge platform={p} size={22} showLabel={false} />
            ),
          },
          {
            title: t("columnContent"),
            dataIndex: "content",
            render: (v: string | null, record: Post) => (
              <div className="cell-stack max-w-[380px]">
                <div className="flex items-start gap-2">
                  <span className="cell-primary line-clamp-3">{v || "—"}</span>
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
              </div>
            ),
          },
          {
            title: t("columnAuthor"),
            dataIndex: "author",
            width: 140,
            render: (v: string | null) => (
              <span className="cell-primary truncate">{v || "—"}</span>
            ),
          },
          {
            title: t("columnEngagement"),
            key: "engagement",
            width: 168,
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
            width: 112,
            render: (v: string) => (
              <span className="cell-meta">{formatRelativeTime(v, t)}</span>
            ),
          },
        ]}
      />
    </Modal>
  );
}
