"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { useColorTheme } from "@/theme/ThemeProvider";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useColorTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="text"
      aria-label={isDark ? t("themeSwitchToLight") : t("themeSwitchToDark")}
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme}
      className="!text-[var(--ink)]"
    />
  );
}
