"use client";

import {
  CommentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  PlaySquareOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Badge, Button, Layout, Menu, Tag, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Logo from "@/components/Logo";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import AlertsBell from "@/components/AlertsBell";
import ThemeToggle from "@/components/ThemeToggle";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useJobsSnapshot, type JobsPollMode } from "@/hooks/useJobs";
import { prefetchSettings } from "@/hooks/useSettings";
import { useRefreshStatsOnJobFinish } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import { logout } from "@/lib/auth";

const { Header, Sider, Content } = Layout;

const SIDER_WIDTH = 232;

type NavItem = {
  key: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: ReactNode;
  section: "ops" | "data" | "system";
};

const NAV_ITEMS: NavItem[] = [
  { key: "/", labelKey: "navOverview", descKey: "overviewPageDesc", icon: <DashboardOutlined />, section: "ops" },
  { key: "/jobs", labelKey: "navJobs", descKey: "jobsPageLead", icon: <ThunderboltOutlined />, section: "ops" },
  { key: "/posts", labelKey: "navPosts", descKey: "postsPageDesc", icon: <UnorderedListOutlined />, section: "data" },
  { key: "/comments", labelKey: "navComments", descKey: "commentsPageDesc", icon: <CommentOutlined />, section: "data" },
  { key: "/movies", labelKey: "navMovies", descKey: "moviesDesc", icon: <PlaySquareOutlined />, section: "data" },
  { key: "/logs", labelKey: "navLogs", descKey: "logsPageDesc", icon: <FileTextOutlined />, section: "system" },
  { key: "/settings", labelKey: "navSettings", descKey: "settingsPageDesc", icon: <SettingOutlined />, section: "system" },
];

function pathToKey(pathname: string): string {
  const match = NAV_ITEMS.find((item) => item.key !== "/" && pathname.startsWith(item.key));
  return match?.key ?? "/";
}

/**
 * Chip trạng thái của header: lỗi/cảnh báo thu thập + hàng đợi đang chạy.
 *
 * Tách riêng thành component vì nó xuất hiện ở hai chỗ: cạnh tiêu đề
 * (desktop) và ở hàng riêng có cuộn ngang (mobile).
 */
