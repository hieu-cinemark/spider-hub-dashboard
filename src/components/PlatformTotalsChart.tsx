"use client";

import { Column } from "@ant-design/plots";
import type { PlatformStat } from "@/lib/types";
import { platformColorScale, platformLabel } from "@/lib/platform";

export default function PlatformTotalsChart({ data }: { data: PlatformStat[] }) {
  const chartData = data.map((row) => ({
    platform: platformLabel(row.platform),
    count: row.count,
  }));

  return (
    <Column
      data={chartData}
      xField="platform"
      yField="count"
      colorField="platform"
      scale={{ color: platformColorScale(data.map((row) => row.platform)) }}
      label={{ text: "count", style: { fontWeight: 600 } }}
      axis={{ y: { title: false, grid: true }, x: { title: false } }}
      legend={false}
      height={280}
    />
  );
}
