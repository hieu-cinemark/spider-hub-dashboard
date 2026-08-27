import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
    },
  });
}
