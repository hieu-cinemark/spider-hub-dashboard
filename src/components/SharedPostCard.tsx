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
    <div className="on-post-quote">
      {quoted.media_url ? (
        <PostMediaThumb mediaUrl={quoted.media_url} mediaType="photo" alt={quoted.content} size={56} />
      ) : null}
      <div className="on-post-quote-body">
        <span className="on-post-quote-kicker">{t("sharedPostKicker")}</span>
        {quoted.author ? (
          <span className="truncate-1 text-[12px] font-semibold text-[var(--ink-soft)]">{quoted.author}</span>
        ) : null}
        <span className="line-clamp-2 text-[13px] leading-[1.5] whitespace-pre-line text-[var(--ink-soft)]">
          {quoted.content || "—"}
        </span>
      </div>
      {quoted.url ? (
        <a
          href={quoted.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--accent)] transition-colors hover:bg-[var(--paper-deep)]"
          aria-label={t("openOriginal")}
        >
          <LinkOutlined />
        </a>
      ) : null}
    </div>
  );
}
