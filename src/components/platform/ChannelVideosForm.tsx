"use client";

import { PlayCircleOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber } from "antd";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { QUERY_KEYS } from "@/lib/constants";

export default function ChannelVideosForm() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [maxPages, setMaxPages] = useState<number | null>(null);

  const run = useMutation({
    mutationFn: () =>
      api.runChannelVideos({
        username: username.trim(),
        max_pages: maxPages ?? undefined,
      }),
    onSuccess: (res) => {
      if (res.published) {
        message.success(t("channelVideosQueued", { username: username.replace(/^@/, "") }));
      } else {
        message.warning(t("channelVideosQueueFailed"));
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobStatus("tiktok") });
    },
    onError: (err) => message.error(translateApiError(err, t)),
  });

  const canRun = username.trim().replace(/^@/, "").length > 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="mb-0 text-sm leading-relaxed text-[var(--muted)]">{t("channelVideosDesc")}</p>
      <Input
        size="large"
        prefix="@"
        placeholder={t("channelVideosPlaceholder")}
        value={username.replace(/^@/, "")}
        onChange={(e) => setUsername(e.target.value)}
        onPressEnter={() => canRun && run.mutate()}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold tracking-wide text-[var(--muted)]">{t("maxPages")}</span>
          <InputNumber
            min={1}
            max={100}
            value={maxPages}
            onChange={(v) => setMaxPages(typeof v === "number" ? v : null)}
            placeholder={t("maxPagesPlaceholder")}
          />
        </div>
        <Button
          type="primary"
          size="large"
          className="mt-auto"
          icon={<PlayCircleOutlined />}
          disabled={!canRun}
          loading={run.isPending}
          onClick={() => run.mutate()}
        >
          {t("channelVideosRun")}
        </Button>
      </div>
    </div>
  );
}
