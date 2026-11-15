"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import DashboardCard from "@/components/DashboardCard";
import { SkelBlock } from "@/components/PageSkeleton";

/**
 * The one KPI card.
 *
 * Every number in the app that deserves its own tile uses this component, so
 * the four Overview KPIs, the Queue KPIs and the Logs KPIs are visually
 * identical: same height, same type scale, same label position.
 *
 * Colour is semantic only - a neutral accent for the normal case, and
 * warning/danger reserved for a metric that is actually off. Numbers should
 * never compete with the error banner for attention.
 */
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
  const accent =
    tone === "danger" ? "var(--danger)" : tone === "warning" ? "var(--warn)" : (color ?? "var(--accent)");

  const card = (
    <DashboardCard className={`h-full w-full ${href ? "cursor-pointer" : ""}`}>
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <span className="micro-label truncate-1" title={title}>
            {title}
          </span>
          {icon ? (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px]"
              style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
              aria-hidden
            >
              {icon}
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          {loading ? (
            <>
              <SkelBlock className="h-7 w-24" />
              <SkelBlock className="mt-2 h-3 w-16" />
            </>
          ) : (
            <>
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span
                  className="text-[26px] leading-none font-semibold tracking-tight tabular-nums"
                  style={{ color: tone ? accent : "var(--ink)" }}
                >
                  {typeof value === "number" ? value.toLocaleString() : value}
                </span>
                {suffix ? (
                  <span className="text-[13px] font-medium text-[var(--muted)]">{suffix}</span>
                ) : null}
              </div>
              {delta ? <div className="mt-2">{delta}</div> : null}
              {hint ? (
                <div
                  className={`mt-1 text-[11.5px] leading-snug ${
                    tone === "danger"
                      ? "text-[var(--danger)]"
                      : tone === "warning"
                        ? "text-[var(--warn)]"
                        : "text-[var(--muted)]"
                  }`}
                >
                  {hint}
                </div>
              ) : null}
            </>
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
