"use client";

import { Area } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { TimeseriesPoint } from "@/lib/types";
import { dayWindow, platformChartColor } from "@/lib/chartSeries";
import { formatShortDay, platformLabel } from "@/lib/platform";
import { CHART_HEIGHT, TIMESERIES_DAYS } from "@/lib/constants";
import { useColorTheme } from "@/theme/ThemeProvider";

// Posts per day, stacked by platform - the "which platform is actually
// feeding the pipeline" view the posts-vs-comments line chart can't give.
function PlatformTrendChart({ points }: { points: TimeseriesPoint[] }) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const { chartData, domain, range } = useMemo(() => {
    const platforms = Array.from(new Set(points.map((row) => row.platform))).sort();
    const counts = new Map(points.map((row) => [`${row.day}|${row.platform}`, row.count]));
    const days = dayWindow(TIMESERIES_DAYS, points);
    return {
      chartData: days.flatMap((day) =>
        platforms.map((platform) => ({
          day,
          platform: platformLabel(platform),
          count: counts.get(`${day}|${platform}`) ?? 0,
        })),
      ),
      domain: platforms.map(platformLabel),
      range: platforms.map((platform) => platformChartColor(platform, isDark)),
    };
  }, [points, isDark]);

  return (
    <Area
      data={chartData}
      xField="day"
      yField="count"
      colorField="platform"
      stack
      shapeField="smooth"
      style={{ fillOpacity: 0.22 }}
      line={{ shapeField: "smooth", style: { lineWidth: 2 } }}
      scale={{ color: { domain, range }, y: { nice: true, domainMin: 0 } }}
      insetTop={16}
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
      height={CHART_HEIGHT}
    />
  );
}

export default memo(PlatformTrendChart);
