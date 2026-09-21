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
    <div className="metric-grid metric-grid-3">
      <span className="metric-item" title="Likes">
        <HeartOutlined />
        {likes.toLocaleString()}
      </span>
      <span className="metric-item" title="Replies">
        <MessageOutlined />
        {replies.toLocaleString()}
      </span>
      <span className="metric-item" title="Reposts">
        <RetweetOutlined />
        {reposts.toLocaleString()}
      </span>
    </div>
  );
}
