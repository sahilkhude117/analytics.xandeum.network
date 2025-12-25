import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PNodeListItem } from "@/lib/types";

export interface MapPod {
  pubkey: string;
  ipAddress: string;
  status: string;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  healthScore: number;
  storageCommitted: string;
  storageUsed: string;
  uptime: number;
  version: string;
  isPublic: boolean;
}

export interface MapPodsData {
  pods: MapPod[];
  statusCounts: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    invalid: number;
  };
}

export function useMapPods() {
  return useQuery<MapPodsData>({
    queryKey: ["map-pods"],
    queryFn: async () => {
      const response: PaginatedResponse<PNodeListItem> = await apiClient.getPnodesList({
        pageSize: 10000,
        page: 1,
      });

      const validPods = response.items.filter(
        (pod) => pod.latitude !== null && pod.longitude !== null && pod.pubkey !== null
      );

      const statusCounts = {
        total: response.pagination.total,
        online: response.items.filter((p) => p.status === "ONLINE").length,
        degraded: response.items.filter((p) => p.status === "DEGRADED").length,
        offline: response.items.filter((p) => p.status === "OFFLINE").length,
        invalid: response.items.filter((p) => p.status === "INVALID").length,
      };

      const pods: MapPod[] = validPods.map((pod) => ({
        pubkey: pod.pubkey!,
        ipAddress: pod.ipAddress,
        status: pod.status,
        country: pod.country,
        city: pod.city,
        latitude: pod.latitude!,
        longitude: pod.longitude!,
        healthScore: pod.healthScore,
        storageCommitted: pod.storageCommitted,
        storageUsed: pod.storageUsed,
        uptime: pod.uptime,
        version: pod.version,
        isPublic: pod.isPublic,
      }));

      return { pods, statusCounts };
    },
    staleTime: 55 * 1000, // 55 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
    refetchOnWindowFocus: false,
  });
}
