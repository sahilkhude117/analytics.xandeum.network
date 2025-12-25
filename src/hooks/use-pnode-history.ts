import { useQuery } from "@tanstack/react-query";
import { apiClient, TimeRange } from "@/lib/api-client";
import type { PNodeHistory } from "@/lib/types";

export function usePnodeHistory(
  idOrPubkey: string,
  timeRange: TimeRange = "24h",
  includeLive = true
) {
  return useQuery<PNodeHistory>({
    queryKey: ["pnode-history", idOrPubkey, timeRange, includeLive],
    queryFn: () => apiClient.getPnodeHistory(idOrPubkey, timeRange, includeLive),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}
