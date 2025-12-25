import { useQuery } from "@tanstack/react-query";
import { apiClient, TimeRange } from "@/lib/api-client";
import type { NetworkHistory } from "@/lib/types";

export function useNetworkHistory(timeRange: TimeRange = "24h") {
  return useQuery<NetworkHistory>({
    queryKey: ["network-history", timeRange],
    queryFn: () => apiClient.getNetworkHistory(timeRange, true),
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });
}
