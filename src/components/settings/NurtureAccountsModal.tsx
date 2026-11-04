"use client";

import { HeartOutlined } from "@ant-design/icons";
import { Button, Checkbox, Modal, Space } from "antd";
import { useState } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { NurtureInput } from "@/lib/types";

export default function NurtureAccountsModal({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (input: NurtureInput) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [browse, setBrowse] = useState(true);

  async function handleOk() {
    await onSubmit({
      platform: "threads",
      visits: browse ? 3 : 0,
    });
    setOpen(false);
  }

  return (
    <>
      <Button icon={<HeartOutlined />} loading={loading} onClick={() => setOpen(true)}>
        {t("nurtureAccountsAction")}
      </Button>
      <Modal
        open={open}
        title={t("nurtureAccountsTitle")}
        okText={t("nurtureAccountsAction")}
        cancelText={t("cancel")}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        centered
        destroyOnHidden
      >
        <p className="mb-4 text-sm text-[var(--muted)]">{t("nurtureAccountsDesc")}</p>
        <Space orientation="vertical" size="middle" className="w-full">
          <Checkbox checked={browse} onChange={(e) => setBrowse(e.target.checked)}>
            {t("nurtureBrowseOption")}
          </Checkbox>
        </Space>
      </Modal>
    </>
  );
}
