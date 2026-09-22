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
import { useMemo, useState, type ReactNode } from "react";
import Logo from "@/components/Logo";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useCrawlHealth } from "@/hooks/useCrawlHealth";
import { useJobsSnapshot, type JobsPollMode } from "@/hooks/useJobs";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import { logout } from "@/lib/auth";

const { Header, Sider, Content } = Layout;

const SIDER_WIDTH = 244;

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

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const selected = pathToKey(pathname);

  const jobsMode: JobsPollMode = selected === "/" || selected === "/jobs" ? "live" : "slow";
  const { data: jobs } = useJobsSnapshot(jobsMode);
  const { health } = useCrawlHealth(true);

  const liveCount = (jobs?.running.length ?? 0) + (jobs?.queued.length ?? 0);
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
            icon:
              item.key === "/logs" && health.errorCount > 0 ? (
                <Badge size="small" count={health.errorCount} overflowCount={99} offset={[6, 0]}>
                  {item.icon}
                </Badge>
              ) : item.key === "/jobs" && liveCount > 0 ? (
                <Badge size="small" count={liveCount} overflowCount={99} offset={[6, 0]}>
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              ),
            label: (
              <Link
                href={
                  item.key === "/logs" && health.errorCount > 0
                    ? "/logs?log=spider-hub&level=error"
                    : item.key
                }
              >
                {t(item.labelKey)}
              </Link>
            ),
          })),
        },
      ];
    });
  }, [t, health.errorCount, liveCount]);

  return (
    <Layout hasSider className="min-h-screen">
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
          <div className="relative overflow-hidden px-5 pb-6 pt-6">
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-teal-400/25 blur-2xl animate-glow-pulse"
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <Logo size={38} animate />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-semibold tracking-tight text-white">Spider Hub</div>
                <div className="truncate text-[11px] tracking-wide text-white/70 uppercase">{t("appTagline")}</div>
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
          <div className="px-5 py-4 text-[11px] tracking-wide text-white/50">Cinemark · crawl ops</div>
        </div>
      </Sider>
      <Layout
        style={{
          marginInlineStart: collapsed ? 0 : SIDER_WIDTH,
          transition: "margin-inline-start 0.2s",
        }}
      >
        <Header className="app-header sticky top-0 z-20 flex items-center justify-between !px-4 sm:!px-7">
          <div className="flex min-w-0 items-center gap-3">
            {collapsed && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileOpen(true)}
                className="!-ml-2 shrink-0"
                aria-label={t("openNavigation")}
              />
            )}
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/22 text-lg text-[var(--accent-deep)]">
              {activeNavItem.icon}
            </span>
            <div className="min-w-0">
              <Typography.Title level={4} className="!mb-0 truncate !font-semibold !tracking-tight">
                {t(activeNavItem.labelKey)}
              </Typography.Title>
              <p className="m-0 hidden max-w-xl truncate text-[13px] text-[var(--ink-soft)] sm:block">
                {t(activeNavItem.descKey)}
              </p>
            </div>
            {health.errorCount > 0 && (
              <Tag
                color="error"
                className="status-chip !mr-0 cursor-pointer"
                onClick={() => router.push("/logs?log=spider-hub&level=error")}
              >
                {t("crawlIssueErrors", { n: health.errorCount })}
              </Tag>
            )}
            {health.errorCount === 0 && health.warningCount > 0 && (
              <Tag
                color="warning"
                className="status-chip !mr-0 cursor-pointer"
                onClick={() => router.push("/logs?log=spider-hub")}
              >
                {t("crawlIssueWarnings", { n: health.warningCount })}
              </Tag>
            )}
            {liveCount > 0 && (
              <button type="button" className="queue-live-chip" onClick={() => router.push("/jobs")}>
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
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LocaleSwitcher variant="light" />
            <Button icon={<LogoutOutlined />} onClick={logout}>
              {t("navLogout")}
            </Button>
          </div>
        </Header>
        <Content className="page-canvas p-4 sm:p-8">
          <div key={pathname} className="mx-auto max-w-[1520px] animate-fade-in-up">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
