"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined, RetweetOutlined } from "@ant-design/icons";
import { Button, Empty, List, Modal, Space, Tag, Typography } from "antd";
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
    <div className="flex flex-col gap-2 border-t border-[#f0f0f0] pt-3">
      <div className="flex items-center justify-between">
        <Typography.Text strong>{t("commentsTitle")}</Typography.Text>
        <Button
          size="small"
          loading={runComments.isPending}
          onClick={() => runComments.mutate({ platform: post.platform, postId: post.id })}
        >
          {t("fetchComments")}
        </Button>
      </div>
      <List
        size="small"
        loading={isLoading}
        dataSource={comments ?? []}
        locale={{ emptyText: <Empty description={t("noCommentsYet")} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(comment) => (
          <List.Item key={comment.id}>
            <div className="flex w-full flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <Typography.Text strong className="text-xs">
                  {comment.author_name || "—"}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                  {formatRelativeTime(comment.scraped_at, t)}
                </Typography.Text>
              </div>
              <Typography.Text className="text-sm whitespace-pre-wrap">{comment.message || "—"}</Typography.Text>
            </div>
          </List.Item>
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
      destroyOnHidden
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      {post && (
        <div className="flex flex-col gap-4 pr-1">
          <Space wrap size="small" align="center">
            <Tag color={platformColor(post.platform)} icon={<PlatformIcon platform={post.platform} />}>
              {platformLabel(post.platform)}
            </Tag>
            {post.movie_title && <Tag>{post.movie_title}</Tag>}
            {post.keyword && <Tag>{post.keyword}</Tag>}
          </Space>

          {post.author && <Typography.Text strong>{post.author}</Typography.Text>}

          <Typography.Paragraph className="!mb-0 whitespace-pre-wrap">{post.content || "—"}</Typography.Paragraph>

          <Space size="middle" className="text-sm text-[#8c8c8c]">
            <span>
              <HeartOutlined /> {post.like_count.toLocaleString()}
            </span>
            <span>
              <MessageOutlined /> {post.reply_count.toLocaleString()}
            </span>
            <span>
              <RetweetOutlined /> {post.repost_count.toLocaleString()}
            </span>
          </Space>

          <div className="flex items-center justify-between text-xs text-[#8c8c8c]">
            <span>
              {t("columnScraped")} {formatRelativeTime(post.scraped_at, t)}
            </span>
            {post.url && (
              <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                <LinkOutlined /> {t("openOriginal")}
              </a>
            )}
          </div>

          {(COMMENT_SUPPORTED_PLATFORMS as readonly string[]).includes(post.platform) ? (
            <CommentsSection post={post} />
          ) : (
            <Typography.Text type="secondary" className="text-xs">
              {t("commentsUnavailable")}
            </Typography.Text>
          )}
        </div>
      )}
    </Modal>
  );
}
