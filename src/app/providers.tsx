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
          colorPrimary: isDark ? "#2dd4bf" : "#0f766e",
          colorInfo: isDark ? "#5eead4" : "#0f766e",
          colorSuccess: "#047857",
          colorWarning: "#c2410c",
          colorError: "#e11d48",
          colorText: isDark ? "#f7f3ea" : "#10141c",
          colorTextSecondary: isDark ? "#c4b7a4" : "#2a3140",
          colorBorder: isDark ? "#3a342c" : "#c9bfb0",
          colorBgContainer: isDark ? "#171411" : "#fffcf7",
          colorBgLayout: isDark ? "#0c0b0a" : "#ebe6dc",
          colorBgElevated: isDark ? "#1f1b16" : "#fffcf7",
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
            fontWeight: 650,
            defaultColor: isDark ? "#f7f3ea" : "#10141c",
            defaultBorderColor: isDark ? "#5a5248" : "#9e9486",
          },
          Table: {
            borderRadiusLG: 14,
            headerBg: isDark ? "#12100c" : "#e0d8cc",
            headerColor: isDark ? "#c4b7a4" : "#2a3140",
            headerSplitColor: "transparent",
            cellPaddingBlock: 16,
            cellPaddingInline: 18,
            cellFontSize: 14,
            cellFontSizeMD: 14,
            cellFontSizeSM: 13,
            rowHoverBg: isDark ? "#1f1b16" : "#f4f1ea",
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
            itemColor: isDark ? "#e4d9c8" : "#2a3140",
            itemSelectedColor: isDark ? "#042f2e" : "#ffffff",
            itemHoverColor: isDark ? "#5eead4" : "#0f766e",
          },
          Menu: {
            itemMarginBlock: 4,
            itemMarginInline: 10,
            itemBorderRadius: 10,
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(20, 184, 166, 0.32)",
            darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
            darkItemColor: "rgba(255,255,255,0.88)",
            darkItemSelectedColor: "#fff",
          },
          Alert: {
            borderRadiusLG: 14,
          },
          Tag: {
            borderRadiusSM: 999,
            defaultBg: isDark ? "#2a241c" : "#efe8dc",
            defaultColor: isDark ? "#f7f3ea" : "#10141c",
          },
          Badge: {
            colorBgContainer: isDark ? "#171411" : "#fffcf7",
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
