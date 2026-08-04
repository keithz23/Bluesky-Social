import { useQuery } from "@tanstack/react-query";
import { ExploreService } from "../services/explore.service";

export const useExplore = (q: string) =>
  useQuery({
    queryKey: ["explore", q],
    queryFn: () => ExploreService.getExplore(q || undefined, 10),
    staleTime: 60_000,
  });
