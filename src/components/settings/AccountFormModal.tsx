"use client";

import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import { PLATFORM_META } from "@/lib/platform";
import type { Account, AccountInput } from "@/lib/types";

const PLATFORM_OPTIONS = Object.keys(PLATFORM_META)
  .filter((p) => p === "facebook" || p === "threads")
  .map((p) => ({ value: p, label: PLATFORM_META[p].label }));

export default function AccountFormModal({
  open,
  account,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  account: Account | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: AccountInput) => void;
}) {
  const [form] = Form.useForm<AccountInput>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        account ?? { platform: "facebook", account_id: "", password: "", totp_secret: "", cookie: "", token: "", email: "", enabled: true },
      );
    }
  }, [open, account, form]);

  return (
    <Modal
      open={open}
      title={account ? "Edit account" : "Add account"}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
          <Select options={PLATFORM_OPTIONS} disabled={!!account} />
        </Form.Item>
        <Form.Item name="account_id" label="Account ID (login email/phone/username)" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Recovery email">
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password">
          <Input.Password />
        </Form.Item>
        <Form.Item name="totp_secret" label="2FA TOTP secret">
          <Input.Password />
        </Form.Item>
        <Form.Item name="cookie" label="Cookie header (skips login if set)">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="token" label="Token (reserved)">
          <Input.Password />
        </Form.Item>
        <Form.Item name="enabled" label="Enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
