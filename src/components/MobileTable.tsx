"use client";

import { Button, Checkbox, Pagination } from "antd";
import type { ReactNode } from "react";
import type { ColumnType } from "antd/es/table";

/**
 * A table column that also knows how to present itself on a phone.
 *
 * `mobileHidden` drops the column from the card layout entirely (use it for
 * columns whose value is already visible elsewhere in the card, or for
 * action buttons that the card renders in its own header slot).
 * `mobilePrimary` promotes the column to the card's title row.
 */
export type ResponsiveColumnType<T> = ColumnType<T> & {
  mobileHidden?: boolean;
  mobilePrimary?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumn = ResponsiveColumnType<any> & {
  key?: React.Key;
  dataIndex?: string | number | (string | number)[];
};

/**
 * Renders an antd table's rows as a stack of cards.
 *
 * Why a generic renderer instead of a hand-written card per table: the
 * dashboard has ~15 tables, and every one of them was either showing a
 * "..." ellipsis on desktop or losing columns on mobile. Feeding the same
 * `columns` definition to both layouts guarantees the phone shows exactly
 * the same fields as the desktop table - nothing is dropped, nothing is
 * truncated, and a new column added to a table shows up on mobile for free.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MobileTable<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey,
  loading,
  empty,
  pagination,
  title,
  rowSelection,
  loadMore,
}: {
  columns: ResponsiveColumnType<T>[];
  dataSource: T[];
  rowKey: string | ((record: T) => string | number);
  loading?: boolean;
  empty?: ReactNode;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
    showTotal?: (total: number) => string;
  };
  title?: (record: T) => ReactNode;
  rowSelection?: {
    selectedRowKeys: (string | number)[];
    onChange: (keys: (string | number)[]) => void;
    /**
     * The id used for the checkbox state. Defaults to the row key, but a
     * table can have a string row key (antd's `id`) while its selection
     * logic works on a numeric id - see AccountsTable.
     */
    selectionKey?: (record: T) => string | number;
  };
  /**
   * "Load more", for keyset-paginated server data (posts/comments) - the
   * mobile list appends the next chunk instead of paging.
   */
  loadMore?: {
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
    label: string;
  };
}) {
  const rows = dataSource ?? [];
  const keyOf = (record: T, index: number): string =>
    typeof rowKey === "function" ? String(rowKey(record)) : String(record[rowKey] ?? index);

  const visible = (columns ?? []).filter((c) => !(c as AnyColumn).mobileHidden);

  if (loading && !rows.length) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[12px] border border-[var(--line)] bg-[var(--card)] p-3.5">
            <div className="skel-block mb-3 h-4 w-2/5" />
            <div className="skel-block h-3 w-full" />
            <div className="skel-block mt-2 h-3 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="py-8">{empty}</div>;
  }

  const pageRows = pagination
    ? rows.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize)
    : rows;

  return (
    <div className="flex flex-col gap-2.5">
      {pageRows.map((record, index) => {
        const primary = visible.find((c) => (c as AnyColumn).mobilePrimary);
        const primaryValue = primary ? renderCell(primary, record, index) : null;
        const rest = visible.filter((c) => c !== primary);
        const recordKey = keyOf(record, index);
        const selectionId = rowSelection?.selectionKey ? rowSelection.selectionKey(record) : recordKey;
        const selected = rowSelection ? rowSelection.selectedRowKeys.includes(selectionId) : false;
        const toggle = (checked: boolean) => {
          if (!rowSelection) return;
          const next = checked
            ? [...rowSelection.selectedRowKeys, selectionId]
            : rowSelection.selectedRowKeys.filter((k) => k !== selectionId);
          rowSelection.onChange(next);
        };

        return (
          <div
            key={recordKey}
            className={`rounded-[12px] border bg-[var(--card)] p-3.5 ${
              selected ? "border-[var(--accent)]" : "border-[var(--line)]"
            }`}
          >
            {primary ? (
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  {rowSelection ? (
                    <Checkbox className="mt-0.5 shrink-0" checked={selected} onChange={(e) => toggle(e.target.checked)} />
                  ) : null}
                  <div className="min-w-0 text-[13.5px] font-semibold leading-snug break-words text-[var(--ink)]">
                    {primaryValue}
                  </div>
                </div>
                {title?.(record)}
              </div>
            ) : null}
            <dl className="flex flex-col gap-1.5">
              {rest.map((column, colIndex) => {
                const label = typeof column.title === "string" ? column.title : null;
                const value = renderCell(column, record, index);
                if (value === null || value === undefined || value === "") return null;
                return (
                  <div key={colIndex} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {label ? <dt className="micro-label shrink-0 text-[var(--muted)]">{label}</dt> : null}
                    <dd className="min-w-0 flex-1 text-[12.5px] leading-relaxed break-words text-[var(--ink)]">
                      {value}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {rowSelection && !primary ? (
              <div className="mt-2">
                <Checkbox checked={selected} onChange={(e) => toggle(e.target.checked)} />
              </div>
            ) : null}
          </div>
        );
      })}
      {loadMore?.hasMore ? (
        <div className="flex justify-center pt-1">
          <Button loading={loadMore.loading} onClick={loadMore.onLoadMore} size="small">
            {loadMore.label}
          </Button>
        </div>
      ) : null}
      {pagination && pagination.total > pagination.pageSize ? (
        <div className="flex justify-end pt-1">
          <Pagination
            size="small"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onChange}
            showTotal={pagination.showTotal}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Runs a column's own `render` so the card shows exactly what the table
 * cell would show (badges, avatars, tags, buttons) - not a raw field value.
 */
function renderCell(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: ResponsiveColumnType<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any,
  index: number,
): ReactNode {
  const col = column as AnyColumn;
  const raw =
    col.dataIndex === undefined
      ? undefined
      : Array.isArray(col.dataIndex)
        ? col.dataIndex.map((k) => record[k as string]).join(" ")
        : record[col.dataIndex as string];

  if (typeof col.render === "function") {
    const rendered = col.render(raw, record, index);
    // antd's `render` may return a `RenderedCell` ({ props, children }) - the
    // table wrapper understands it, a plain <dd> does not.
    if (rendered && typeof rendered === "object" && "props" in rendered && "children" in rendered) {
      return (rendered as { children?: ReactNode }).children ?? null;
    }
    return rendered as ReactNode;
  }
  if (raw === null || raw === undefined || raw === "") return null;
  return String(raw);
}
