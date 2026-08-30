"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined, PictureOutlined, RetweetOutlined } from "@ant-design/icons";
import { Modal, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { PlatformIcon, platformColor, platformLabel } from "@/lib/platform";
import type { Post } from "@/lib/types";
import { isVideoMedia } from "./PostMediaThumbnail";

export default function PostDetailModal({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const [mediaFailed, setMediaFailed] = useState(false);

  // Facebook's search response never exposes a real playable video file URL
  // (confirmed - see spider-hub's facebook/features/search/extract.py
  // _extract_media docstring) - for a Video post it falls back to the
  // post's own permalink instead, which an <img>/<video> tag can never
  // render. Detecting that up front (rather than waiting for onError) lets
  // this show the *actual* reason instead of the generic "link expired"
  // message, which would otherwise be misleading here.
  const isUnplayableLink = post?.media_url != null && post.media_url === post.url;

  return (
    <Modal
      key={post?.id}
      open={post !== null}
      onCancel={onClose}
      footer={null}
      title="Post detail"
      destroyOnHidden
    >
      {post && (
        <div className="flex flex-col gap-4">
          <Space wrap size="small" align="center">
            <Tag color={platformColor(post.platform)} icon={<PlatformIcon platform={post.platform} />}>
              {platformLabel(post.platform)}
            </Tag>
            {post.movie_title && <Tag>{post.movie_title}</Tag>}
            {post.keyword && <Tag>{post.keyword}</Tag>}
          </Space>

          {post.author && <Typography.Text strong>{post.author}</Typography.Text>}

          <Typography.Paragraph className="!mb-0 whitespace-pre-wrap">{post.content || "—"}</Typography.Paragraph>

          {post.media_url && !isUnplayableLink && !mediaFailed && (
            <div className="overflow-hidden rounded-lg bg-black/5">
              {isVideoMedia(post.media_type) ? (
                <video src={post.media_url} controls className="max-h-96 w-full" onError={() => setMediaFailed(true)} />
              ) : (
                // External, expiring signed CDN URLs (TikTok/Facebook/Threads) aren't a
                // fit for next/image's fixed-domain optimizer, and this is a one-off
                // admin preview, not a performance-sensitive public page.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="max-h-96 w-full object-contain"
                  onError={() => setMediaFailed(true)}
                />
              )}
            </div>
          )}

          {post.media_url && isUnplayableLink && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-black/5 py-8 text-[#8c8c8c] px-4">
              <PictureOutlined className="text-2xl" />
              <Typography.Text type="secondary" className="text-xs">
                No inline preview - Facebook&apos;s search results don&apos;t expose a playable video link for
                this post, only its page URL. Use &quot;Open original&quot; below to watch it on Facebook.
              </Typography.Text>
            </div>
          )}

          {post.media_url && !isUnplayableLink && mediaFailed && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-black/5 py-8 text-[#8c8c8c] px-4">
              <PictureOutlined className="text-2xl" />
              <Typography.Text type="secondary" className="text-xs">
                Media unavailable - the platform&apos;s CDN link is signed and time-limited, and
                likely expired since this post was scraped. Use &quot;Open original&quot; below instead.
              </Typography.Text>
            </div>
          )}

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
            <span>Scraped {formatRelativeTime(post.scraped_at)}</span>
            {post.url && (
              <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                <LinkOutlined /> Open original
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
