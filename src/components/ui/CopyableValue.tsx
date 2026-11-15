"use client";

import { Tooltip } from "antd";
import type { ReactNode } from "react";

/**
 * A technical identifier shown in full length but visually truncated.
 *
 * The value is never hidden: the element carries the complete text (so
 * selecting and copying it still works, and screen readers read it out),
 * and the full value is one hover away in the tooltip.
 */
export default function CopyableValue({
  value,
  mono = true,
  className = "",
  maxWidth,
}: {
  value: string | number | null | undefined;
  mono?: boolean;
  className?: string;
  maxWidth?: number | string;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-[var(--muted)]">—</span>;
  }
  const text = String(value);
  return (
    <Tooltip title={text} styles={{ root: { maxWidth: 420 } }}>
      <span
        className={`truncate-1 ${mono ? "font-mono" : ""} ${className}`}
        style={maxWidth === undefined ? undefined : { maxWidth, display: "inline-block", verticalAlign: "bottom" }}
      >
        {text}
      </span>
    </Tooltip>
  );
}

/**
 * Label + value row used by every detail drawer.
 *
 * One definition, so the drawers across the app stay visually identical.
 */
export function DetailRow({
  label,
  children,
  mono = false,
}: {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={mono ? "detail-row-value detail-row-value-mono" : "detail-row-value"}>{children}</span>
    </div>
  );
}

export function DetailSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h4 className="detail-section-title">{title}</h4>
      <div className="detail-list">{children}</div>
    </section>
  );
}
