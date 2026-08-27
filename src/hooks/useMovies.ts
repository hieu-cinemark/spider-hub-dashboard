import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: api.movies,
    staleTime: 60_000,
  });
}
