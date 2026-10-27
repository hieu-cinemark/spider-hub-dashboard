"use client";

import { HeartOutlined, LinkOutlined, MessageOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import PlatformBadge from "@/components/PlatformBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { CommentWithPost } from "@/lib/types";

/**
 * Cây bình luận.
 *
 * API trả về `parent_external_id` cho mỗi bình luận, nhưng không trả về
 * bình luận cha (nó nằm ở trang dữ liệu khác). Ở đây ta dựng cây từ
 * những bình luận đang tải: bình luận nào có cha cũng nằm trong danh sách
 * thì lồng vào cha; bình luận nào mà cha không có trong trang hiện tại thì
 * đứng ở gốc nhưng vẫn hiện trích dẫn "trả lời <tác giả>".
 */

export interface CommentNode {
  comment: CommentWithPost;
  children: CommentNode[];
  /** Cha không có trong trang dữ liệu hiện tại - vẫn hiện trích dẫn cha. */
  orphan: boolean;
}

export function buildCommentTree(items: CommentWithPost[]): CommentNode[] {
  const byExternalId = new Map<string, CommentWithPost>();
  for (const comment of items) {
    if (comment.external_id && !byExternalId.has(comment.external_id)) {
      byExternalId.set(comment.external_id, comment);
    }
  }

  const nodes = new Map<string, CommentNode>();
  for (const comment of items) {
    nodes.set(comment.id, { comment, children: [], orphan: false });
  }

  const roots: CommentNode[] = [];
  for (const comment of items) {
    const node = nodes.get(comment.id)!;
    const parentId = comment.parent_external_id;
    if (parentId && byExternalId.has(parentId) && byExternalId.get(parentId)!.id !== comment.id) {
      const parent = nodes.get(byExternalId.get(parentId)!.id);
      // Bảo vệ khỏi vòng lặp: nếu cha không phải gốc thì gắn vào gốc.
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    node.orphan = Boolean(parentId);
    roots.push(node);
  }

  // Sắp xếp: gốc mới nhất lên đầu, trả lời trong mỗi nhánh cũ nhất lên
  // đầu (đúng như luồng hội thoại đọc từ trên xuống).
  const byTimeDesc = (a: CommentNode, b: CommentNode) =>
    new Date(b.comment.scraped_at).getTime() - new Date(a.comment.scraped_at).getTime();
  roots.sort(byTimeDesc);
  for (const root of roots) {
    root.children.sort((a, b) => byTimeDesc(b, a));
  }

  return roots;
}

function countNodes(nodes: CommentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

export function countReplies(nodes: CommentNode[]): number {
  return countNodes(nodes) - nodes.length;
}

function CommentMeta({ comment }: { comment: CommentWithPost }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[var(--muted)]">
      <span className="tabular-nums">{formatRelativeTime(comment.scraped_at, t)}</span>
      <span className="metric-item">
        <HeartOutlined />
        {comment.reactions_count.toLocaleString()}
      </span>
      <span className="metric-item">
        <MessageOutlined />
        {comment.replies_count.toLocaleString()}
      </span>
      {comment.post_url ? (
        <a
          href={comment.post_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[var(--accent)]"
        >
          <LinkOutlined /> {t("columnOnPost")}
        </a>
      ) : null}
    </div>
  );
}

function CommentRow({
  node,
  depth,
  isLast,
}: {
  node: CommentNode;
  depth: number;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const { comment, children, orphan } = node;

  return (
    <li className="relative">
      {depth > 0 ? (
        <span
          aria-hidden
          className="absolute left-0 top-0 w-5 border-l border-dashed border-[var(--line)]"
          style={{ height: isLast ? "1.25rem" : "100%" }}
        />
      ) : null}

      <div
        className={`flex min-w-0 items-start gap-3 ${
          depth > 0 ? "pl-6 pt-1" : "pb-1"
        }`}
      >
        <UserAvatar src={comment.author_profile_picture} name={comment.author_name} size={depth > 0 ? 28 : 36} />
        <div className="cell-stack min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="cell-primary break-words">{comment.author_name || "—"}</span>
            <PlatformBadge platform={comment.platform} size={20} showLabel={false} />
            {depth > 0 ? (
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--accent-deep)]">
                {t("commentReplyLabel")}
              </span>
            ) : null}
          </div>

          {orphan && comment.parent_external_id ? (
            <div className="cell-secondary break-words">
              {comment.parent_author_name || comment.parent_message
                ? t("inReplyTo", {
                    author: comment.parent_author_name || "—",
                    text: comment.parent_message || "",
                  })
                : t("inReplyToUnknown")}
            </div>
          ) : null}

          <span className="cell-primary font-normal whitespace-pre-line break-words">
            {comment.message || "—"}
          </span>

          <CommentMeta comment={comment} />
        </div>
      </div>

      {children.length > 0 ? (
        <ul className="ml-1 flex flex-col">
          {children.map((child, index) => (
            <CommentRow
              key={child.comment.id}
              node={child}
              depth={depth + 1}
              isLast={index === children.length - 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function CommentTree({ items }: { items: CommentWithPost[] }) {
  const { t } = useTranslation();
  const roots = useMemo(() => buildCommentTree(items), [items]);
  const replies = useMemo(() => countReplies(roots), [roots]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {replies > 0 ? (
        <div className="text-[12px] text-[var(--muted)]">
          {t("commentTreeSummary", { replies, comments: items.length })}
        </div>
      ) : null}
      <ul className="flex flex-col">
        {roots.map((root) => (
          <CommentRow key={root.comment.id} node={root} depth={0} isLast />
        ))}
      </ul>
    </div>
  );
}
