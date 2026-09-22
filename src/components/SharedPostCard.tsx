"use client";

import { LinkOutlined } from "@ant-design/icons";
import { PostMediaThumb } from "@/components/UserAvatar";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { QuotedPost } from "@/lib/types";

export default function SharedPostCard({ quoted }: { quoted?: QuotedPost | null }) {
  const { t } = useTranslation();
  if (!quoted) return null;
  if (!quoted.author && !quoted.content && !quoted.url && !quoted.media_url) return null;

  return (
    <div className="on-post-quote mt-2">
      {quoted.media_url ? (
        <PostMediaThumb mediaUrl={quoted.media_url} mediaType="photo" alt={quoted.content} size={56} />
      ) : null}
      <div className="on-post-quote-body">
        <span className="on-post-quote-kicker">{t("sharedPostKicker")}</span>
        {quoted.author ? <span className="cell-secondary truncate">{quoted.author}</span> : null}
        <span className="cell-primary line-clamp-2">{quoted.content || "—"}</span>
      </div>
      {quoted.url ? (
        <a
          href={quoted.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex shrink-0 items-center text-[var(--accent)]"
        >
          <LinkOutlined />
        </a>
      ) : null}
    </div>
  );
}
