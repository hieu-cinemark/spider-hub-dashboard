import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";

export function useKeywords(platform: string) {
  return useQuery({
    queryKey: ["keywords", platform],
    queryFn: () => api.keywords(platform),
    staleTime: 60_000,
  });
}

export function useCreateKeyword(platform: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ movieId, keyword }: { movieId: string; keyword: string }) =>
      api.createKeyword(platform, movieId, keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", platform] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keywordVolume(platform) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keywordVolume() });
    },
  });
}

export function useSetKeywordEnabled(platform: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keywordId, enabled }: { keywordId: string; enabled: boolean }) =>
      api.setKeywordEnabled(platform, keywordId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords", platform] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keywordVolume(platform) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.keywordVolume() });
    },
  });
}
