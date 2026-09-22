"use client";

import { PlayCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { isVideoMediaType, postPreviewUrl } from "@/lib/media";

const FALLBACK_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#0f766e", fg: "#ecfdf5" },
  { bg: "#1d4ed8", fg: "#eff6ff" },
  { bg: "#7c3aed", fg: "#f5f3ff" },
  { bg: "#be123c", fg: "#fff1f2" },
  { bg: "#c2410c", fg: "#fff7ed" },
  { bg: "#0e7490", fg: "#ecfeff" },
  { bg: "#a16207", fg: "#fefce8" },
  { bg: "#4f46e5", fg: "#eef2ff" },
  { bg: "#15803d", fg: "#f0fdf4" },
  { bg: "#9f1239", fg: "#fff1f2" },
];

function initialFrom(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase();
}

function paletteFor(name: string): { bg: string; fg: string } {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

export function UserAvatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const initial = initialFrom(name);
  const fallback = useMemo(() => paletteFor(name?.trim() || "?"), [name]);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        backgroundColor: showImage ? "var(--paper-deep)" : fallback.bg,
        color: showImage ? "var(--ink-soft)" : fallback.fg,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote social CDNs, hide on error
        <img
          key={src ?? ""}
          src={src ?? ""}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src ?? "")}
        />
      ) : initial ? (
        <span className="leading-none">{initial}</span>
      ) : (
        <UserOutlined />
      )}
    </span>
  );
}

export function PostMediaThumb({
  mediaUrl,
  mediaType,
  alt,
  size = 96,
}: {
  mediaUrl?: string | null;
  mediaType?: string | number | null;
  alt?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = postPreviewUrl({ media_url: mediaUrl, media_type: mediaType });
  const video = isVideoMediaType(mediaType);
  if ((!src || failed) && !video) return null;
  const width = size;
  const height = Math.round(size * 1.15);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--paper-deep)] text-[var(--ink-soft)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--line)_70%,transparent)]"
      style={{ width, height, fontSize: Math.round(size * 0.36) }}
    >
      {src && !failed ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
          {video ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-white">
              <PlayCircleOutlined />
            </span>
          ) : null}
        </>
      ) : (
        <PlayCircleOutlined />
      )}
    </span>
  );
}

export function PostMediaHero({
  mediaUrl,
  mediaType,
  alt,
}: {
  mediaUrl?: string | null;
  mediaType?: string | number | null;
  alt?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const src = postPreviewUrl({ media_url: mediaUrl, media_type: mediaType });
  const video = isVideoMediaType(mediaType);
  if ((!src || failed) && !video) return null;

  return (
    <div className="modal-media-frame relative">
      {src && !failed ? (
        <span className="relative inline-flex max-h-full max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
          {video ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl text-white drop-shadow">
              <PlayCircleOutlined />
            </span>
          ) : null}
        </span>
      ) : (
        <span className="flex h-40 w-full items-center justify-center text-3xl text-[var(--ink-soft)]">
          <PlayCircleOutlined />
        </span>
      )}
    </div>
  );
}
