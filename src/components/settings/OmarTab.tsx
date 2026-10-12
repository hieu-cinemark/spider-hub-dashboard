"use client";

import { ApiOutlined, CommentOutlined, PauseCircleOutlined, PlayCircleOutlined, TagsOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Input, Progress, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useTranslation } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { OmarHashtagProgress } from "@/lib/types";

// Tab Omar (Settings): key Omar API, hạn mức của gói, lượt cào hashtag TikTok đang chạy (Chạy ngay / Dừng) và tiến độ
// từng hashtag - xem cinemark-api app/services/omar_tiktok.py và app/api/routes/omar.py.

const STATUS_KEY = ["omar", "status"] as const;

function fmtNumber(n: number | null | undefined) {
  return n == null ? "—" : n.toLocaleString();
}

const WEEKDAYS = {
  vi: ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

function fmtDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function OmarTab() {
  const { t, locale } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");

  const status = useQuery({
    queryKey: STATUS_KEY,
    queryFn: api.omarStatus,
    refetchInterval: (query) => (query.state.data?.round.running ? 10_000 : 60_000),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: STATUS_KEY });

  const run = useMutation({
    mutationFn: api.omarRun,
    onSuccess: (res) => {
      if (res.started) message.success(t("omarRunStarted"));
      else message.info(t("omarAlreadyRunning"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const stop = useMutation({
    mutationFn: api.omarStop,
    onSuccess: (res) => {
      if (res.stopping) message.success(t("omarStopRequested"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const runComments = useMutation({
    mutationFn: api.omarCommentsRun,
    onSuccess: (res) => {
      message.success(t("omarCommentsQueued", { queued: fmtNumber(res.queued), pending: fmtNumber(res.pending) }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  const saveKey = useMutation({
    mutationFn: (key: string) => api.setOmarApiKey(key),
    onSuccess: () => {
      setNewKey("");
      message.success(t("omarKeySaved"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const data = status.data;
  const usage = data?.usage;
  const round = data?.round;
  const day = usage?.day;
  const dayPct = day?.limit ? Math.round((day.used / day.limit) * 100) : 0;
  const comments = data?.comments;
  const job = comments?.last;

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard
        loading={status.isLoading}
        title={<CardHeading icon={<ApiOutlined />} title={t("omarTitle")} desc={t("omarDesc")} />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text strong>{t("omarKey")}</Typography.Text>
              {data?.key_set ? <Tag color="green">{t("omarKeySet")}</Tag> : <Tag color="red">{t("omarKeyMissing")}</Tag>}
              {usage?.plan && <Tag>{usage.plan}</Tag>}
              {usage?.status && <Tag color={usage.status === "active" ? "blue" : "orange"}>{usage.status}</Tag>}
            </div>
            <Space.Compact className="w-full">
              <Input.Password
                placeholder={t("omarKeyPlaceholder")}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                autoComplete="off"
              />
              <Button type="primary" disabled={!newKey.trim()} loading={saveKey.isPending} onClick={() => saveKey.mutate(newKey.trim())}>
                {t("save")}
              </Button>
            </Space.Compact>
            {usage?.expires_at && (
              <Typography.Text type="secondary" className="text-xs">
                {t("omarExpires", { date: new Date(usage.expires_at).toLocaleDateString() })}
              </Typography.Text>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Typography.Text strong>{t("omarQuotaToday")}</Typography.Text>
            {day ? (
              <>
                <Progress percent={dayPct} status={dayPct >= 100 ? "exception" : "active"} />
                <Typography.Text type="secondary" className="text-xs">
                  {t("omarQuotaLine", {
                    used: fmtNumber(day.used),
                    limit: fmtNumber(day.limit),
                    remaining: fmtNumber(day.remaining),
                    reset: fmtDuration(day.resets_in),
                    perMinute: fmtNumber(usage?.minute?.limit),
                  })}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text type="secondary">{t("omarQuotaUnknown")}</Typography.Text>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--line)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={run.isPending}
              disabled={!data?.key_set || round?.running}
              onClick={() => run.mutate()}
            >
              {t("omarRunNow")}
            </Button>
            <Button danger icon={<PauseCircleOutlined />} loading={stop.isPending} disabled={!round?.running || round?.stop_requested} onClick={() => stop.mutate()}>
              {round?.stop_requested ? t("omarStopping") : t("omarStop")}
            </Button>
            {round?.running ? (
              <Tag color="processing">{t("omarRunning", { trigger: round.trigger ?? "" })}</Tag>
            ) : (
              <Tag>{t("omarIdle")}</Tag>
            )}
            <Typography.Text type="secondary" className="text-xs">
              {data?.mode === "continuous" ? t("omarModeContinuous") : t("omarModeSpread")}
            </Typography.Text>
          </div>
          {round && (round.running || round.finished_at) && (
            <Typography.Text type="secondary" className="text-xs">
              {round.running
                ? t("omarRoundSince", { time: formatRelativeTime(round.started_at, t) })
                : t("omarRoundFinished", { time: formatRelativeTime(round.finished_at, t) })}
              {" · "}
              {t("omarRoundStats", {
                requests: fmtNumber(round.stats.requests),
                budget: fmtNumber(round.stats.budget),
                videos: fmtNumber(round.stats.videos),
                published: fmtNumber(round.stats.published),
                skipped: fmtNumber(round.stats.skipped_seen),
                keywords: fmtNumber(round.stats.keywords),
                failed: fmtNumber(round.stats.failed),
              })}
              {round.stats.stopped ? ` · ${round.stats.stopped}` : ""}
              {round.stats.comment_requests
                ? ` · ${t("omarRoundComments", {
                    videos: fmtNumber(round.stats.comment_videos),
                    comments: fmtNumber(round.stats.comments),
                    replies: fmtNumber(round.stats.comment_replies),
                    published: fmtNumber(round.stats.comments_published),
                  })}`
                : ""}
            </Typography.Text>
          )}
        </div>
      </DashboardCard>

      <DashboardCard
        loading={status.isLoading}
        title={
          <CardHeading
            icon={<CommentOutlined />}
            title={t("omarCommentsTitle")}
            desc={
              comments
                ? t("omarCommentsDesc", {
                    weekday: WEEKDAYS[locale === "vi" ? "vi" : "en"][comments.weekday] ?? String(comments.weekday),
                    time: comments.time,
                    top: comments.top_per_hashtag,
                  })
                : undefined
            }
          />
        }
        extra={
          <Button
            icon={<CommentOutlined />}
            loading={runComments.isPending}
            disabled={!data?.key_set}
            onClick={() => runComments.mutate()}
          >
            {t("omarCommentsRun")}
          </Button>
        }
      >
        {job ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text>
                {t("omarCommentsLast", {
                  week: job.week,
                  trigger: job.trigger,
                  time: formatRelativeTime(job.queued_at, t),
                  videos: fmtNumber(job.videos + job.kept_from_before),
                  hashtags: fmtNumber(job.hashtags),
                })}
              </Typography.Text>
              {job.finished_at ? (
                <Tag color="green">{t("omarCommentsDone", { time: formatRelativeTime(job.finished_at, t) })}</Tag>
              ) : (
                <Tag color="blue">{t("omarInProgress")}</Tag>
              )}
            </div>
            {job.videos + job.kept_from_before > 0 && (
              <Progress
                percent={Math.round(
                  ((job.videos + job.kept_from_before - comments.pending_videos) / (job.videos + job.kept_from_before)) * 100,
                )}
                size="small"
              />
            )}
            <Typography.Text type="secondary" className="text-xs">
              {t("omarCommentsProgress", {
                comments: fmtNumber(job.comments),
                replies: fmtNumber(job.replies),
                published: fmtNumber(job.published),
                pending: fmtNumber(comments.pending_videos),
              })}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">{t("omarCommentsNone")}</Typography.Text>
        )}
      </DashboardCard>

      <DashboardCard
        title={
          <CardHeading
            icon={<TagsOutlined />}
            title={t("omarProgressTitle")}
            desc={
              data
                ? t("omarProgressDesc", {
                    finished: data.totals.finished,
                    started: data.totals.started,
                    total: data.totals.hashtags,
                    pages: fmtNumber(data.totals.pages),
                  })
                : undefined
            }
          />
        }
      >
        <Table<OmarHashtagProgress>
          size="small"
          rowKey="keyword_id"
          loading={status.isLoading}
          dataSource={data?.hashtags ?? []}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: true }}
          columns={[
            { title: "Hashtag", dataIndex: "hashtag", render: (v: string) => <span className="font-medium">{v}</span> },
            { title: t("omarColMovie"), dataIndex: "movie", render: (v: string | null) => v ?? "—" },
            { title: t("omarColPages"), dataIndex: "pages", align: "right", render: (v: number) => fmtNumber(v) },
            {
              title: t("omarColVideos"),
              key: "videos",
              align: "right",
              render: (_, row) => (
                <Tooltip title={t("omarColVideosHint")}>
                  <span>~{fmtNumber(row.pages * 20)}</span>
                </Tooltip>
              ),
            },
            {
              title: t("omarColTiktokVideos"),
              key: "tiktok",
              align: "right",
              render: (_, row) =>
                row.video_count ? (
                  <Tooltip title={t("omarColTiktokVideosHint")}>
                    <span>
                      {fmtNumber(row.video_count)}{" "}
                      <span className="text-xs text-[var(--muted)]">
                        ({Math.min(100, Math.round(((row.pages * 20) / row.video_count) * 100))}%)
                      </span>
                    </span>
                  </Tooltip>
                ) : (
                  "—"
                ),
            },
            {
              title: t("omarColStatus"),
              key: "status",
              render: (_, row) =>
                row.done_at ? (
                  <Tag color="green">{t("omarDone", { time: formatRelativeTime(row.done_at, t) })}</Tag>
                ) : row.pages > 0 ? (
                  <Tag color="blue">{t("omarInProgress")}</Tag>
                ) : (
                  <Tag>{t("omarNotStarted")}</Tag>
                ),
            },
          ]}
        />
      </DashboardCard>
    </div>
  );
}
