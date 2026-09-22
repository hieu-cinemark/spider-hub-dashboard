"use client";

import { HeartOutlined, MessageOutlined, RetweetOutlined } from "@ant-design/icons";

export default function EngagementMetrics({
  likes,
  replies,
  reposts,
}: {
  likes: number;
  replies: number;
  reposts: number;
}) {
  return (
    <div className="flex flex-nowrap items-center gap-3 text-[13px] font-medium tabular-nums text-[var(--ink)]">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title="Likes">
        <HeartOutlined className="text-[var(--ink-soft)]" />
        {likes.toLocaleString()}
      </span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title="Replies">
        <MessageOutlined className="text-[var(--ink-soft)]" />
        {replies.toLocaleString()}
      </span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title="Reposts">
        <RetweetOutlined className="text-[var(--ink-soft)]" />
        {reposts.toLocaleString()}
      </span>
    </div>
  );
}
