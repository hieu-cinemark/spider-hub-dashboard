import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/auth/AuthGate";
import "./globals.css";
import Providers from "./providers";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spider Hub",
  description: "Crawl ops analytics for the spider-hub collection pipeline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${plexMono.variable} h-full antialiased`}>
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
