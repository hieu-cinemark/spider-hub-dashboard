import type { CSSProperties } from "react";

export function SkelBlock({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skel-block ${className ?? ""}`} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3 border-l-[3px] border-[var(--line)] pl-3">
          <SkelBlock className="h-3 w-24" />
          <SkelBlock className="h-8 w-28" />
          <SkelBlock className="h-3 w-20" />
        </div>
        <SkelBlock className="h-10 w-10 rounded-2xl" />
      </div>
    </div>
  );
}

export function ChartCardSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="mb-4 flex items-center gap-2.5">
        <SkelBlock className="h-8 w-8 rounded-xl" />
        <div className="flex flex-col gap-2">
          <SkelBlock className="h-3.5 w-36" />
          <SkelBlock className="h-2.5 w-48" />
        </div>
      </div>
      <SkelBlock className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)]">
      <SkelBlock className="h-10 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-[var(--line)] px-4 py-3">
          <SkelBlock className="h-6 w-6 shrink-0 rounded-lg" />
          <SkelBlock className="h-3 flex-1" />
          <SkelBlock className="h-3 w-24" />
          <SkelBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableCardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SkelBlock className="h-8 w-8 rounded-xl" />
          <SkelBlock className="h-3.5 w-40" />
        </div>
        <SkelBlock className="h-8 w-28 rounded-lg" />
      </div>
      <TableRowsSkeleton rows={rows} />
    </div>
  );
}

export function MobileCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <SkelBlock className="h-6 w-6 rounded-lg" />
            <SkelBlock className="h-3 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            <SkelBlock className="h-3 w-full" />
            <SkelBlock className="h-3 w-5/6" />
            <SkelBlock className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4">
        <SkelBlock className="h-8 w-20 rounded-lg" />
        <SkelBlock className="h-8 w-24 rounded-lg" />
        <SkelBlock className="h-8 w-24 rounded-lg" />
        <SkelBlock className="h-8 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <StatCardSkeleton />
        </div>
        <div className="xl:col-span-3">
          <StatCardSkeleton />
        </div>
        <div className="xl:col-span-2">
          <StatCardSkeleton />
        </div>
        <div className="xl:col-span-2">
          <StatCardSkeleton />
        </div>
        <div className="xl:col-span-2">
          <StatCardSkeleton />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartCardSkeleton />
        </div>
        <div className="lg:col-span-3">
          <ChartCardSkeleton />
        </div>
      </div>
      <TableCardSkeleton />
    </div>
  );
}
