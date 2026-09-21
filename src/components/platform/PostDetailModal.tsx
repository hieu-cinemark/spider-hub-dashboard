"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Empty, List, Modal, Tag, Typography } from "antd";
import EngagementMetrics from "@/components/EngagementMetrics";
import { useComments, useRunComments } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { COMMENT_SUPPORTED_PLATFORMS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel } from "@/lib/platform";
import type { Post } from "@/lib/types";

function CommentsSection({ post }: { post: Post }) {
  const { t } = useTranslation();
  const { data: comments, isLoading } = useComments(post.id);
  const runComments = useRunComments();

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography.Text strong className="text-[15px]">
          {t("commentsTitle")}
        </Typography.Text>
        <Button loading={runComments.isPending} onClick={() => runComments.mutate({ platform: post.platform, postId: post.id })}>
          {t("fetchComments")}
        </Button>
      </div>
      <List
        loading={isLoading}
        dataSource={comments ?? []}
        locale={{ emptyText: <Empty description={t("noCommentsYet")} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        split={false}
        renderItem={(comment) => (
          <div
            key={comment.id}
            className={`modal-comment ${comment.parent_external_id ? "modal-comment-reply" : ""}`}
          >
            {comment.parent_external_id && (
              <span className="cell-secondary">
                {comment.parent_author_name || comment.parent_message
                  ? t("inReplyTo", {
                      author: comment.parent_author_name || "—",
                      text: comment.parent_message || "",
                    })
                  : t("inReplyToUnknown")}
              </span>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <span className="cell-primary">{comment.author_name || "—"}</span>
              <span className="cell-meta shrink-0">{formatRelativeTime(comment.scraped_at, t)}</span>
            </div>
            <p className="modal-post-body !text-[14px]">{comment.message || "—"}</p>
            {(comment.reactions_count > 0 || comment.replies_count > 0) && (
              <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, auto))" }}>
                <span className="metric-item">
                  <HeartOutlined />
                  {comment.reactions_count.toLocaleString()}
                </span>
                <span className="metric-item">
                  <MessageOutlined />
                  {comment.replies_count.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}

export default function PostDetailModal({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal
      key={post?.id}
      open={post !== null}
      onCancel={onClose}
      footer={null}
      title={t("postDetail")}
      width={640}
      destroyOnHidden
      styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
    >
      {post && (
        <div className="modal-section">
          <div className="modal-meta-row">
            <Tag color={platformColor(post.platform)} icon={<PlatformIcon platform={post.platform} />}>
              {platformLabel(post.platform)}
            </Tag>
            {post.movie_title && <Tag>{post.movie_title}</Tag>}
            {post.keyword && <Tag>{post.keyword}</Tag>}
          </div>

          {post.author ? <div className="cell-primary text-[15px]">{post.author}</div> : null}

          <p className="modal-post-body">{post.content || "—"}</p>

          <div className="modal-stats">
            <EngagementMetrics likes={post.like_count} replies={post.reply_count} reposts={post.repost_count} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[var(--muted)]">
            <span>
              {t("columnScraped")} · {formatRelativeTime(post.scraped_at, t)}
            </span>
            {post.url && (
              <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[var(--accent)]">
                <LinkOutlined /> {t("openOriginal")}
              </a>
            )}
          </div>

          {(COMMENT_SUPPORTED_PLATFORMS as readonly string[]).includes(post.platform) ? (
            <CommentsSection post={post} />
          ) : (
            <Typography.Text type="secondary" className="text-sm">
              {t("commentsUnavailable")}
            </Typography.Text>
          )}
        </div>
      )}
    </Modal>
  );
}
