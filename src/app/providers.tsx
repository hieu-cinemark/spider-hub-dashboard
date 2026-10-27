"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd";
import { useState, type ReactNode } from "react";
import SpiderWebBackdrop from "@/components/SpiderWebBackdrop";
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
          colorPrimary: isDark ? "#1076ae" : "#0d6e9e",
          colorInfo: isDark ? "#3aa6dc" : "#0d6e9e",
          colorSuccess: isDark ? "#35c08a" : "#0f8a5f",
          colorWarning: isDark ? "#f19542" : "#c2620a",
          colorError: isDark ? "#f2545b" : "#d92d3f",
          colorText: isDark ? "#eef1f6" : "#14161a",
          colorTextSecondary: isDark ? "#b3b9c5" : "#454b57",
          colorTextTertiary: isDark ? "#858a96" : "#6b7280",
          colorBorder: isDark ? "#2b2c33" : "#dde1e8",
          colorBorderSecondary: isDark ? "#242529" : "#e6e9ef",
          colorBgContainer: isDark ? "#1a1b20" : "#ffffff",
          colorBgLayout: isDark ? "#0c0d10" : "#f2f4f7",
          colorBgElevated: isDark ? "#222329" : "#ffffff",
          borderRadius: 10,
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          controlHeight: 34,
        },
        components: {
          Card: {
            borderRadiusLG: 14,
            headerFontSize: 14,
            headerHeight: 50,
            colorBgContainer: isDark ? "#1a1b20" : "#ffffff",
          },
          Button: {
            borderRadius: 9,
            fontWeight: 600,
            defaultColor: isDark ? "#eef1f6" : "#14161a",
            defaultBorderColor: isDark ? "#34353d" : "#c3c9d4",
            primaryShadow: "none",
          },
          Table: {
            borderRadiusLG: 12,
            headerBg: isDark ? "#141519" : "#eef1f6",
            headerColor: isDark ? "#858a96" : "#6b7280",
            headerSplitColor: "transparent",
            cellPaddingBlock: 14,
            cellPaddingInline: 16,
            cellFontSize: 14,
            cellFontSizeMD: 14,
            cellFontSizeSM: 13,
            rowHoverBg: isDark ? "#22242a" : "#f5f8fb",
          },
          Modal: {
            titleFontSize: 17,
            borderRadiusLG: 16,
            paddingMD: 22,
            paddingContentHorizontalLG: 22,
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
            inkBarColor: isDark ? "#1076ae" : "#0d6e9e",
            itemColor: isDark ? "#b3b9c5" : "#454b57",
            itemSelectedColor: isDark ? "#0c0d10" : "#ffffff",
            itemHoverColor: isDark ? "#3aa6dc" : "#0d6e9e",
          },
          Menu: {
            itemMarginBlock: 3,
            itemMarginInline: 8,
            itemBorderRadius: 9,
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(16, 118, 174, 0.34)",
            darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
            darkItemColor: "rgba(255,255,255,0.82)",
            darkItemSelectedColor: "#fff",
          },
          Alert: {
            borderRadiusLG: 12,
          },
          Tag: {
            borderRadiusSM: 999,
            defaultBg: isDark ? "#222329" : "#eef1f6",
            defaultColor: isDark ? "#eef1f6" : "#14161a",
          },
          Badge: {
            colorBgContainer: isDark ? "#1a1b20" : "#ffffff",
          },
          Input: {
            borderRadius: 9,
          },
          Select: {
            borderRadius: 9,
          },
          Segmented: {
            itemSelectedBg: isDark ? "#1076ae" : "#0d6e9e",
            itemSelectedColor: "#ffffff",
            trackBg: isDark ? "#141519" : "#e6e9ef",
            itemColor: isDark ? "#b3b9c5" : "#454b57",
            itemHoverColor: isDark ? "#3aa6dc" : "#0d6e9e",
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
        <SpiderWebBackdrop />
        <ThemedApp>{children}</ThemedApp>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
