"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Empty, List, Modal, Tag, Typography } from "antd";
import EngagementMetrics from "@/components/EngagementMetrics";
import CopyButton from "@/components/ui/CopyButton";
import { PostMediaHero, UserAvatar } from "@/components/UserAvatar";
import SharedPostCard from "@/components/SharedPostCard";
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
    <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5">
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
              <span className="modal-comment-quote">
                {comment.parent_author_name || comment.parent_message
                  ? t("inReplyTo", {
                      author: comment.parent_author_name || "—",
                      text: comment.parent_message || "",
                    })
                  : t("inReplyToUnknown")}
              </span>
            )}
            <div className="flex items-center gap-2.5">
              <UserAvatar src={comment.author_profile_picture} name={comment.author_name} size={28} />
              <span className="cell-primary truncate-1 !font-semibold">{comment.author_name || "—"}</span>
              <span className="cell-meta ml-auto shrink-0">{formatRelativeTime(comment.scraped_at, t)}</span>
            </div>
            <p className="modal-comment-body">{comment.message || "—"}</p>
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
      width={680}
      destroyOnHidden
      centered
      styles={{ body: { maxHeight: "78vh", overflowY: "auto" } }}
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

          {post.author ? (
            <div className="mt-4 mb-4 flex items-center gap-2.5">
              <UserAvatar name={post.author} size={34} />
              <div className="cell-primary truncate-1 text-[15px]">{post.author}</div>
            </div>
          ) : null}

          <PostMediaHero mediaUrl={post.media_url} mediaType={post.media_type} alt={post.content} />

          <p className="modal-post-body mt-4">{post.content || "—"}</p>
          <div className="mt-4">
            <SharedPostCard quoted={post.quoted} />
          </div>

          <div className="modal-stats mt-5">
            <EngagementMetrics likes={post.like_count} replies={post.reply_count} reposts={post.repost_count} />
          </div>

          <div className="mt-5 mb-1 flex flex-wrap items-center justify-between gap-2 text-[13px] text-[var(--muted)]">
            <span>
              {t("columnScraped")} · {formatRelativeTime(post.scraped_at, t)}
            </span>
            {post.url && (
              <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[var(--accent)]">
                <LinkOutlined /> {t("openOriginal")}
              </a>
            )}
          </div>

          <div className="border-t border-[var(--line)] pt-5">
            <div className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              {t("accountTechnicalSection")}
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-row-label">{t("columnRecordId")}</span>
                <span className="detail-row-value detail-row-value-mono">
                  <span className="inline-flex items-center gap-1.5">
                    {post.id}
                    <CopyButton value={post.id} />
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">External ID</span>
                <span className="detail-row-value detail-row-value-mono">
                  <span className="inline-flex items-center gap-1.5">
                    {post.external_id}
                    <CopyButton value={post.external_id} />
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">{t("columnPostedAt")}</span>
                <span className="detail-row-value">
                  {post.posted_at ? new Date(post.posted_at).toLocaleString() : "—"}
                </span>
              </div>
            </div>
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
