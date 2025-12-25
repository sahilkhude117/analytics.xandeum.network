import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { NetworkStats, NetworkHybridResponse } from "@/lib/types";

export function useNetworkData() {
  return useQuery<NetworkStats | NetworkHybridResponse>({
    queryKey: ["network"],
    queryFn: () => apiClient.getNetworkStats(false),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
