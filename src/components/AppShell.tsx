"use client";

import {
  CommentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlaySquareOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Badge, Button, Dropdown, Layout, Menu, Tag } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
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

/**
 * Desktop sidebar width. The collapsed width is the icon rail.
 *
 * Both numbers live here and nowhere else - the sider itself and the
 * content offset that clears it are driven from this one place (the CSS
 * mirrors it in globals.css under `.app-content-offset`).
 */
const SIDER_WIDTH = 232;
const SIDER_COLLAPSED_WIDTH = 64;

const COLLAPSE_STORAGE_KEY = "spider-hub-dashboard.sidebar-collapsed";
/** Same-tab notification that the collapse preference changed. */
const COLLAPSE_EVENT = "spider-hub-dashboard.sidebar-collapsed-change";

/**
 * The operator's sidebar preference lives in localStorage.
 *
 * It is read through `useSyncExternalStore` rather than an effect: the
 * server snapshot is always "expanded", and React swaps in the stored
 * value right after hydration - so the first paint is never a flash of the
 * wrong sidebar width, and no effect has to set state.
 */
function subscribeCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

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
 * Compact health/queue indicators for the top bar.
 *
 * Deliberately small: a dot and a number, not a colored notification block.
 * The full detail belongs on the Overview page and in the Logs tab.
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
      {errorCount > 0 ? (
        <Tag
          color="error"
          className="status-chip !mr-0 shrink-0 cursor-pointer"
          onClick={() => router.push("/logs?log=spider-hub&level=error")}
        >
          {t("crawlIssueErrors", { n: errorCount })}
        </Tag>
      ) : null}
      {errorCount === 0 && warningCount > 0 ? (
        <Tag
          color="warning"
          className="status-chip !mr-0 shrink-0 cursor-pointer"
          onClick={() => router.push("/logs?log=spider-hub")}
        >
          {t("crawlIssueWarnings", { n: warningCount })}
        </Tag>
      ) : null}
      {liveCount > 0 ? (
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
      ) : null}
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

  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the operator's own sidebar preference.
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);

  function toggleCollapsed() {
    const next = !collapsed;
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable - the preference just won't persist */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  }

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
          children: rows.map((item) => {
            const href =
              item.key === "/logs" && health.errorCount > 0
                ? "/logs?log=spider-hub&level=error"
                : item.key;
            return {
              key: item.key,
              icon: item.icon,
              // Plain-text title: this is what the collapsed rail shows as a
              // tooltip (the label itself is a Link with a badge in it).
              title: t(item.labelKey),
              label: (
                <Link href={href} className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate-1">{t(item.labelKey)}</span>
                  {item.key === "/logs" && health.errorCount > 0 ? (
                    <Badge size="small" count={health.errorCount} overflowCount={99} />
                  ) : item.key === "/jobs" && liveCount > 0 ? (
                    <Badge size="small" count={liveCount} overflowCount={99} />
                  ) : null}
                </Link>
              ),
            };
          }),
        },
      ];
    });
  }, [t, health.errorCount, liveCount]);

  function renderNav(collapsedRail: boolean) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div
          className={`flex shrink-0 items-center gap-2.5 border-b border-[var(--line)] px-4 py-4 ${
            collapsedRail ? "justify-center px-0" : ""
          }`}
        >
          <Logo size={30} />
          {!collapsedRail ? (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13.5px] font-semibold tracking-tight text-[var(--ink)]">Spider Hub</div>
              <div className="truncate text-[10px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                {t("appTagline")}
              </div>
            </div>
          ) : null}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsedRail}
          selectedKeys={[selected]}
          className="!flex-1 !overflow-y-auto !border-none !bg-transparent"
          items={menuItems}
        />

        <div className="shrink-0 border-t border-[var(--line)] px-3 py-3">
          <Button
            type="text"
            size="small"
            block
            icon={collapsedRail ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            aria-label={collapsedRail ? t("expandSidebar") : t("collapseSidebar")}
            className="!text-[var(--muted)] hover:!text-[var(--ink)]"
          >
            {!collapsedRail ? t("collapseSidebar") : null}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Layout hasSider className="app-shell min-h-screen">
      {/* The desktop rail. Below 1024px it is hidden by CSS and the header's
          menu button opens the drawer version instead - so the layout never
          depends on a JS-measured breakpoint (no hydration flash). */}
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        trigger={null}
        collapsed={collapsed}
        className="app-sider"
      >
        {renderNav(collapsed)}
      </Sider>

      {/* Mobile navigation drawer. */}
      {mobileOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-[#0b0f14]/70 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
          <div
            className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-[var(--line)] bg-[var(--sider)] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t("openNavigation")}
          >
            {renderNav(false)}
          </div>
        </>
      ) : null}

      <Layout
        className={`app-content-offset ${collapsed ? "app-content-offset--collapsed" : ""}`}
        style={{ minWidth: 0 }}
      >
        <Header className="app-header sticky top-0 z-20 !px-3 sm:!px-6">
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-2">
              {/* Page identity. The in-page heading repeats the title for
                  accessibility, but the header is what stays visible while
                  scrolling a long page. */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileOpen(true)}
                  className="!-ml-2 shrink-0 lg:!hidden"
                  aria-label={t("openNavigation")}
                />
                <h1 className="m-0 min-w-0 truncate text-[15px] font-semibold tracking-tight text-[var(--ink)]">
                  {t(activeNavItem.labelKey)}
                </h1>
              </div>

              {/* Status indicators. On mobile they move to their own
                  scrollable row so nothing is pushed off-screen. */}
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
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "logout",
                        icon: <LogoutOutlined />,
                        label: t("navLogout"),
                        onClick: () => logout(),
                      },
                    ],
                  }}
                >
                  <Button type="text" shape="circle" icon={<UserOutlined />} aria-label={t("navLogout")} />
                </Dropdown>
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

        <Content className="page-canvas p-3 sm:p-4 lg:p-6">
          <div key={pathname} className="app-content mx-auto flex max-w-[1680px] flex-col animate-fade-in-up">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
