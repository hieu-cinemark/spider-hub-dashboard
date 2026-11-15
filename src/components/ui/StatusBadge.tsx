"use client";

import {
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  MinusCircleFilled,
  SyncOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import type { ReactNode } from "react";

export type StatusTone = "ok" | "warning" | "danger" | "info" | "neutral" | "running";

const TONE_STYLE: Record<StatusTone, { color: string; background: string; border: string }> = {
  ok: {
    color: "var(--ok)",
    background: "color-mix(in srgb, var(--ok) 12%, transparent)",
    border: "color-mix(in srgb, var(--ok) 30%, transparent)",
  },
  warning: {
    color: "var(--warn)",
    background: "color-mix(in srgb, var(--warn) 13%, transparent)",
    border: "color-mix(in srgb, var(--warn) 32%, transparent)",
  },
  danger: {
    color: "var(--danger)",
    background: "color-mix(in srgb, var(--danger) 13%, transparent)",
    border: "color-mix(in srgb, var(--danger) 32%, transparent)",
  },
  info: {
    color: "var(--accent-deep)",
    background: "color-mix(in srgb, var(--accent) 13%, transparent)",
    border: "color-mix(in srgb, var(--accent) 32%, transparent)",
  },
  running: {
    color: "var(--accent-deep)",
    background: "color-mix(in srgb, var(--accent) 13%, transparent)",
    border: "color-mix(in srgb, var(--accent) 32%, transparent)",
  },
  neutral: {
    color: "var(--muted)",
    background: "color-mix(in srgb, var(--muted) 12%, transparent)",
    border: "color-mix(in srgb, var(--muted) 26%, transparent)",
  },
};

function toneIcon(tone: StatusTone): ReactNode {
  switch (tone) {
    case "ok":
      return <CheckCircleFilled />;
    case "warning":
      return <ExclamationCircleFilled />;
    case "danger":
      return <ExclamationCircleFilled />;
    case "running":
      return <SyncOutlined spin />;
    case "info":
      return <InfoCircleFilled />;
    default:
      return <MinusCircleFilled />;
  }
}

/**
 * The one status pill.
 *
 * Semantic colors are used sparingly across the whole app: a row is either
 * healthy, degraded or broken, and this is the only shape that says so.
 */
export default function StatusBadge({
  tone = "neutral",
  children,
  icon,
  title,
  className = "",
}: {
  tone?: StatusTone;
  children: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
  className?: string;
}) {
  const style = TONE_STYLE[tone];
  const body = (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11.5px] font-semibold leading-none whitespace-nowrap ${className}`}
      style={{ color: style.color, background: style.background, borderColor: style.border }}
    >
      <span className="text-[11px]">{icon ?? toneIcon(tone)}</span>
      <span className="truncate-1">{children}</span>
    </span>
  );
  return title ? <Tooltip title={title}>{body}</Tooltip> : body;
}

/** A dot + label pair - the lightest possible status indicator. */
export function StatusDot({
  tone = "neutral",
  children,
  title,
}: {
  tone?: StatusTone;
  children: ReactNode;
  title?: ReactNode;
}) {
  const style = TONE_STYLE[tone];
  const body = (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12.5px]" style={{ color: style.color }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: style.color }} aria-hidden />
      <span className="truncate-1">{children}</span>
    </span>
  );
  return title ? <Tooltip title={title}>{body}</Tooltip> : body;
}

/** A "last seen" style timestamp - the clock glyph is the same everywhere. */
export function TimeMeta({ children, title }: { children: ReactNode; title?: ReactNode }) {
  const body = (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
      <ClockCircleFilled className="shrink-0 text-[11px]" aria-hidden />
      <span className="truncate-1">{children}</span>
    </span>
  );
  return title ? <Tooltip title={title}>{body}</Tooltip> : body;
}

/**
 * Maps an antd tag colour (which the pool/status helpers already return)
 * onto this app's status tones, so a badge built here and a badge built
 * from a Tag never disagree.
 */
export function toneFromTagColor(color: string | undefined): StatusTone {
  switch (color) {
    case "error":
    case "red":
    case "volcano":
    case "magenta":
      return "danger";
    case "warning":
    case "gold":
    case "orange":
      return "warning";
    case "success":
    case "green":
      return "ok";
    case "processing":
    case "blue":
    case "cyan":
      return "info";
    default:
      return "neutral";
  }
}
