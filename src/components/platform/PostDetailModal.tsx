"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined, RetweetOutlined } from "@ant-design/icons";
import { Modal, Space, Tag, Typography } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel } from "@/lib/platform";
import type { Post } from "@/lib/types";

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
        </div>
      )}
    </Modal>
  );
}
