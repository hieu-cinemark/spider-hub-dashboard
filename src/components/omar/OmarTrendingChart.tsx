"use client";

import { Area } from "@ant-design/plots";
import { memo, useMemo } from "react";
import type { OmarTrendingVideo } from "@/lib/types";
import { useColorTheme } from "@/theme/ThemeProvider";

const VIEWS_COLOR = "#00c8d7";
const COMMENTS_COLOR = "#f19542";

function fmtNumber(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString();
}

/**
 * Biểu đồ tốc độ tăng của các video đang nổi.
 *
 * Mỗi video là một đường: trục X là giờ (điểm mốc tương đối, "0h" = lúc
 * bắt đầu cửa sổ theo dõi), trục Y là lượt xem mỗi giờ. Nhờ vậy người
 * đọc thấy ngay video nào đang tăng nhanh nhất, thay vì phải đọc từng
 * dòng văn bản "· +56,786 lượt xem/giờ".
 *
 * Dữ liệu API chỉ trả về tốc độ hiện tại (velocity), không có chuỗi lịch
 * sửu, nên biểu đồ dựng lại một đường thẳng từ điểm 0 lên tốc độ
 * hiện tại - hình dạng "bật lên" là hình dạy thật của dữ liệu này. Số
 * giờ đã trôi qua (`span_hours`) quyết định vị trí điểm cuối.
 */
function OmarTrendingChart({ videos }: { videos: OmarTrendingVideo[] }) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  const { data, domain, range } = useMemo(() => {
    const rows = videos.map((video) => {
      const span = Math.max(1, Math.round(video.velocity.span_hours || 1));
      // Mỗi video: điểm đầu ở giờ 0, điểm cuối ở giờ `span`.
      return [
        { hour: 0, video: video.video_id, value: 0, kind: "views" },
        { hour: span, video: video.video_id, value: video.velocity.views_per_hour, kind: "views" },
        { hour: 0, video: video.video_id, value: 0, kind: "comments" },
        { hour: span, video: video.video_id, value: video.velocity.comments_per_hour, kind: "comments" },
      ];
    }).flat();

    const ids = videos.map((v) => v.video_id);
    return {
      data: rows,
      domain: ids,
      range: ids.map((_, i) => (i % 2 === 0 ? VIEWS_COLOR : COMMENTS_COLOR)),
    };
  }, [videos]);

  if (!videos.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <Area
        data={data}
        xField="hour"
        yField="value"
        colorField="video"
        shapeField="smooth"
        style={{ fillOpacity: 0.12, lineWidth: 2 }}
        scale={{ color: { domain, range }, y: { nice: true, domainMin: 0 } }}
        insetTop={16}
        theme={{ type: isDark ? "classicDark" : "classic" }}
        axis={{
          y: {
            title: false,
            grid: true,
            labelFormatter: (v: number) => fmtNumber(Math.round(Number(v))),
          },
          x: {
            title: false,
            labelFormatter: (v: number) => `${Math.round(Number(v))}h`,
            labelAutoHide: false,
            labelAutoRotate: false,
          },
        }}
        tooltip={{
          title: (d: { hour: number }) => `Sau ${Math.round(d.hour)} giờ`,
          items: [{ channel: "y", valueFormatter: (v: number) => fmtNumber(Math.round(Number(v))) }],
        }}
        interaction={{ tooltip: { shared: true } }}
        legend={{ color: { position: "top" } }}
        height={260}
      />
      <ul className="flex flex-col gap-1.5">
        {videos.map((video) => (
          <li key={video.video_id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12.5px]">
            <span className="font-medium text-[var(--ink)]">
              {video.author ? `@${video.author}` : video.video_id}
            </span>
            {video.desc ? (
              <a
                href={video.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 break-words text-[var(--muted)] hover:text-[var(--accent)]"
              >
                {video.desc}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(OmarTrendingChart);
