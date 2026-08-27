"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import { useState, type ReactNode } from "react";

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
          },
        }}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
