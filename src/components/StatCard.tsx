"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import DashboardCard from "@/components/DashboardCard";
import { SkelBlock } from "@/components/PageSkeleton";

// Mặc định một màu duy nhất (--accent) cho mọi KPI: số liệu thường không
// được "cạnh tranh" với cảnh báo lỗi. Chỉ đổi sang --warn / --danger khi
// chính chỉ số đó vượt ngưỡng (qua `tone`). Màu theo nền tảng chỉ dùng cho
// biểu đồ và PlatformBadge, không dùng cho KPI.
const DEFAULT_ACCENT = "var(--accent)";

export default function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
  loading,
  tone,
  delta,
  hint,
  href,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
  tone?: "danger" | "warning";
  delta?: ReactNode;
  hint?: ReactNode;
  href?: string;
}) {
  const iconColor = color ?? DEFAULT_ACCENT;
  const accent = tone === "danger" ? "var(--danger)" : tone === "warning" ? "var(--warn)" : iconColor;
  const ring =
    tone === "danger"
      ? "!border-rose-300 dark:!border-rose-900/70"
      : tone === "warning"
        ? "!border-amber-300 dark:!border-amber-900/70"
        : "";

  const card = (
    <DashboardCard
      className={`h-full w-full transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--accent)] ${ring} ${href ? "cursor-pointer" : ""}`}
    >
      <div className="relative overflow-hidden">
        {/* A soft wash of the card's own accent in the top-right corner - the
            same trick the reference console uses to keep flat panels alive. */}
        <span
          className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div
            className="flex min-w-0 flex-1 flex-col gap-1.5 border-l-2 pl-2.5"
            style={{ borderColor: accent }}
          >
            <span className="micro-label !text-[var(--ink-soft)]">{title}</span>
            {loading ? (
              <>
                <SkelBlock className="h-7 w-28" />
                <SkelBlock className="h-3 w-20" />
              </>
            ) : (
              <>
                <span
                  className="text-[26px] leading-none font-semibold tracking-tight"
                  style={{ color: tone ? accent : "var(--accent)" }}
                >
                  {typeof value === "number" ? value.toLocaleString() : value}
                  {suffix && <span className="ml-1 text-base font-medium text-[var(--muted)]">{suffix}</span>}
                </span>
                {delta && <div className="text-xs">{delta}</div>}
                {hint && (
                  <div
                    className={`text-[11px] font-semibold leading-snug ${
                      tone === "danger"
                        ? "text-[var(--danger)]"
                        : tone === "warning"
                          ? "text-[var(--warn)]"
                          : "text-[var(--muted)]"
                    }`}
                  >
                    {hint}
                  </div>
                )}
              </>
            )}
          </div>
          {icon && (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[15px]"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`,
                color: accent,
              }}
            >
              {icon}
            </span>
          )}
        </div>
      </div>
    </DashboardCard>
  );

  if (!href || loading) return card;
  return (
    <Link href={href} className="block h-full text-inherit no-underline">
      {card}
    </Link>
  );
}
