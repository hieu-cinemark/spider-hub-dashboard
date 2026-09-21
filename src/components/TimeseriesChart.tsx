"use client";

import { Line } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { TimeseriesPoint } from "@/lib/types";
import { formatShortDay } from "@/lib/platform";
import { CHART_HEIGHT } from "@/lib/constants";
import { useColorTheme } from "@/theme/ThemeProvider";

const METRIC_COLOR = {
  posts: "#4f46e5",
  comments: "#d97706",
} as const;

function sumByDay(points: TimeseriesPoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of points) {
    totals.set(row.day, (totals.get(row.day) ?? 0) + row.count);
  }
  return totals;
}

function TimeseriesChart({
  posts,
  comments,
  postsLabel,
  commentsLabel,
}: {
  posts: TimeseriesPoint[];
  comments: TimeseriesPoint[];
  postsLabel: string;
  commentsLabel: string;
}) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const chartData = useMemo(() => {
    const postByDay = sumByDay(posts);
    const commentByDay = sumByDay(comments);
    const days = Array.from(new Set([...postByDay.keys(), ...commentByDay.keys()])).sort();
    return days.flatMap((day) => [
      { day, metric: postsLabel, count: postByDay.get(day) ?? 0 },
      { day, metric: commentsLabel, count: commentByDay.get(day) ?? 0 },
    ]);
  }, [posts, comments, postsLabel, commentsLabel]);

  return (
    <Line
      data={chartData}
      xField="day"
      yField="count"
      colorField="metric"
      scale={{
        color: {
          domain: [postsLabel, commentsLabel],
          range: [METRIC_COLOR.posts, METRIC_COLOR.comments],
        },
        y: { nice: true, domainMin: 0 },
      }}
      insetTop={16}
      point={{ shape: "circle", size: 3 }}
      smooth
      theme={{ type: isDark ? "classicDark" : "classic" }}
      axis={{
        y: { title: false, grid: true, labelFormatter: (v: number) => Number(v).toLocaleString() },
        x: { title: false, labelFormatter: formatShortDay },
      }}
      tooltip={{
        title: (d: { day: string }) => formatShortDay(d.day),
        items: [{ channel: "y", valueFormatter: (v: number) => Number(v).toLocaleString() }],
      }}
      legend={{ color: { position: "top" } }}
      animation={false}
      height={CHART_HEIGHT}
    />
  );
}

export default memo(TimeseriesChart);
