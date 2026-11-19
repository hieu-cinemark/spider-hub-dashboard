"use client";

import { ApiOutlined, CommentOutlined, PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined, TagsOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Checkbox, Input, InputNumber, Popconfirm, Progress, Select, Space, Table, Tag, Tooltip, TreeSelect, Typography } from "antd";
import { useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTranslation } from "@/i18n/LocaleProvider";
import { useMovies } from "@/hooks/useMovies";
import { useKeywords } from "@/hooks/useKeywords";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { OmarHashtagProgress } from "@/lib/types";
import Hint from "@/components/Hint";

// Tab Omar (TikTok): key Omar API, tổng request mỗi ngày / số request đồng thời, hạn mức của gói, lượt cào hashtag TikTok chạy
// liên tục khi key đúng (Chạy ngay / Dừng), tiến độ từng hashtag và bình luận - xem cinemark-api app/services/omar/ và
// app/api/routes/omar.py.

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
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState("");
  // null = chưa sửa, hiện giá trị đang lưu. 0 = theo gói / mặc định.
  const [limitDraft, setLimitDraft] = useState<{ perMinute?: number; daily?: number; concurrency?: number }>({});
  const movies = useMovies();
  const [tagMovie, setTagMovie] = useState<string | undefined>();
  const [newTag, setNewTag] = useState("");
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
  // Người dùng tự gõ hashtag cho một phim: kiểm tra có trên TikTok, tạo từ khoá rồi cào ngay tới hết (POST /omar/hashtags).
  const addTag = useMutation({
    mutationFn: () => api.omarAddHashtag(tagMovie!, newTag.trim()),
    onSuccess: (res) => {
      setNewTag("");
      message.success(t(res.started ? "omarTagAdded" : "omarTagAlreadyRunning", { tag: res.keyword.keyword }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  // Nút "Cào lại" từng hashtag: xoá con trỏ rồi cào lại từ trang đầu ngay (POST /omar/hashtags/{id}/recrawl).
  const recrawl = useMutation({
    mutationFn: (row: OmarHashtagProgress) => api.omarRecrawlHashtag(row.keyword_id),
    onSuccess: (res) => {
      message.success(t(res.started ? "omarRecrawlStarted" : "omarRecrawlAlreadyRunning", { tag: res.hashtag }));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });
  // Lưu key: server gọi GET /usage kiểm tra - key đúng thì lượt cào mở ngay và chạy liên tục (res.key_valid).
  const saveKey = useMutation({
    mutationFn: (key: string) => api.saveOmarSettings({ api_key: key }),
    onSuccess: (res) => {
      setNewKey("");
      if (!res.api_key_set) message.info(t("omarKeyRemoved"));
      else if (res.key_valid) message.success(t("omarKeyValid"));
      else message.error(t("omarKeyInvalid"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const saveLimits = useMutation({
    mutationFn: () =>
      api.saveOmarSettings({
        requests_per_minute: limitDraft.perMinute,
        daily_requests: limitDraft.daily,
        concurrency: limitDraft.concurrency,
      }),
    onSuccess: () => {
      setLimitDraft({});
      message.success(t("omarLimitsSaved"));
      refresh();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const data = status.data;
  const usage = data?.usage;
  const savedPerMinute = data?.requests_per_minute ?? 0;
  const savedDaily = data?.daily_requests ?? 0;
  const savedConcurrency = data?.concurrency ?? 0;
  const planPerMinute = usage?.minute?.limit ?? 0;
  const limitsDirty = Object.values(limitDraft).some((value) => value !== undefined);
  const round = data?.round;
  const day = usage?.day;
  const dayPct = day?.limit ? Math.round((day.used / day.limit) * 100) : 0;
  const comments = data?.comments;
  const job = comments?.last;

  const hashtagColumns: ResponsiveColumnType<OmarHashtagProgress>[] = [
    {
      title: "Hashtag",
      dataIndex: "hashtag",
      mobilePrimary: true,
      render: (v: string) => <span className="font-medium break-words">{v}</span>,
    },
    { title: t("omarColMovie"), dataIndex: "movie", render: (v: string | null) => v ?? "—" },
    { title: t("omarColPages"), dataIndex: "pages", align: "right", render: (v: number) => fmtNumber(v) },
    {
      title: t("omarColVideos"),
      key: "videos",
      align: "right",
      render: (_: unknown, row: OmarHashtagProgress) => (
        <Tooltip title={t("omarColVideosHint")}>
          <span>~{fmtNumber(row.pages * 20)}</span>
        </Tooltip>
      ),
    },
    {
      title: t("omarColTiktokVideos"),
      key: "tiktok",
      align: "right",
      render: (_: unknown, row: OmarHashtagProgress) =>
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
      render: (_: unknown, row: OmarHashtagProgress) =>
        row.missing_at ? (
          <Tooltip title={t("omarMissingHint")}>
            <Tag color="orange">{t("omarMissing", { time: formatRelativeTime(row.missing_at, t) })}</Tag>
          </Tooltip>
        ) : row.done_at ? (
          <Tag color="green">{t("omarDone", { time: formatRelativeTime(row.done_at, t) })}</Tag>
        ) : row.pages > 0 ? (
          <Tag color="blue">{t("omarInProgress")}</Tag>
        ) : (
          <Tag>{t("omarNotStarted")}</Tag>
        ),
    },
    {
      title: t("omarColActions"),
      key: "actions",
      align: "right",
      render: (_: unknown, row: OmarHashtagProgress) => (
        <Popconfirm
          title={t("omarRecrawlTitle", { tag: row.hashtag })}
          description={t("omarRecrawlDesc")}
          okText={t("omarRecrawl")}
          onConfirm={() => recrawl.mutate(row)}
        >
          <Button size="small" icon={<ReloadOutlined />} loading={recrawl.isPending && recrawl.variables?.keyword_id === row.keyword_id}>
            {t("omarRecrawl")}
          </Button>
        </Popconfirm>
      ),
    },
  ];

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
              {data?.key_set && data.key_valid === true && <Tag color="success">{t("omarKeyWorks")}</Tag>}
              {data?.key_set && data.key_valid === false && <Tag color="error">{t("omarKeyBroken")}</Tag>}
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
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {t("omarDailyRequests")}
                  <Hint text={t("omarDailyRequestsHint", { plan: fmtNumber(day?.limit) })} />
                </span>
                <InputNumber
                  min={0}
                  max={10_000_000}
                  precision={0}
                  className="w-full"
                  value={limitDraft.daily ?? savedDaily}
                  onChange={(value) => setLimitDraft((d) => ({ ...d, daily: value ?? 0 }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {t("omarConcurrency")}
                  <Hint text={t("omarConcurrencyHint", { default: data?.default_concurrency ?? 8 })} />
                </span>
                <InputNumber
                  min={0}
                  max={64}
                  precision={0}
                  className="w-full"
                  value={limitDraft.concurrency ?? savedConcurrency}
                  onChange={(value) => setLimitDraft((d) => ({ ...d, concurrency: value ?? 0 }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {t("omarRateCap")}
                  <Hint text={t("omarRateCapHint", { plan: fmtNumber(planPerMinute) })} />
                </span>
                <InputNumber
                  min={0}
                  max={10000}
                  precision={0}
                  className="w-full"
                  value={limitDraft.perMinute ?? savedPerMinute}
                  onChange={(value) => setLimitDraft((d) => ({ ...d, perMinute: value ?? 0 }))}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="primary" disabled={!limitsDirty} loading={saveLimits.isPending} onClick={() => saveLimits.mutate()}>
                {t("save")}
              </Button>
              <Typography.Text type="secondary" className="text-xs">
                {t("omarLimitsActive", {
                  daily: savedDaily > 0 ? fmtNumber(savedDaily) : t("omarByPlan"),
                  concurrency: savedConcurrency > 0 ? fmtNumber(savedConcurrency) : `${data?.default_concurrency ?? 8} (${t("omarDefault")})`,
                })}
              </Typography.Text>
            </div>
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
            ) : data?.paused ? (
              <Tooltip title={t(data.paused.reason === "key" ? "omarPausedKeyHint" : "omarPausedQuotaHint")}>
                <Tag color="warning">
                  {t(data.paused.reason === "key" ? "omarPausedKey" : "omarPausedQuota", {
                    time: new Date(data.paused.until).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    }),
                  })}
                </Tag>
              </Tooltip>
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
        <CommentKeywordPicker />
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            showSearch
            className="min-w-[240px]"
            placeholder={t("omarTagMovie")}
            value={tagMovie}
            onChange={setTagMovie}
            loading={movies.isLoading}
            optionFilterProp="label"
            options={(movies.data ?? []).map((movie) => ({ value: movie.id, label: movie.title }))}
          />
          <Input
            className="max-w-[320px]"
            prefix="#"
            placeholder={t("omarTagPlaceholder")}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value.replace(/^#/, ""))}
            onPressEnter={() => tagMovie && newTag.trim() && addTag.mutate()}
          />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!data?.key_set || !tagMovie || !newTag.trim()}
            loading={addTag.isPending}
            onClick={() => addTag.mutate()}
          >
            {t("omarTagAdd")}
          </Button>
          <Hint text={t("omarTagHint")} />
        </div>
        {isMobile ? (
          <MobileTable
            rowKey="keyword_id"
            loading={status.isLoading}
            dataSource={data?.hashtags ?? []}
            columns={hashtagColumns}
          />
        ) : (
        <Table<OmarHashtagProgress>
          size="small"
          rowKey="keyword_id"
          loading={status.isLoading}
          dataSource={data?.hashtags ?? []}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: true }}
          columns={hashtagColumns}
        />
        )}
      </DashboardCard>
    </div>
  );
}

/** Chọn từ khoá TikTok để cào bình luận (rỗng = mọi hashtag đang bật). Nhóm theo phim; tích một phim = mọi từ khoá của nó. */
function CommentKeywordPicker() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords("tiktok");
  const saved = useQuery({ queryKey: ["omar", "comment-keywords"], queryFn: api.omarCommentKeywords });
  // Bản nháp chưa lưu; null = đang hiện đúng danh sách đã lưu.
  const [draft, setDraft] = useState<string[] | null>(null);
  const value = draft ?? saved.data?.keyword_ids ?? [];
  const [allDraft, setAllDraft] = useState<boolean | null>(null);
  const allVideos = allDraft ?? saved.data?.all_videos ?? false;
  const selectedIds = value.filter((id) => !id.startsWith("movie:"));

  const hashtagCount = (keywords ?? []).filter((k) => k.keyword.startsWith("#")).length;
  const treeData = useMemo(() => {
    const byMovie = new Map<string, { title: string; children: { title: string; value: string }[] }>();
    for (const k of keywords ?? []) {
      const key = k.movie_id || k.movie_title || "—";
      const group = byMovie.get(key) ?? { title: k.movie_title || "—", children: [] };
      group.children.push({ title: k.keyword, value: k.id });
      byMovie.set(key, group);
    }
    return [...byMovie.entries()]
      .sort((a, b) => a[1].title.localeCompare(b[1].title, undefined, { sensitivity: "base" }))
      .map(([key, group]) => ({
        title: group.title,
        value: `movie:${key}`,
        children: group.children.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" })),
      }));
  }, [keywords]);

  const save = useMutation({
    mutationFn: () => api.setOmarCommentKeywords(selectedIds, allVideos),
    onSuccess: (res) => {
      queryClient.setQueryData(["omar", "comment-keywords"], res);
      setDraft(null);
      setAllDraft(null);
      message.success(res.keyword_ids.length ? t("omarCommentKeywordsSaved", { n: res.keyword_ids.length }) : t("omarCommentKeywordsReset"));
    },
  });
  const dirty =
    JSON.stringify([...value].sort()) !== JSON.stringify([...(saved.data?.keyword_ids ?? [])].sort()) ||
    allVideos !== (saved.data?.all_videos ?? false);

  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">{t("omarCommentKeywords")}</span>
      <div className="flex gap-2">
        <TreeSelect
          multiple
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_CHILD}
          allowClear
          showSearch
          treeNodeFilterProp="title"
          maxTagCount="responsive"
          className="min-w-0 flex-1"
          loading={keywordsLoading || saved.isLoading}
          placeholder={t("omarCommentKeywordsPlaceholder", { n: hashtagCount })}
          value={value}
          onChange={(next) => setDraft(next as string[])}
          treeData={treeData}
        />
        <Button type="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>
          {t("omarCommentKeywordsSave")}
        </Button>
      </div>
      <Tooltip title={selectedIds.length ? t("omarCommentAllVideosHint") : t("omarCommentAllVideosNeedKeywords")} placement="topLeft">
        <Checkbox
          className="self-start"
          checked={allVideos && selectedIds.length > 0}
          disabled={selectedIds.length === 0}
          onChange={(e) => setAllDraft(e.target.checked)}
        >
          {t("omarCommentAllVideos")}
        </Checkbox>
      </Tooltip>
      <Hint text={allVideos && selectedIds.length > 0 ? t("omarCommentKeywordsHintAll") : t("omarCommentKeywordsHint")} />
    </div>
  );
}