function StatusChips({
  errorCount,
  warningCount,
  liveCount,
  runningLabel,
}: {
  errorCount: number;
  warningCount: number;
  liveCount: number;
  runningLabel: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      {errorCount > 0 && (
        <Tag
          color="error"
          className="status-chip !mr-0 shrink-0 cursor-pointer"
          onClick={() => router.push("/logs?log=spider-hub&level=error")}
        >
          {t("crawlIssueErrors", { n: errorCount })}
        </Tag>
      )}
      {errorCount === 0 && warningCount > 0 && (
        <Tag
          color="warning"
          className="status-chip !mr-0 shrink-0 cursor-pointer"
          onClick={() => router.push("/logs?log=spider-hub")}
        >
          {t("crawlIssueWarnings", { n: warningCount })}
        </Tag>
      )}
      {liveCount > 0 && (
        <button type="button" className="queue-live-chip shrink-0" onClick={() => router.push("/jobs")}>
          <span className="queue-live-dot" aria-hidden />
          <span className="queue-live-count">{liveCount}</span>
          <span className="queue-live-status">{t("crawlQueueLive")}</span>
          {runningLabel ? (
            <>
              <span className="queue-live-sep" aria-hidden />
              <span className="queue-live-job" title={runningLabel}>
                {runningLabel}
              </span>
            </>
          ) : null}
        </button>
      )}
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const selected = pathToKey(pathname);

  const jobsMode: JobsPollMode = selected === "/" || selected === "/jobs" ? "live" : "slow";
  const { data: jobs } = useJobsSnapshot(jobsMode);
  const { health } = useCrawlHealth(true);

  const liveCount = (jobs?.running.length ?? 0) + (jobs?.queued.length ?? 0);
  const queryClient = useQueryClient();
  const latestFinished = jobs?.history[0];
  useRefreshStatsOnJobFinish(
    latestFinished ? `${latestFinished.id}:${latestFinished.finished_at ?? ""}` : undefined,
  );

  // Once the current page has settled, quietly load Settings' data too.
  useEffect(() => {
    const run = () => prefetchSettings(queryClient);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 2000);
    return () => window.clearTimeout(id);
  }, [queryClient]);
  const runningLabel = jobs?.running[0]?.label || jobs?.queued[0]?.label || "";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (renderedPathname !== pathname) {
    setRenderedPathname(pathname);
    setMobileOpen(false);
  }

  const activeNavItem = NAV_ITEMS.find((item) => item.key === selected) ?? NAV_ITEMS[0];

  const menuItems = useMemo(() => {
    const sections: { id: NavItem["section"]; labelKey: TranslationKey }[] = [
      { id: "ops", labelKey: "navSectionOps" },
      { id: "data", labelKey: "navSectionData" },
      { id: "system", labelKey: "navSectionSystem" },
    ];

    return sections.flatMap((section) => {
      const rows = NAV_ITEMS.filter((item) => item.section === section.id);
      return [
        {
          type: "group" as const,
          key: `section-${section.id}`,
          label: <span className="nav-section-label !px-0 !pt-2 !pb-0">{t(section.labelKey)}</span>,
          children: rows.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: (
              <Link
                href={
                  item.key === "/logs" && health.errorCount > 0
                    ? "/logs?log=spider-hub&level=error"
                    : item.key
                }
                className="flex items-center justify-between gap-2"
              >
                <span>{t(item.labelKey)}</span>
                {item.key === "/logs" && health.errorCount > 0 ? (
                  <Badge size="small" count={health.errorCount} overflowCount={99} />
                ) : item.key === "/jobs" && liveCount > 0 ? (
                  <Badge size="small" count={liveCount} overflowCount={99} />
                ) : null}
              </Link>
            ),
          })),
        },
      ];
    });
  }, [t, health.errorCount, liveCount]);

  return (
    <Layout hasSider className="app-shell min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#161310]/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={SIDER_WIDTH}
        trigger={null}
        collapsed={collapsed && !mobileOpen}
        onBreakpoint={setCollapsed}
        className="app-sider"
        style={{
          position: "fixed",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          overflow: "auto",
          zIndex: 30,
        }}
      >
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden px-4 pb-5 pt-5">
            <div
              className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[var(--accent)]/25 blur-3xl animate-glow-pulse"
              aria-hidden
            />
            <div className="relative flex items-center gap-2.5">
              <Logo size={34} animate />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[14px] font-semibold tracking-tight text-white">Spider Hub</div>
                <div className="truncate text-[10px] font-semibold tracking-[0.12em] text-white/45 uppercase">
                  {t("appTagline")}
                </div>
              </div>
            </div>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selected]}
            className="!flex-1 !border-none !bg-transparent"
            items={menuItems}
          />
          <div className="px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-white/30 uppercase">
            Cinemark · {t("appTagline")}
          </div>
        </div>
      </Sider>
      <Layout
        style={{
          marginInlineStart: collapsed ? 0 : SIDER_WIDTH,
          transition: "margin-inline-start 0.2s",
        }}
      >
        <Header className="app-header sticky top-0 z-20 !px-3 sm:!px-7">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                {collapsed && (
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileOpen(true)}
                    className="!-ml-2 shrink-0"
                    aria-label={t("openNavigation")}
                  />
                )}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/16 text-[16px] text-[var(--accent-deep)]">
                  {activeNavItem.icon}
                </span>
                <div className="min-w-0">
                  <Typography.Title level={4} className="!mb-0 truncate !font-semibold !tracking-tight">
                    {t(activeNavItem.labelKey)}
                  </Typography.Title>
                  <p className="m-0 hidden max-w-xl truncate text-[12px] text-[var(--muted)] sm:block">
                    {t(activeNavItem.descKey)}
                  </p>
                </div>
              </div>
              {/* Chip trạng thái. Trên desktop nó nằm cùng hàng với tiêu đề;
                  trên mobile nó xuống hàng riêng có cuộn ngang - nếu để
                  chung hàng, chip hàng đợi sống bị đẩy ra ngoài màn hình
                  và nhãn của nó bị cắt. */}
              <div className="hidden min-w-0 shrink-0 items-center gap-2 lg:flex">
                <StatusChips
                  errorCount={health.errorCount}
                  warningCount={health.warningCount}
                  liveCount={liveCount}
                  runningLabel={runningLabel}
                />
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <AlertsBell />
                <ThemeToggle />
                <LocaleSwitcher variant="light" />
                <Button icon={<LogoutOutlined />} onClick={logout} className="!hidden sm:!inline-flex">
                  {t("navLogout")}
                </Button>
                <Button
                  icon={<LogoutOutlined />}
                  onClick={logout}
                  aria-label={t("navLogout")}
                  className="!px-2 sm:!hidden"
                />
              </div>
            </div>
            <div className="status-scroll mt-1.5 flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:hidden">
              <StatusChips
                errorCount={health.errorCount}
                warningCount={health.warningCount}
                liveCount={liveCount}
                runningLabel={runningLabel}
              />
            </div>
          </div>
        </Header>
        <Content className="page-canvas p-3 sm:p-5">
          <div key={pathname} className="relative z-[1] mx-auto max-w-[1600px] animate-fade-in-up">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
