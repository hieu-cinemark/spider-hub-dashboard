"use client";

import { Column } from "@ant-design/plots";
import { memo, useMemo } from "react";
import { useColorTheme } from "@/theme/ThemeProvider";
import { platformLabel } from "@/lib/platform";
import { CHART_HEIGHT } from "@/lib/constants";
import type { PlatformStat } from "@/lib/types";

const METRIC_COLOR = {
  posts: "#4f46e5",
  comments: "#d97706",
} as const;

function PlatformTotalsChart({
  posts,
  comments,
  postsLabel,
  commentsLabel,
}: {
  posts: PlatformStat[];
  comments: PlatformStat[];
  postsLabel: string;
  commentsLabel: string;
}) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const { chartData, maxCount } = useMemo(() => {
    const commentByPlatform = new Map(comments.map((row) => [row.platform, row.count]));
    const postByPlatform = new Map(posts.map((row) => [row.platform, row.count]));
    const platforms = Array.from(new Set([...postByPlatform.keys(), ...commentByPlatform.keys()]));
    const rows = platforms.flatMap((platform) => [
      {
        platform: platformLabel(platform),
        metric: postsLabel,
        count: postByPlatform.get(platform) ?? 0,
      },
      {
        platform: platformLabel(platform),
        metric: commentsLabel,
        count: commentByPlatform.get(platform) ?? 0,
      },
    ]);
    return { chartData: rows, maxCount: Math.max(...rows.map((row) => row.count), 1) };
  }, [posts, comments, postsLabel, commentsLabel]);

  return (
    <Column
      data={chartData}
      xField="platform"
      yField="count"
      colorField="metric"
      group
      scale={{
        color: {
          domain: [postsLabel, commentsLabel],
          range: [METRIC_COLOR.posts, METRIC_COLOR.comments],
        },
        y: { domainMin: 0, domainMax: Math.ceil(maxCount * 1.25) },
      }}
      insetTop={16}
      axis={{
        y: { title: false, grid: true, labelFormatter: (v: number) => Number(v).toLocaleString() },
        x: { title: false },
      }}
      tooltip={{
        items: [{ channel: "y", valueFormatter: (v: number) => Number(v).toLocaleString() }],
      }}
      legend={{ color: { position: "top" } }}
      animation={false}
      theme={{ type: isDark ? "classicDark" : "classic" }}
      height={CHART_HEIGHT}
    />
  );
}

export default memo(PlatformTotalsChart);
