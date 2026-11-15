"use client";

import { Drawer } from "antd";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";

/**
 * The app's one detail drawer.
 *
 * Long values that do not belong in a table cell (synopses, full cast lists,
 * stack traces, raw JSON, cookies) live here instead - the table stays
 * scannable, and nothing is lost: every value is still reachable, just one
 * click away.
 *
 * On a phone the drawer takes the full screen width: a 560px panel on a
 * 390px screen would either overflow or squeeze every value into a sliver.
 */
export default function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  extra,
  width = 520,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  width?: number | string;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      // antd 6 renamed Drawer's `width` to `size` - `width` still works but
      // logs a deprecation warning on every open.
      size={isMobile ? "100%" : width}
      title={
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold text-[var(--ink)]">{title}</span>
          {subtitle ? (
            <span className="truncate text-[12.5px] font-normal text-[var(--muted)]">{subtitle}</span>
          ) : null}
        </div>
      }
      extra={extra}
      styles={{ body: { paddingTop: 18 } }}
    >
      {children}
    </Drawer>
  );
}
