"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd";
import { useState, type ReactNode } from "react";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { ThemeProvider, useColorTheme } from "@/theme/ThemeProvider";

const { defaultAlgorithm, darkAlgorithm } = antdTheme;

function ThemedApp({ children }: { children: ReactNode }) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: isDark ? "#2dd4bf" : "#0d9488",
          colorInfo: isDark ? "#38bdf8" : "#0284c7",
          colorSuccess: "#059669",
          colorWarning: "#d97706",
          colorError: "#e11d48",
          colorText: isDark ? "#f1f5f9" : "#0f172a",
          colorTextSecondary: isDark ? "#94a3b8" : "#475569",
          colorBorder: isDark ? "#243044" : "#d8dee8",
          colorBgContainer: isDark ? "#121a2b" : "#ffffff",
          colorBgLayout: isDark ? "#0b1220" : "#eef2f6",
          colorBgElevated: isDark ? "#182236" : "#ffffff",
          borderRadius: 12,
          fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
          controlHeight: 36,
        },
        components: {
          Card: {
            borderRadiusLG: 16,
            headerFontSize: 15,
            headerHeight: 52,
          },
          Button: {
            borderRadius: 10,
            fontWeight: 550,
          },
          Table: {
            borderRadiusLG: 14,
            headerBg: isDark ? "#0f172a" : "#eef2f6",
            headerColor: isDark ? "#94a3b8" : "#64748b",
            headerSplitColor: "transparent",
            cellPaddingBlock: 16,
            cellPaddingInline: 18,
            cellFontSize: 14,
            cellFontSizeMD: 14,
            cellFontSizeSM: 13,
            rowHoverBg: isDark ? "#182236" : "#f0fdfa",
          },
          Modal: {
            titleFontSize: 17,
            borderRadiusLG: 16,
            paddingMD: 24,
            paddingContentHorizontalLG: 24,
          },
          Form: {
            itemMarginBottom: 18,
            verticalLabelPadding: "0 0 6px",
          },
          List: {
            itemPadding: "12px 0",
            metaMarginBottom: 6,
          },
          Tabs: {
            titleFontSize: 14,
            horizontalItemGutter: 28,
            inkBarColor: isDark ? "#2dd4bf" : "#0d9488",
            itemSelectedColor: isDark ? "#5eead4" : "#0f766e",
            itemHoverColor: isDark ? "#2dd4bf" : "#0d9488",
          },
          Menu: {
            itemMarginBlock: 4,
            itemMarginInline: 10,
            itemBorderRadius: 10,
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(13, 148, 136, 0.38)",
            darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
            darkItemColor: "rgba(255,255,255,0.72)",
            darkItemSelectedColor: "#fff",
          },
          Alert: {
            borderRadiusLG: 14,
          },
          Tag: {
            borderRadiusSM: 8,
          },
          Input: {
            borderRadius: 10,
          },
          Select: {
            borderRadius: 10,
          },
        },
      }}
    >
      <AntApp>
        <LocaleProvider>{children}</LocaleProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedApp>{children}</ThemedApp>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
