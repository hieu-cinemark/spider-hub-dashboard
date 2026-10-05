"use client";

import { Line } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { TimeseriesPoint } from "@/lib/types";
import { formatShortDay } from "@/lib/platform";
import { CHART_HEIGHT, TIMESERIES_DAYS } from "@/lib/constants";
import { METRIC_CHART_COLOR as METRIC_COLOR, dayWindow, sumByDay } from "@/lib/chartSeries";
import { useColorTheme } from "@/theme/ThemeProvider";

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
    const days = dayWindow(TIMESERIES_DAYS, [...posts, ...comments]);
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
      point={{ shape: "circle", size: 2 }}
      shapeField="smooth"
      style={{ lineWidth: 2 }}
      theme={{ type: isDark ? "classicDark" : "classic" }}
      axis={{
        y: { title: false, grid: true, labelFormatter: (v: number) => Number(v).toLocaleString() },
        x: { title: false, labelFormatter: formatShortDay, labelAutoHide: true, labelAutoRotate: false },
      }}
      tooltip={{
        title: (d: { day: string }) => formatShortDay(d.day),
        items: [{ channel: "y", valueFormatter: (v: number) => Number(v).toLocaleString() }],
      }}
      interaction={{ tooltip: { shared: true } }}
      legend={{ color: { position: "top" } }}
      animation={false}
      height={CHART_HEIGHT}
    />
  );
}

export default memo(TimeseriesChart);
