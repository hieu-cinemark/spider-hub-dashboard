"use client";

import Link from "next/link";
import { CountDelta } from "@/components/CountDelta";
import StatusBadge, { type StatusTone } from "@/components/ui/StatusBadge";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import { formatRelativeTime } from "@/lib/format";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * One card per platform - Facebook, Threads, TikTok, YouTube all get the
 * exact same structure, so the eye can scan the row and compare platforms
 * without re-learning a different layout each time.
 */
export default function PlatformCard({
  platform,
  posts,
  comments,
  lastScrapedAt,
  postsToday,
  postsPrev,
  commentsToday,
  commentsPrev,
  tone,
  toneLabel,
  href,
  stale,
}: {
  platform: string;
  posts: number;
  comments: number;
  lastScrapedAt: string | null;
  postsToday?: number;
  postsPrev?: number;
  commentsToday?: number;
  commentsPrev?: number;
  tone: StatusTone;
  toneLabel: string;
  href?: string;
  stale?: boolean;
}) {
  const { t } = useTranslation();

  const inner = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--paper-deep)] text-[15px]">
            <PlatformIcon platform={platform} />
          </span>
          <span className="truncate-1 text-[13.5px] font-semibold text-[var(--ink)]">
            {platformLabel(platform)}
          </span>
        </div>
        <StatusBadge tone={tone}>{toneLabel}</StatusBadge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <div className="micro-label">{t("chartPosts")}</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[19px] leading-none font-semibold tabular-nums text-[var(--ink)]">
              {posts.toLocaleString()}
            </span>
            {postsToday !== undefined && postsPrev !== undefined ? (
              <CountDelta current={postsToday} previous={postsPrev} compact />
            ) : null}
          </div>
        </div>
        <div className="min-w-0">
          <div className="micro-label">{t("chartComments")}</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[19px] leading-none font-semibold tabular-nums text-[var(--ink)]">
              {comments.toLocaleString()}
            </span>
            {commentsToday !== undefined && commentsPrev !== undefined ? (
              <CountDelta current={commentsToday} previous={commentsPrev} compact />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-[var(--line)] pt-2 text-[11.5px] text-[var(--muted)]">
        <span className="truncate-1" title={lastScrapedAt ?? undefined}>
          {t("lastCollection")} {formatRelativeTime(lastScrapedAt, t)}
          {stale ? ` · ${t("crawlIssueStale")}` : ""}
        </span>
      </div>
    </>
  );

  const className =
    "flex h-full min-w-0 flex-col rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--accent)]";

  if (href) {
    return (
      <Link href={href} className={`${className} no-underline`}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}
