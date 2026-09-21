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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[var(--paper)] px-4">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <ThemeToggle />
        <LocaleSwitcher variant="light" />
      </div>
      <div
        className="animate-glow-pulse pointer-events-none absolute h-[480px] w-[480px] rounded-full bg-indigo-500 opacity-30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[-80px] bottom-[-80px] h-[320px] w-[320px] rounded-full bg-amber-300/40 blur-3xl dark:bg-indigo-400/20"
        aria-hidden
      />
      <div className="animate-fade-in-up relative w-full max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8 shadow-[0_24px_60px_-32px_rgba(18,20,26,0.35)]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={56} animate />
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
