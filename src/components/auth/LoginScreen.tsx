"use client";

import { KeyOutlined, LoginOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function LoginScreen({ onSubmit }: { onSubmit: (key: string) => boolean }) {
  const { t } = useTranslation();
  const [invalid, setInvalid] = useState(false);

  function handleFinish(values: { key: string }) {
    setInvalid(!onSubmit(values.key.trim()));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f7] px-4">
      <div
        className="animate-glow-pulse pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-[#2f54eb] opacity-40 blur-3xl"
        aria-hidden
      />
      <Card className="animate-fade-in-up relative w-full max-w-sm shadow-lg">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <Logo size={56} animate />
          <Typography.Title level={4} className="!mb-0">
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
      </Card>
    </div>
  );
}
