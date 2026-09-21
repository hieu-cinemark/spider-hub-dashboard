"use client";

import { Grid } from "antd";

// Desktop-first: antd's first paint has an empty breakpoint map, so treat
// unknown as "table" instead of flashing card layout on large screens.
export function useMdUp() {
  const screens = Grid.useBreakpoint();
  return screens.md !== false;
}
