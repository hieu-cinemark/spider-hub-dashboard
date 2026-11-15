"use client";

import { LinkOutlined } from "@ant-design/icons";
import DetailDrawer from "@/components/ui/DetailDrawer";
import { DetailRow, DetailSection } from "@/components/ui/CopyableValue";
import CopyButton from "@/components/ui/CopyButton";
import PlatformBadge from "@/components/PlatformBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { CommentWithPost } from "@/lib/types";

/**
 * The full comment record.
 *
 * The list view clamps the message to two lines and hides the author id,
 * the post id and the raw parent ids - everything a reviewer needs when
 * they have to escalate or reconcile a record lives here instead.
 */
export default function CommentDetailDrawer({
  comment,
  onClose,
}: {
  comment: CommentWithPost | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!comment) return null;

  return (
    <DetailDrawer
      open
      onClose={onClose}
      width={560}
      title={comment.author_name || t("columnAuthor")}
      subtitle={comment.platform}
      extra={<PlatformBadge platform={comment.platform} size={22} />}
    >
      <DetailSection title={t("columnContent")}>
        <div className="mb-3 flex items-start gap-3">
          <UserAvatar src={comment.author_profile_picture} name={comment.author_name} size={40} />
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-[var(--ink)]">
              {comment.author_name || "—"}
            </div>
            <div className="text-[12px] text-[var(--muted)]">
              {formatRelativeTime(comment.scraped_at, t)}
            </div>
          </div>
        </div>
        <p className="mb-0 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-[var(--ink-soft)]">
          {comment.message || "—"}
        </p>
      </DetailSection>

      {comment.parent_external_id || comment.parent_message ? (
        <DetailSection title={t("inReplyToUnknown")}>
          {comment.parent_author_name ? (
            <DetailRow label={t("columnAuthor")}>{comment.parent_author_name}</DetailRow>
          ) : null}
          {comment.parent_message ? (
            <DetailRow label={t("columnContent")}>{comment.parent_message}</DetailRow>
          ) : null}
          {comment.parent_external_id ? (
            <DetailRow label="Parent ID" mono>
              <span className="inline-flex items-center gap-1.5">
                {comment.parent_external_id}
                <CopyButton value={comment.parent_external_id} />
              </span>
            </DetailRow>
          ) : null}
        </DetailSection>
      ) : null}

      <DetailSection title={t("columnOnPost")}>
        {comment.post_content ? (
          <DetailRow label={t("columnContent")}>{comment.post_content}</DetailRow>
        ) : null}
        {comment.post_author ? (
          <DetailRow label={t("columnAuthor")}>{comment.post_author}</DetailRow>
        ) : null}
        {comment.post_url ? (
          <DetailRow label={t("openOriginal")}>
            <a
              href={comment.post_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--accent)]"
            >
              <LinkOutlined />
              {comment.post_url}
            </a>
          </DetailRow>
        ) : null}
      </DetailSection>

      <DetailSection title={t("accountTechnicalSection")}>
        <DetailRow label={t("columnRecordId")} mono>
          <span className="inline-flex items-center gap-1.5">
            {comment.id}
            <CopyButton value={comment.id} />
          </span>
        </DetailRow>
        <DetailRow label="External ID" mono>
          <span className="inline-flex items-center gap-1.5">
            {comment.external_id}
            <CopyButton value={comment.external_id} />
          </span>
        </DetailRow>
        <DetailRow label="Post ID" mono>
          <span className="inline-flex items-center gap-1.5">
            {comment.post_id}
            <CopyButton value={comment.post_id} />
          </span>
        </DetailRow>
        <DetailRow label={t("columnAuthorId")} mono>
          {comment.author_id || "—"}
        </DetailRow>
        {comment.author_url ? (
          <DetailRow label={t("columnAuthorUrl")}>
            <a
              href={comment.author_url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)]"
            >
              {comment.author_url}
            </a>
          </DetailRow>
        ) : null}
        <DetailRow label={t("columnReactions")}>{comment.reactions_count.toLocaleString()}</DetailRow>
        <DetailRow label={t("columnReplies")}>{comment.replies_count.toLocaleString()}</DetailRow>
        <DetailRow label={t("columnPostedAt")}>
          {comment.posted_at ? new Date(comment.posted_at).toLocaleString() : "—"}
        </DetailRow>
        <DetailRow label={t("columnScraped")}>
          {new Date(comment.scraped_at).toLocaleString()}
        </DetailRow>
        {comment.sentiment ? (
          <DetailRow label={t("columnSentiment")}>{comment.sentiment}</DetailRow>
        ) : null}
        {comment.movie_title ? (
          <DetailRow label={t("columnMovie")}>{comment.movie_title}</DetailRow>
        ) : null}
        {comment.keyword ? (
          <DetailRow label={t("columnKeyword")}>{comment.keyword}</DetailRow>
        ) : null}
      </DetailSection>
    </DetailDrawer>
  );
}
