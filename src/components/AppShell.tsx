"use client";

import {
  CommentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Logo from "@/components/Logo";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import { logout } from "@/lib/auth";

const { Header, Sider, Content } = Layout;

const SIDER_WIDTH = 200;

const NAV_ITEMS: { key: string; labelKey: TranslationKey; icon: ReactNode }[] =
  [
    { key: "/", labelKey: "navOverview", icon: <DashboardOutlined /> },
    { key: "/posts", labelKey: "navPosts", icon: <UnorderedListOutlined /> },
    { key: "/comments", labelKey: "navComments", icon: <CommentOutlined /> },
    { key: "/logs", labelKey: "navLogs", icon: <FileTextOutlined /> },
    { key: "/settings", labelKey: "navSettings", icon: <SettingOutlined /> },
  ];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  // `collapsed` mirrors Sider's own breakpoint logic (true below the "lg"
  // breakpoint - narrow/mobile viewports) and also controls the desktop
  // content margin. `mobileOpen` is separate: whether the drawer is
  // currently pulled out over the content on one of those narrow
  // viewports. Without this split, a narrow-viewport user had literally no
  // way back into the nav once Sider auto-collapsed to 0 width - there was
  // no trigger at all (Sider's own `collapsible` was never turned on).
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Closing the drawer on navigation, not on outside-click alone, so
  // tapping a nav link doesn't leave it stuck open behind the new page.
  // Adjusting state during render (React's documented pattern for "reset
  // when a prop changes") instead of an effect - an effect here would
  // commit the still-open drawer for one frame before the reset re-render.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (renderedPathname !== pathname) {
    setRenderedPathname(pathname);
    setMobileOpen(false);
  }

  const activeNavItem = NAV_ITEMS.find((item) => item.key === pathname) ?? NAV_ITEMS[0];

  return (
    <Layout hasSider className="min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/45 lg:hidden"
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
        className="!bg-[#001529]"
        style={{
          position: "fixed",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          overflow: "auto",
          zIndex: 30,
        }}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 px-5 py-4">
              <Logo size={30} />
              <span className="text-base font-semibold tracking-tight text-white">
                Spider Hub
              </span>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              className="!border-none [&_.ant-menu-item]:!transition-colors [&_.ant-menu-item]:!duration-200"
              items={NAV_ITEMS.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: <Link href={item.key}>{t(item.labelKey)}</Link>,
              }))}
            />
          </div>
        </div>
      </Sider>
      <Layout
        style={{
          marginInlineStart: collapsed ? 0 : SIDER_WIDTH,
          transition: "margin-inline-start 0.2s",
        }}
      >
        <Header
          className="flex items-center justify-between !bg-white !px-4 sm:!px-6"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            width: "100%",
            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.04), 0 2px 8px -2px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {collapsed && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileOpen(true)}
                className="!-ml-2 shrink-0"
                aria-label={t("openNavigation")}
              />
            )}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f54eb]/8 text-base text-[#2f54eb]">
              {activeNavItem.icon}
            </span>
            <Typography.Title level={4} className="!mb-0 truncate">
              {t(activeNavItem.labelKey)}
            </Typography.Title>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher variant="light" />
            <Button type="text" icon={<LogoutOutlined />} onClick={logout} className="!text-[#595959]">
              {t("navLogout")}
            </Button>
          </div>
        </Header>
        <Content className="bg-[#f5f5f7] p-3 sm:p-6">
          <div key={pathname} className="animate-fade-in-up">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
