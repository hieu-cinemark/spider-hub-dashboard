import { App } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ApiError, api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { QUERY_KEYS } from "@/lib/constants";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { MovieInput } from "@/lib/types";

export function useMovies() {
  return useQuery({
    queryKey: QUERY_KEYS.movies,
    queryFn: api.movies,
    staleTime: 60_000,
  });
}

export function useMovieMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movies });
  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const create = useMutation({
    mutationFn: (input: MovieInput) => api.createMovie(input),
    onSuccess: () => {
      message.success(t("toastMovieAdded"));
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovieInput }) => api.updateMovie(id, input),
    onSuccess: () => {
      message.success(t("toastMovieUpdated"));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMovie(id),
    onSuccess: () => {
      message.success(t("toastMovieRemoved"));
      invalidate();
    },
    onError,
  });

  return { create, update, remove };
}

// Separate from useMovieMutations: this doesn't touch the movies list
// itself (no invalidate) and only enqueues (app/services/report_queue.py
// on the backend) - it returns as soon as the job is queued, well before
// the report itself is ready. See useReportJobStatus below for the actual
// queued/running/done/failed result, which is what the button's own
// loading state and success/error toast are driven by now - multiple
// movies can be queued/running at once, unlike the old single blocking
// mutation this replaced.
export function useGenerateReportMutation() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: string) => api.generateMovieReport(movieId),
    onSuccess: (_data, movieId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reportJobStatus(movieId) });
    },
    onError: (err: unknown) => {
      // Only the enqueue call itself failing lands here (movie not found,
      // network error) - a report that fails once running surfaces
      // through useReportJobStatus's own toast instead.
      message.error(err instanceof ApiError && err.message ? err.message : translateApiError(err, t));
    },
  });
}

// Polls app/api/routes/movies.py's GET .../generate-report while a job is
// queued/running, stopping once it settles. Fires the success/error toast
// exactly once per settled status (the effect's own [status] dependency
// only re-runs on an actual transition, not on every poll).
export function useReportJobStatus(movieId: string) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const notified = useRef<string | null>(null);

  const query = useQuery({
    queryKey: QUERY_KEYS.reportJobStatus(movieId),
    queryFn: () => api.generateMovieReportStatus(movieId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "queued" || status === "running" ? 3000 : false;
    },
  });

  const status = query.data?.status;
  useEffect(() => {
    if (status !== "done" && status !== "failed") return;
    const key = `${movieId}:${status}`;
    if (notified.current === key) return;
    notified.current = key;
    if (status === "done") {
      message.success(t("toastReportGenerated"));
    } else {
      message.error(query.data?.error || t("toastReportFailed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return query;
}
