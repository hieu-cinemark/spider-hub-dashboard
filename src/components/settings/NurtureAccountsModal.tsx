"use client";

import { HeartOutlined } from "@ant-design/icons";
import { Button, Checkbox, Modal, Select, Space } from "antd";
import { useState } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { NurtureInput, NurturePlatform } from "@/lib/types";

export default function NurtureAccountsModal({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (input: NurtureInput) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<NurturePlatform>("all");
  const [like, setLike] = useState(true);
  const [comment, setComment] = useState(true);
  const [browse, setBrowse] = useState(true);

  async function handleOk() {
    await onSubmit({
      platform,
      like,
      comment,
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
          <div>
            <div className="mb-1 text-xs text-[var(--muted)]">{t("platform")}</div>
            <Select
              className="w-full"
              value={platform}
              onChange={setPlatform}
              options={[
                { value: "all", label: t("nurturePlatformAll") },
                { value: "facebook", label: "Facebook" },
                { value: "threads", label: "Threads" },
              ]}
            />
          </div>
          <Checkbox checked={like} onChange={(e) => setLike(e.target.checked)}>
            {t("nurtureLikeOption")}
          </Checkbox>
          <Checkbox checked={comment} onChange={(e) => setComment(e.target.checked)}>
            {t("nurtureCommentOption")}
          </Checkbox>
          <Checkbox checked={browse} onChange={(e) => setBrowse(e.target.checked)}>
            {t("nurtureBrowseOption")}
          </Checkbox>
        </Space>
      </Modal>
    </>
  );
}
