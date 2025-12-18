
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prpcClient } from "@/lib/prpc-client";
import { buildCacheKey } from "@/lib/api";
import { withCache } from "@/lib/cache";
import { successResponse, handleError } from "@/lib/api";
import { mapNetworkStatsToDto } from "@/lib/mappers";
import { calculateHealthScore } from "@/lib/health-score";
import type {
  NetworkStats,
  NetworkHybridResponse,
  NetworkLiveMetrics,
  NetworkDetailedMetrics,
} from "@/lib/types";
import { formatAge } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    const cacheKey = buildCacheKey(["v1", "network", "current", String(refresh)]);
    const cacheTTL = refresh ? 0 : 300; // 5 min cache for historical, 0 for refresh

    const result = await withCache(
      cacheKey,
      cacheTTL,
      async (): Promise<NetworkStats | NetworkHybridResponse> => {

        const latestStats = await prisma.networkStats.findFirst({
          orderBy: { timestamp: "desc" },
        });

        if (!latestStats) {
          throw new Error("Network stats not initialized");
        }

        if (!refresh) {
          return mapNetworkStatsToDto(latestStats);
        }

        try {
          console.log("[NETWORK] Fetching live network stats via get-pods-with-stats");
          const podsResult = await prpcClient.getPodsWithStats();

          const validPods = podsResult.pods.filter(
            (pod) => pod.pubkey && pod.pubkey.length > 0
          );

          const now = Date.now() / 1000;
          const fiveMinutesAgo = now - 300;
          const oneHourAgo = now - 3600;

          let onlineCount = 0;
          let degradedCount = 0;
          let offlineCount = 0;
          let publicCount = 0;
          let privateCount = 0;

          let totalStorageCommitted = BigInt(0);
          let totalStorageUsed = BigInt(0);
          let totalUptime = 0;
          let totalHealthScore = 0;

          validPods.forEach((pod) => {
            if (pod.last_seen_timestamp >= fiveMinutesAgo) {
              onlineCount++;
            } else if (pod.last_seen_timestamp >= oneHourAgo) {
              degradedCount++;
            } else {
              offlineCount++;
            }

            if (pod.is_public) {
              publicCount++;
            } else {
              privateCount++;
            }

            totalStorageCommitted += BigInt(pod.storage_committed || 0);
            totalStorageUsed += BigInt(pod.storage_used || 0);
            totalUptime += pod.uptime;

            const lastSeenMinutes = (now - pod.last_seen_timestamp) / 60;
            const healthScore = calculateHealthScore({
              storageUsagePercent: pod.storage_usage_percent || 0,
              uptime: pod.uptime,
              lastSeenMinutes,
            });
            totalHealthScore += healthScore;
          });

          const totalNodes = validPods.length;
          const avgStorageUsagePercent =
            totalNodes > 0
              ? validPods.reduce((sum, pod) => sum + (pod.storage_usage_percent || 0), 0) / totalNodes
              : 0;
          const avgUptime = totalNodes > 0 ? Math.round(totalUptime / totalNodes) : 0;
          const avgHealthScore = totalNodes > 0 ? Math.round(totalHealthScore / totalNodes) : 0;

          const liveMetrics: NetworkLiveMetrics = {
            timestamp: new Date().toISOString(),
            totalPNodes: totalNodes,
            onlinePNodes: onlineCount,
            degradedPNodes: degradedCount,
            offlinePNodes: offlineCount,
            publicPNodes: publicCount,
            privatePNodes: privateCount,
            totalStorageCommitted: totalStorageCommitted.toString(),
            totalStorageUsed: totalStorageUsed.toString(),
            avgStorageUsagePercent: Math.round(avgStorageUsagePercent * 100) / 100,
            avgUptime,
            networkHealthScore: avgHealthScore,
          };

          const detailedMetrics: NetworkDetailedMetrics = {
            timestamp: latestStats.timestamp.toISOString(),
            avgCpuPercent: latestStats.avgCpuPercent,
            avgRamUsagePercent: latestStats.avgRamUsagePercent,
            totalActiveStreams: latestStats.totalActiveStreams,
            totalPacketsReceived: latestStats.totalPacketsReceived?.toString() ?? null,
            totalPacketsSent: latestStats.totalPacketsSent?.toString() ?? null,
            totalBytes: latestStats.totalBytes?.toString() ?? null,
            totalPages: latestStats.totalPages,
            detailedStatsCoverage: latestStats.detailedStatsCoverage,
          };

          const nowTimestamp = Date.now();
          const detailedDataAge = Math.floor(
            (nowTimestamp - latestStats.timestamp.getTime()) / 1000
          );

          const response: NetworkHybridResponse = {
            dataSource: "live",
            liveMetrics,
            detailedMetrics,
            metadata: {
              liveDataAge: "0s",
              detailedDataAge: formatAge(detailedDataAge),
            },
          };

          return response;
        } catch (rpcError) {
          console.warn("[NETWORK] Failed to fetch live stats, falling back to historical:", rpcError);
          // Fallback to historical data if RPC fails
          return mapNetworkStatsToDto(latestStats);
        }
      }
    );

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

