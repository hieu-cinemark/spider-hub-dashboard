import { App } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
