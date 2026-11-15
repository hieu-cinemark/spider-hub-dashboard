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
    <div className="flex flex-nowrap items-center gap-2 text-[12.5px] font-semibold tabular-nums text-[var(--ink)]">
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap"
        style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}
        title="Likes"
      >
        <HeartOutlined />
        {likes.toLocaleString()}
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap"
        style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent-deep)" }}
        title="Replies"
      >
        <MessageOutlined />
        {replies.toLocaleString()}
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap"
        style={{ background: "color-mix(in srgb, var(--ok) 10%, transparent)", color: "var(--ok)" }}
        title="Reposts"
      >
        <RetweetOutlined />
        {reposts.toLocaleString()}
      </span>
    </div>
  );
}
