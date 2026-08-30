"use client";

import { PictureOutlined, PlayCircleFilled } from "@ant-design/icons";
import { useState } from "react";
import type { Post } from "@/lib/types";

// TikTok's own mapper always sets this literal string (see spider-hub's
// app/services/platforms.py _map_tiktok_post); Facebook/Threads pass
// through whatever numeric media_type their own GraphQL response used, and
// there's no single shared numeric convention worth hardcoding across both
// - so this only distinguishes the one case that's unambiguous, and lets
// the <img>/<video> fallback (onError) handle the rest either way.
export function isVideoMedia(mediaType: string | number | null): boolean {
  return mediaType === "video";
}

// Small square media preview for a table row - shared with
// PostDetailModal's own full-size rendering only via isVideoMedia, since
// the two layouts (cover-cropped thumbnail vs full-width with controls)
// differ enough that unifying the markup itself wouldn't save much.
export default function PostMediaThumbnail({
  post,
  size = 48,
}: {
  post: Pick<Post, "media_url" | "media_type" | "url">;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  // Facebook's search response has no real playable video URL for a Video
  // post - media_url just falls back to the post's own page link there
  // (see PostDetailModal's isUnplayableLink comment) - skip straight to the
  // placeholder instead of trying and failing to load a webpage as media.
  const isUnplayableLink = post.media_url != null && post.media_url === post.url;

  if (!post.media_url || isUnplayableLink || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-md bg-black/5 text-[#bfbfbf]"
        style={{ width: size, height: size }}
      >
        <PictureOutlined />
      </div>
    );
  }

  const video = isVideoMedia(post.media_type);

  return (
    <div className="relative shrink-0 overflow-hidden rounded-md bg-black/5" style={{ width: size, height: size }}>
      {video ? (
        <video
          src={post.media_url}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      ) : (
        // Expiring signed CDN URLs (TikTok/Facebook/Threads) aren't a fit
        // for next/image's fixed-domain optimizer, and this is a one-off
        // admin preview, not a performance-sensitive public page.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.media_url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      {video && (
        <PlayCircleFilled
          className="pointer-events-none absolute inset-0 m-auto text-white drop-shadow"
          style={{ fontSize: Math.round(size * 0.4) }}
        />
      )}
    </div>
  );
}
