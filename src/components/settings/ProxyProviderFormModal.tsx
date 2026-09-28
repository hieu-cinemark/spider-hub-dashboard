"use client";

import { Form, Input, Modal, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { ProxyProvider, ProxyProviderInput } from "@/lib/types";

// Same secret-handling contract as AiProviderFormModal: the token is never
// pre-filled (the API only says whether one is stored), and leaving it
// blank on save keeps the stored one. A brand-new provider has nothing to
// keep, so the token is required there.
export default function ProxyProviderFormModal({
  open,
  provider,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  provider: ProxyProvider | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (key: string, input: ProxyProviderInput) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProxyProviderInput & { key: string }>();
  const isNew = !provider;
  const tokenRequired = isNew;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        key: provider?.key ?? "",
        api_url: provider?.api_url ?? "",
        token: "",
        ip_allowlist: provider?.ip_allowlist ?? false,
      });
    }
  }, [open, provider, form]);

  return (
    <Modal
      open={open}
      title={isNew ? t("addProxyProvider") : t("editProxyProvider")}
      onCancel={onCancel}
      onOk={() =>
        form.validateFields().then(({ key, ...input }) => {
          onSubmit(key.trim(), { ...input, token: input.token?.trim() || undefined });
        })
      }
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={520}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="key"
          label={t("proxyProviderKey")}
          extra={t("proxyProviderKeyHint")}
          rules={[{ required: true }, { pattern: /^[a-z0-9_]{1,64}$/, message: t("proxyProviderKeyInvalid") }]}
        >
          <Input placeholder="proxiestrust_tiktok_us" disabled={!isNew} />
        </Form.Item>
        <Form.Item
          name="api_url"
          label={t("proxyProviderApiUrl")}
          extra={t("proxyProviderApiUrlHint")}
          rules={[{ required: true }, { type: "url" }]}
        >
          <Input placeholder="https://proxiestrust.com/sp07api/get_new" />
        </Form.Item>
        <Form.Item
          name="token"
          label={t("proxyProviderToken")}
          extra={provider ? t("proxyProviderTokenHintKeep") : undefined}
          rules={tokenRequired ? [{ required: true }] : []}
        >
          <Input.Password placeholder={provider?.token_set ? "••••••••" : ""} />
        </Form.Item>
        <Form.Item
          name="ip_allowlist"
          label={t("proxyProviderIpAllowlist")}
          extra={t("proxyProviderIpAllowlistHint")}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
