"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { registerSessionEndHandler } from "@/lib/auth";
import { ThemeProvider, useColorTheme } from "@/theme/ThemeProvider";

const { defaultAlgorithm, darkAlgorithm } = antdTheme;

// One token set per mode, kept in step with the CSS custom properties in
// globals.css. If you change a colour there, change it here too - the
// antd components (Table, Tabs, Modal) and the hand-rolled Tailwind classes
// have to agree, otherwise the two halves of a screen look like different
// products.
const DARK = {
  colorPrimary: "#3b82f6",
  colorInfo: "#60a5fa",
  colorSuccess: "#22c55e",
  colorWarning: "#f59e0b",
  colorError: "#ef4444",
  colorText: "#e8edf3",
  colorTextSecondary: "#9aa7b5",
  colorTextTertiary: "#667586",
  colorTextQuaternary: "#667586",
  colorBorder: "#28313d",
  colorBorderSecondary: "#222a35",
  colorBgContainer: "#141a22",
  colorBgElevated: "#1b222c",
  colorBgLayout: "#0b0f14",
  colorBgSpotlight: "#1b222c",
  colorFillQuaternary: "rgba(154, 167, 181, 0.10)",
} as const;

const LIGHT = {
  colorPrimary: "#2563eb",
  colorInfo: "#2563eb",
  colorSuccess: "#16a34a",
  colorWarning: "#d97706",
  colorError: "#dc2626",
  colorText: "#0f172a",
  colorTextSecondary: "#475569",
  colorTextTertiary: "#64748b",
  colorTextQuaternary: "#94a3b8",
  colorBorder: "#e2e6ec",
  colorBorderSecondary: "#eef1f5",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBgLayout: "#f4f6f9",
  colorBgSpotlight: "#1b222c",
  colorFillQuaternary: "rgba(15, 23, 42, 0.04)",
} as const;

function ThemedApp({ children }: { children: ReactNode }) {
  const { theme } = useColorTheme();
  const isDark = theme === "dark";
  const palette = isDark ? DARK : LIGHT;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
        token: {
          ...palette,
          borderRadius: 8,
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          controlHeight: 34,
          // Line, not shadow - elevation is expressed by surface steps.
          boxShadow: isDark
            ? "0 16px 40px -16px rgba(0, 0, 0, 0.7)"
            : "0 16px 40px -20px rgba(15, 23, 42, 0.28)",
          boxShadowSecondary: isDark
            ? "0 16px 40px -16px rgba(0, 0, 0, 0.7)"
            : "0 16px 40px -20px rgba(15, 23, 42, 0.28)",
        },
        components: {
          Card: {
            borderRadiusLG: 10,
            headerFontSize: 14,
            headerHeight: 48,
            colorBgContainer: palette.colorBgContainer,
          },
          Button: {
            borderRadius: 8,
            fontWeight: 600,
            defaultColor: palette.colorText,
            defaultBorderColor: isDark ? "#2e3846" : "#cbd3dd",
            primaryShadow: "none",
            defaultShadow: "none",
            dangerShadow: "none",
          },
          Table: {
            borderRadiusLG: 10,
            headerBg: isDark ? "#111721" : "#f7f9fb",
            headerColor: palette.colorTextTertiary,
            headerSplitColor: "transparent",
            cellPaddingBlock: 10,
            cellPaddingInline: 14,
            cellFontSize: 14,
            cellFontSizeMD: 13.5,
            cellFontSizeSM: 13,
            rowHoverBg: isDark ? "#1a212b" : "#f4f7fb",
            borderColor: palette.colorBorder,
          },
          Modal: {
            titleFontSize: 17,
            borderRadiusLG: 12,
            paddingMD: 22,
            paddingContentHorizontalLG: 22,
          },
          Drawer: {
            paddingLG: 20,
          },
          Form: {
            itemMarginBottom: 16,
            verticalLabelPadding: "0 0 6px",
          },
          List: {
            itemPadding: "12px 0",
            metaMarginBottom: 6,
          },
          Tabs: {
            titleFontSize: 14,
            horizontalItemGutter: 26,
            inkBarColor: palette.colorPrimary,
            itemColor: palette.colorTextSecondary,
            itemSelectedColor: isDark ? "#0b0f14" : "#ffffff",
            itemHoverColor: palette.colorPrimary,
          },
          Menu: {
            itemMarginBlock: 2,
            itemMarginInline: 8,
            itemBorderRadius: 8,
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(59, 130, 246, 0.16)",
            darkItemHoverBg: "rgba(232, 237, 243, 0.06)",
            darkItemColor: "rgba(232, 237, 243, 0.72)",
            darkItemSelectedColor: "#e8edf3",
          },
          Alert: {
            borderRadiusLG: 10,
          },
          Tag: {
            borderRadiusSM: 6,
            defaultBg: isDark ? "#1b222c" : "#f1f5f9",
            defaultColor: palette.colorText,
          },
          Badge: {
            colorBgContainer: palette.colorBgContainer,
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
          Segmented: {
            itemSelectedBg: palette.colorPrimary,
            itemSelectedColor: "#ffffff",
            trackBg: isDark ? "#10151c" : "#eef1f5",
            itemColor: palette.colorTextSecondary,
            itemHoverColor: palette.colorPrimary,
          },
          Progress: {
            defaultColor: palette.colorPrimary,
          },
          Tooltip: {
            colorBgSpotlight: isDark ? "#1b222c" : "#1b222c",
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

  // The QueryClient lives above AuthGate, so nothing cleared it when the
  // session ended. Logging out has to drop the whole cache: it holds the
  // account credentials the modal fetched, plus every other panel's data
  // for a session that no longer exists - a second login in the same page
  // lifetime would otherwise be served the previous session's values from
  // cache (and React Query's normal `staleTime` would keep them "fresh").
  useEffect(() => {
    registerSessionEndHandler(() => {
      queryClient.cancelQueries();
      queryClient.clear();
    });
    return () => registerSessionEndHandler(null);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedApp>{children}</ThemedApp>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
