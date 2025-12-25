import { useQuery } from "@tanstack/react-query";
import { apiClient, SortField } from "@/lib/api-client";
import type { PaginatedResponse, PNodeListItem } from "@/lib/types";

export type PerformanceSortOption = "reliability" | "storage" | "uptime" | "storageCommitted";

const SORT_FIELD_MAP: Record<PerformanceSortOption, SortField> = {
  reliability: "healthScore",
  storage: "storageUsagePercent",
  uptime: "uptime",
  storageCommitted: "storageCommitted",
};

export interface TopPerformersParams {
  sortBy?: PerformanceSortOption;
}

export function useTopPerformers(params: TopPerformersParams = {}) {
  const { sortBy = "reliability" } = params;
  
  return useQuery<PaginatedResponse<PNodeListItem>>({
    queryKey: ["top-performers", sortBy],
    queryFn: () => apiClient.getPnodesList({
      page: 1,
      pageSize: 10,
      sortBy: SORT_FIELD_MAP[sortBy],
      sortDir: "desc",
    }),
    staleTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: false,
  });
}
