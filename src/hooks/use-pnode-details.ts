import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PNodeDetail } from "@/lib/types";

export function usePnodeDetails(idOrPubkey: string) {
  return useQuery<PNodeDetail>({
    queryKey: ["pnode-details", idOrPubkey, false],
    queryFn: () => apiClient.getPnodeDetails(idOrPubkey, false),
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}
