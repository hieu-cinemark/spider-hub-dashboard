"use client";

import type { ReactNode } from "react";

/**
 * The pill-shaped filter chip used by every filter row in the app
 * (platform, sentiment, view mode, ...).
 *
 * Why a dedicated component: a plain antd `Button` renders its icon in the
 * button's own colour, so every filter icon looked like the same grey blob.
 * Here the icon sits in its own tinted round square - the platform's brand
 * colour for platform chips, an accent tint for the rest - which makes the
 * filter row readable at a glance and gives the row some colour without
 * turning it into a toy.
 *
 * The chip has two visual states:
 *   - inactive: transparent surface, hairline border, muted label, tinted icon
 *   - active:   accent-tinted surface, accent border, strong label, solid icon
 */
export default function FilterChip({
  active,
  icon,
  label,
  count,
  onClick,
  accent = "var(--accent)",
  title,
}: {
  active: boolean;
  icon?: ReactNode;
  label: ReactNode;
  count?: number | string;
  onClick: () => void;
  /** The tint of the icon badge. Defaults to the app accent. */
  accent?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={[
        "group inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pr-3 pl-1.5 text-[13px] font-semibold",
        "transition-[background,border-color,color,box-shadow] duration-150",
        active
          ? "border-transparent text-[var(--ink)] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
          : "border-[var(--line)] bg-[var(--card)] text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
      ].join(" ")}
      style={
        active
          ? {
              background: `color-mix(in srgb, ${accent} 16%, var(--card))`,
              borderColor: `color-mix(in srgb, ${accent} 42%, transparent)`,
            }
          : undefined
      }
    >
      {icon ? (
        <span
          className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[12px] transition-transform duration-150 group-hover:scale-105"
          style={{
            background: `color-mix(in srgb, ${accent} ${active ? "26%" : "16%"}, transparent)`,
            color: accent,
          }}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
      {count !== undefined && count !== null ? (
        <span
          className="rounded-full px-1.5 text-[11px] font-bold tabular-nums"
          style={{
            background: active
              ? `color-mix(in srgb, ${accent} 24%, transparent)`
              : "color-mix(in srgb, var(--muted) 14%, transparent)",
            color: active ? accent : "var(--muted)",
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
