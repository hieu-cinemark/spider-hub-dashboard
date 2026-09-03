"use client";

import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PLATFORM_META } from "@/lib/platform";
import type { Account, AccountInput } from "@/lib/types";

const PLATFORM_OPTIONS = Object.keys(PLATFORM_META)
  .filter((p) => p === "facebook" || p === "threads" || p === "tiktok")
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
  const { t } = useTranslation();
  const [form] = Form.useForm<AccountInput>();
  const platform = Form.useWatch("platform", form);
  // TikTok has no login/2FA of its own (see spider-hub's
  // spiders/tiktok/auth/accounts.py) - it repurposes these same three
  // generic columns to carry a captured browser identity instead:
  // account_id -> device_id, token -> odin_id, cookie -> raw Cookie header
  // (ttwid/msToken/s_v_web_id).
  const isTikTok = platform === "tiktok";

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        account ?? {
          platform: "facebook",
          account_id: "",
          password: "",
          totp_secret: "",
          cookie: "",
          token: "",
          email: "",
          email_password: "",
          enabled: true,
        },
      );
    }
  }, [open, account, form]);

  return (
    <Modal
      open={open}
      title={account ? t("editAccount") : t("addAccount")}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={loading}
      destroyOnHidden
      centered
      styles={{ body: { maxHeight: "calc(100vh - 260px)", overflowY: "auto", paddingRight: 4 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="platform" label={t("platform")} rules={[{ required: true }]}>
          <Select options={PLATFORM_OPTIONS} disabled={!!account} />
        </Form.Item>
        <Form.Item
          name="account_id"
          label={isTikTok ? t("deviceId") : t("accountIdLabel")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        {!isTikTok && (
          <>
            <Form.Item name="email" label={t("recoveryEmail")}>
              <Input />
            </Form.Item>
            <Form.Item name="email_password" label={t("recoveryEmailPassword")}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="password" label={t("password")}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="totp_secret" label={t("twoFaSecret")}>
              <Input.Password />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="cookie"
          label={isTikTok ? t("cookieHeaderTikTok") : t("cookieHeaderGeneric")}
          rules={isTikTok ? [{ required: true }] : undefined}
        >
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="token" label={isTikTok ? t("odinId") : t("tokenReserved")} rules={isTikTok ? [{ required: true }] : undefined}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="enabled" label={t("enabled")} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
