"use client";

import { Form, Input, Modal, Select } from "antd";
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
  // TikTok: cookie from a real logged-in browser (sessionid + ttwid).
  // device_id/odin_id are filled by restore/import bootstrap, not typed here.
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
      onOk={() =>
        form.validateFields().then((values) => {
          const payload: AccountInput = {
            ...values,
            token: values.token ?? "",
            password: values.password ?? "",
            totp_secret: values.totp_secret ?? "",
            email: values.email ?? "",
            email_password: values.email_password ?? "",
          };
          // TikTok form hides token/password; do not send empty token on
          // edit or a save would wipe the captured odin_id.
          if (isTikTok && account) {
            delete payload.token;
            delete payload.password;
            delete payload.totp_secret;
            delete payload.email;
            delete payload.email_password;
          }
          onSubmit(payload);
        })
      }
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={560}
      styles={{ body: { maxHeight: "calc(100vh - 240px)", overflowY: "auto" } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="platform" label={t("platform")} rules={[{ required: true }]}>
          <Select options={PLATFORM_OPTIONS} disabled={!!account} />
        </Form.Item>
        <Form.Item
          name="account_id"
          label={isTikTok ? t("tiktokAccountIdLabel") : t("accountIdLabel")}
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
          <Input.TextArea rows={isTikTok ? 4 : 2} />
        </Form.Item>
        {!isTikTok && (
          <Form.Item name="token" label={t("tokenReserved")}>
            <Input.Password />
          </Form.Item>
        )}
        {/* No manual "enabled" control anymore - the account pool (see
            spider-hub's services/pool.py) owns this field now: it flips
            enabled=false itself the moment a login attempt hits a
            checkpoint, and manually flipping it back true here wouldn't
            actually restore the account anyway (status stays 'checkpoint',
            which get_accounts()'s own query still excludes on). AccountsTable
            shows the pool's own status instead - see poolStatusInfo. */}
      </Form>
    </Modal>
  );
}
