import { useQuery } from "@tanstack/react-query";
import { apiClient, SortField, SortDirection } from "@/lib/api-client";
import type { PaginatedResponse, PNodeListItem } from "@/lib/types";

export interface PodsListFilters {
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortDir?: SortDirection;
  status?: string;
  version?: string;
  country?: string;
  search?: string;
}

export function usePodsList(filters: PodsListFilters = {}) {
  return useQuery<PaginatedResponse<PNodeListItem>>({
    queryKey: ["pods-list", filters],
    queryFn: () => apiClient.getPnodesList(filters),
    staleTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: false,
  });
}
