import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/auth/AuthGate";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Spider Hub",
  description: "Crawl ops analytics for the spider-hub collection pipeline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("spider-hub-dashboard.theme")==="dark"){document.documentElement.classList.add("dark");document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark"}}catch(e){}`,
          }}
        />
        <AntdRegistry>
          <Providers>
            <AuthGate>
              <AppShell>{children}</AppShell>
            </AuthGate>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
