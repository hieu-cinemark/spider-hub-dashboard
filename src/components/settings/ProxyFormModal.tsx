"use client";

import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PLATFORM_META } from "@/lib/platform";
import type { Proxy, ProxyInput } from "@/lib/types";

export default function ProxyFormModal({
  open,
  proxy,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  proxy: Proxy | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: ProxyInput) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProxyInput>();

  const platformOptions = [
    { value: "all", label: t("allPlatformsShared") },
    ...Object.keys(PLATFORM_META)
      .filter((p) => p === "facebook" || p === "threads" || p === "tiktok")
      .map((p) => ({ value: p, label: PLATFORM_META[p].label })),
  ];

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        proxy ?? { platform: "all", proxy_url: "", username: "", password: "", login_use_proxy: false, enabled: true },
      );
    }
  }, [open, proxy, form]);

  return (
    <Modal
      open={open}
      title={proxy ? t("editProxy") : t("addProxy")}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={520}
      styles={{ body: { maxHeight: "calc(100vh - 240px)", overflowY: "auto" } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="platform" label={t("platform")} rules={[{ required: true }]}>
          <Select options={platformOptions} />
        </Form.Item>
        <Form.Item name="proxy_url" label={t("proxyHostPort")} rules={[{ required: true }]}>
          <Input placeholder="1.2.3.4:8080" />
        </Form.Item>
        <Form.Item name="username" label={t("username")}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label={t("password")}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="login_use_proxy" label={t("useForLoginToo")} valuePropName="checked" tooltip={t("useForLoginTooltip")}>
          <Switch />
        </Form.Item>
        <Form.Item name="enabled" label={t("enabled")} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
