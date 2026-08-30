"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import { useState, type ReactNode } from "react";
import { LocaleProvider } from "@/i18n/LocaleProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#2f54eb",
            borderRadius: 8,
            fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
          },
          components: {
            Card: {
              borderRadiusLG: 12,
              boxShadowTertiary: "0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 6px -1px rgba(0,0,0,0.03)",
            },
            Button: {
              borderRadius: 8,
            },
            Table: {
              borderRadiusLG: 10,
              headerBg: "#fafafa",
              headerColor: "#8c8c8c",
              headerSplitColor: "transparent",
              cellPaddingBlock: 12,
              rowHoverBg: "#f5f7ff",
            },
            Menu: {
              // Spaces the dark Sider's nav items out into distinct rounded
              // pills (itemBorderRadius already inherits the global 8px)
              // instead of the cramped default of touching, full-width rows.
              itemMarginBlock: 4,
              itemMarginInline: 12,
              darkItemBg: "transparent",
            },
          },
        }}
      >
        <AntApp>
          <LocaleProvider>{children}</LocaleProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
