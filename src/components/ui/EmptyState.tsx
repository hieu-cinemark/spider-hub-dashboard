"use client";

import { Empty, Skeleton } from "antd";
import type { ReactNode } from "react";

/** A consistent empty state: one message, no decoration. */
export default function EmptyState({
  description,
  action,
  compact = false,
}: {
  description: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${compact ? "py-6" : "py-12"}`}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
      {action}
    </div>
  );
}

/** The app's single loading placeholder - no spinner, no layout jump. */
export function LoadingState({ rows = 4, height = 40 }: { rows?: number; height?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skel-block"
          style={{ height, opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

/** A consistent error state with an optional retry. */
export function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="m-0 max-w-md text-sm text-[var(--danger)]">{message}</p>
      {onRetry && retryLabel ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/** A compact placeholder for a chart card while its data loads. */
export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="flex w-full flex-col justify-end gap-2" style={{ height }} aria-busy="true">
      <Skeleton active paragraph={{ rows: 0 }} title={false} />
      <div className="skel-block w-full" style={{ height: height - 40, borderRadius: 8 }} />
    </div>
  );
}
