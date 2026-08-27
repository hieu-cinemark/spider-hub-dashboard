"use client";

import { DashboardOutlined, FileTextOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Logo from "@/components/Logo";
import { logout } from "@/lib/auth";

const { Header, Sider, Content } = Layout;

const SIDER_WIDTH = 200;

const NAV_ITEMS = [
  { key: "/", label: "Overview", icon: <DashboardOutlined /> },
  { key: "/logs", label: "Logs", icon: <FileTextOutlined /> },
  { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout hasSider className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={SIDER_WIDTH}
        onCollapse={setCollapsed}
        className="!bg-[#001529]"
        style={{ position: "fixed", insetInlineStart: 0, top: 0, bottom: 0, overflow: "auto" }}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 px-5 py-4">
              <Logo size={30} />
              <span className="text-base font-semibold tracking-tight text-white">Spider Hub</span>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              className="!border-none [&_.ant-menu-item]:!transition-colors [&_.ant-menu-item]:!duration-200"
              items={NAV_ITEMS.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: <Link href={item.key}>{item.label}</Link>,
              }))}
            />
          </div>
          <div className="border-t border-white/10 p-3">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={logout}
              className="!w-full !justify-start !text-white/85 !transition-colors hover:!bg-white/10 hover:!text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </Sider>
      <Layout style={{ marginInlineStart: collapsed ? 0 : SIDER_WIDTH, transition: "margin-inline-start 0.2s" }}>
        <Header
          className="flex items-center border-b border-black/5 !bg-white !px-6"
          style={{ position: "sticky", top: 0, zIndex: 10, width: "100%" }}
        >
          <Typography.Title level={4} className="!mb-0">
            Dashboard
          </Typography.Title>
        </Header>
        <Content className="p-6">
          <div key={pathname} className="animate-fade-in-up">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
