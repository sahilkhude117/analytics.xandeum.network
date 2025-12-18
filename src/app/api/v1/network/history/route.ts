import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prpcClient } from "@/lib/prpc-client";
import { buildCacheKey } from "@/lib/api";
import { withCache } from "@/lib/cache";
import { successResponse, handleError } from "@/lib/api";
import { HistoryQuerySchema } from "@/lib/validations";
import { calculateHealthScore } from "@/lib/health-score";
import type {
  NetworkHistoryPoint,
  NetworkHistory,
  NetworkHistoryMetadata,
} from "@/lib/types";
import { calculateExpectedPoints, getTimeRangeMinutes } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = HistoryQuerySchema.parse({
      timeRange: searchParams.get("timeRange") || undefined,
      metrics: searchParams.get("metrics") || undefined,
      includeLive: searchParams.get("includeLive") || undefined,
    });

    const cacheKey = buildCacheKey([
      "v1",
      "network",
      "history",
      query.timeRange,
      query.metrics?.join(",") || "all",
      String(query.includeLive),
    ]);

    const cacheTTL = query.includeLive ? 0 : 300;

    const result = await withCache(
      cacheKey,
      cacheTTL,
      async (): Promise<NetworkHistory> => {
        const minutesAgo = getTimeRangeMinutes(query.timeRange);
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - minutesAgo);
        const endTime = new Date();

        const stats = await prisma.networkStats.findMany({
          where: {
            timestamp: {
              gte: startTime,
              lte: endTime,
            },
          },
          orderBy: {
            timestamp: "asc",
          },
        });

        const allMetrics = [
          "totalPNodes",
          "onlinePNodes",
          "degradedPNodes",
          "offlinePNodes",
          "publicPNodes",
          "privatePNodes",
          "totalStorageCommitted",
          "totalStorageUsed",
          "avgStorageUsagePercent",
          "avgCpuPercent",
          "avgRamUsagePercent",
          "avgUptime",
          "totalActiveStreams",
          "totalPacketsReceived",
          "totalPacketsSent",
          "totalBytes",
          "totalPages",
          "networkHealthScore",
          "detailedStatsCoverage",
        ];

        const availableMetrics: string[] = [
          "totalPNodes",
          "onlinePNodes",
          "degradedPNodes",
          "offlinePNodes",
          "publicPNodes",
          "privatePNodes",
          "totalStorageCommitted",
          "totalStorageUsed",
          "avgStorageUsagePercent",
          "avgUptime",
          "networkHealthScore",
          "detailedStatsCoverage",
        ];

        const unavailableMetrics: Record<string, string> = {};

        const hasDetailedStats = stats.some(
          (s) =>
            s.avgCpuPercent !== null ||
            s.avgRamUsagePercent !== null ||
            s.totalActiveStreams !== null
        );

        if (hasDetailedStats) {
          availableMetrics.push(
            "avgCpuPercent",
            "avgRamUsagePercent",
            "totalActiveStreams",
            "totalPacketsReceived",
            "totalPacketsSent",
            "totalBytes",
            "totalPages"
          );
        } else {
          unavailableMetrics["avgCpuPercent"] =
            "No detailed stats collected yet";
          unavailableMetrics["avgRamUsagePercent"] =
            "No detailed stats collected yet";
          unavailableMetrics["totalActiveStreams"] =
            "No detailed stats collected yet";
          unavailableMetrics["totalPacketsReceived"] =
            "No detailed stats collected yet";
          unavailableMetrics["totalPacketsSent"] =
            "No detailed stats collected yet";
          unavailableMetrics["totalBytes"] = "No detailed stats collected yet";
          unavailableMetrics["totalPages"] = "No detailed stats collected yet";
        }

        const dataPoints: NetworkHistoryPoint[] = stats.map((stat) => ({
          timestamp: stat.timestamp.toISOString(),
          totalPNodes: stat.totalPNodes,
          onlinePNodes: stat.onlinePNodes,
          degradedPNodes: stat.degradedPNodes,
          offlinePNodes: stat.offlinePNodes,
          publicPNodes: stat.publicPNodes,
          privatePNodes: stat.privatePNodes,
          totalStorageCommitted: stat.totalStorageCommitted.toString(),
          totalStorageUsed: stat.totalStorageUsed.toString(),
          avgStorageUsagePercent: stat.avgStorageUsagePercent,
          avgCpuPercent: stat.avgCpuPercent ?? null,
          avgRamUsagePercent: stat.avgRamUsagePercent ?? null,
          avgUptime: stat.avgUptime,
          totalActiveStreams: stat.totalActiveStreams ?? null,
          totalPacketsReceived: stat.totalPacketsReceived?.toString() ?? null,
          totalPacketsSent: stat.totalPacketsSent?.toString() ?? null,
          totalBytes: stat.totalBytes?.toString() ?? null,
          totalPages: stat.totalPages ?? null,
          networkHealthScore: stat.networkHealthScore,
          detailedStatsCoverage: stat.detailedStatsCoverage,
        }));

        const expectedPoints = calculateExpectedPoints(query.timeRange);
        const actualPoints = dataPoints.length;
        const hasGaps = actualPoints < expectedPoints;
        const gapPercentage = hasGaps
          ? ((expectedPoints - actualPoints) / expectedPoints) * 100
          : 0;

        const metadata: NetworkHistoryMetadata = {
          timeRange: query.timeRange,
          totalPoints: expectedPoints,
          availablePoints: actualPoints,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hasGaps,
          gapPercentage: Math.round(gapPercentage * 10) / 10,
          availableMetrics,
          unavailableMetrics,
        };

        const response: NetworkHistory = {
          metadata,
          dataPoints,
        };

        if (query.includeLive) {
          try {
            console.log("[NETWORK-HISTORY] Fetching live network data point");
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

            const livePoint: NetworkHistoryPoint = {
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
              avgCpuPercent: null, // Not available in live basic stats
              avgRamUsagePercent: null, // Not available in live basic stats
              avgUptime,
              totalActiveStreams: null, // Not available in live basic stats
              totalPacketsReceived: null, // Not available in live basic stats
              totalPacketsSent: null, // Not available in live basic stats
              totalBytes: null, // Not available in live basic stats
              totalPages: null, // Not available in live basic stats
              networkHealthScore: avgHealthScore,
              detailedStatsCoverage: 0, // No detailed stats in live mode
            };

            response.livePoint = livePoint;
          } catch (rpcError) {
            console.warn(
              "[NETWORK-HISTORY] Failed to fetch live network data:",
              rpcError
            );
            // Continue without live point - not critical
          }
        }

        return response;
      }
    );

    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
