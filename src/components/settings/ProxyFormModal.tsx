"use client";

import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import { PLATFORM_META } from "@/lib/platform";
import type { Proxy, ProxyInput } from "@/lib/types";

const PLATFORM_OPTIONS = [
  { value: "all", label: "All platforms (shared)" },
  ...Object.keys(PLATFORM_META)
    .filter((p) => p === "facebook" || p === "threads" || p === "tiktok")
    .map((p) => ({ value: p, label: PLATFORM_META[p].label })),
];

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
  const [form] = Form.useForm<ProxyInput>();

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
      title={proxy ? "Edit proxy" : "Add proxy"}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
          <Select options={PLATFORM_OPTIONS} />
        </Form.Item>
        <Form.Item name="proxy_url" label="Proxy host:port" rules={[{ required: true }]}>
          <Input placeholder="1.2.3.4:8080" />
        </Form.Item>
        <Form.Item name="username" label="Username">
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password">
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="login_use_proxy"
          label="Use for browser login too"
          valuePropName="checked"
          tooltip="Off by default - a proxy IP that doesn't match the account's usual geography is what triggers a captcha on a fresh login. The ongoing replay traffic always uses this proxy regardless of this flag."
        >
          <Switch />
        </Form.Item>
        <Form.Item name="enabled" label="Enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
