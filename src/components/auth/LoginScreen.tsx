"use client";

import { KeyOutlined, LoginOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography } from "antd";
import { useState } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function LoginScreen({ onSubmit }: { onSubmit: (key: string) => boolean }) {
  const { t } = useTranslation();
  const [invalid, setInvalid] = useState(false);

  function handleFinish(values: { key: string }) {
    setInvalid(!onSubmit(values.key.trim()));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--paper)] px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(720px 420px at 12% 18%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%), radial-gradient(560px 380px at 92% 88%, color-mix(in srgb, #c2410c 16%, transparent), transparent 52%)",
        }}
        aria-hidden
      />
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <ThemeToggle />
        <LocaleSwitcher variant="light" />
      </div>
      <div className="animate-fade-in-up relative w-full max-w-[400px] rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-9 shadow-[0_28px_70px_-36px_rgba(22,19,16,0.45)]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Logo size={60} animate />
          <Typography.Title level={3} className="!mb-0 !tracking-tight">
            Spider Hub
          </Typography.Title>
          <Typography.Text type="secondary">{t("enterAccessKey")}</Typography.Text>
        </div>

        {invalid && <Alert type="error" showIcon title={t("invalidAccessKey")} className="!mb-4" />}

        <Form layout="vertical" onFinish={handleFinish} onValuesChange={() => setInvalid(false)}>
          <Form.Item name="key" rules={[{ required: true, message: t("accessKeyRequired") }]}>
            <Input.Password prefix={<KeyOutlined />} placeholder={t("accessKeyPlaceholder")} autoFocus size="large" />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block size="large">
              {t("continueBtn")}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
