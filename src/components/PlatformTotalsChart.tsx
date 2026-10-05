"use client";

import { Column } from "@ant-design/plots";
import { memo, useMemo } from "react";
import { useColorTheme } from "@/theme/ThemeProvider";
import { platformLabel } from "@/lib/platform";
import { CHART_HEIGHT } from "@/lib/constants";
import type { PlatformStat } from "@/lib/types";
import { METRIC_CHART_COLOR as METRIC_COLOR } from "@/lib/chartSeries";


function PlatformTotalsChart({
  posts,
  comments,
  postsLabel,
  commentsLabel,
  height = CHART_HEIGHT,
}: {
  posts: PlatformStat[];
  comments: PlatformStat[];
  postsLabel: string;
  commentsLabel: string;
  height?: number;
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
      style={{ maxWidth: 56 }}
      height={height}
    />
  );
}

export default memo(PlatformTotalsChart);
