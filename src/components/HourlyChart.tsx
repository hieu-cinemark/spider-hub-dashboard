"use client";

import { Area } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { HourlyPoint } from "@/lib/types";
import { platformChartColor } from "@/lib/chartSeries";
import { platformLabel } from "@/lib/platform";
import { useColorTheme } from "@/theme/ThemeProvider";

const HOUR_MS = 3_600_000;

function label(ms: number, withDay: boolean): string {
  const d = new Date(ms);
  const hh = `${String(d.getHours()).padStart(2, "0")}:00`;
  return withDay ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${hh}` : hh;
}

// New posts or comments per hour, stacked by platform. The API only returns
// hours that had rows; every hour of the window is filled in here so a
// stalled crawl shows as a flat zero line instead of the axis silently
// skipping it.
function HourlyChart({
  points,
  hours,
  metric,
  platforms,
  asOf,
}: {
  points: HourlyPoint[];
  hours: number;
  metric: "posts" | "comments";
  platforms: string[];
  // When the data was fetched (query dataUpdatedAt) - the window ends at
  // that hour.
  asOf: number;
}) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const { data, domain, range } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of points) counts.set(`${Date.parse(p.hour)}|${p.platform}`, p[metric]);
    const all = [...new Set([...platforms, ...points.map((p) => p.platform)])].sort();
    const end = Math.floor(asOf / HOUR_MS) * HOUR_MS;
    const withDay = hours > 24;
    const rows = [];
    for (let i = hours - 1; i >= 0; i--) {
      const ms = end - i * HOUR_MS;
      for (const platform of all) {
        rows.push({ hour: label(ms, withDay), platform: platformLabel(platform), count: counts.get(`${ms}|${platform}`) ?? 0 });
      }
    }
    return {
      data: rows,
      domain: all.map(platformLabel),
      range: all.map((p) => platformChartColor(p, isDark)),
    };
  }, [points, hours, metric, platforms, isDark, asOf]);

  return (
    <Area
      data={data}
      xField="hour"
      yField="count"
      colorField="platform"
      stack
      style={{ fillOpacity: 0.22 }}
      line={{ style: { lineWidth: 2 } }}
      scale={{ color: { domain, range }, y: { nice: true, domainMin: 0 } }}
      insetTop={12}
      theme={{ type: isDark ? "classicDark" : "classic" }}
      axis={{
        y: { title: false, grid: true, labelFormatter: (v: number) => Number(v).toLocaleString() },
        x: { title: false, labelAutoHide: true, labelAutoRotate: false },
      }}
      interaction={{ tooltip: { shared: true } }}
      legend={{ color: { position: "top" } }}
      height={280}
    />
  );
}

export default memo(HourlyChart);
