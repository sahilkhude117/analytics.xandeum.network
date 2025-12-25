
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prpcClient } from "@/lib/prpc-client";
import { buildCacheKey } from "@/lib/api";
import { withCache } from "@/lib/cache";
import { successResponse, handleError } from "@/lib/api";
import { mapNetworkStatsToDto } from "@/lib/mappers";
import { calculateHealthScore, getHealthStatus } from "@/lib/health-score";
import type {
  NetworkStats,
  NetworkHybridResponse,
  NetworkLiveMetrics,
  NetworkDetailedMetrics,
} from "@/lib/types";
import { formatAge } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    const cacheKey = buildCacheKey(["v1", "network", "current-v2", String(refresh)]);
    const cacheTTL = refresh ? 0 : 300; 

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

        const allPods = await prisma.pNode.findMany({
          where: {
            pubkey: { not: null },
            status: { not: "INVALID" },
          },
          select: {
            version: true,
            storageCommitted: true,
          },
        });

        const versionCounts = new Map<string, number>();
        const storageValues: number[] = [];

        allPods.forEach((pod) => {
          const version = pod.version || "Unknown";
          versionCounts.set(version, (versionCounts.get(version) || 0) + 1);

          const storageGB = Number(pod.storageCommitted || BigInt(0)) / (1024 * 1024 * 1024);
          storageValues.push(storageGB);
        });

        const versionDistribution = Array.from(versionCounts.entries())
          .map(([version, count]) => ({ version, count }))
          .sort((a, b) => b.count - a.count);

        const maxStorage = storageValues.length > 0 ? Math.max(...storageValues) : 0;
        const maxStorageTB = maxStorage / 1024;
        
        let storageRanges: { min: number; max: number }[] = [];
        
        if (maxStorageTB <= 1) {
          const maxGB = maxStorage;
          if (maxGB <= 10) {
            storageRanges = [
              { min: 0, max: 1 },
              { min: 1, max: 5 },
              { min: 5, max: 10 },
              { min: 10, max: maxGB + 1 },
            ];
          } else if (maxGB <= 100) {
            storageRanges = [
              { min: 0, max: 1 },
              { min: 1, max: 10 },
              { min: 10, max: 30 },
              { min: 30, max: 60 },
              { min: 60, max: 100 },
              { min: 100, max: maxGB + 1 },
            ];
          } else {
            storageRanges = [
              { min: 0, max: 10 },
              { min: 10, max: 50 },
              { min: 50, max: 100 },
              { min: 100, max: 500 },
              { min: 500, max: 1000 },
              { min: 1000, max: maxGB + 1 },
            ];
          }
        } else {
          if (maxStorageTB <= 5) {
            storageRanges = [
              { min: 0, max: 0.5 * 1024 },
              { min: 0.5 * 1024, max: 1 * 1024 },
              { min: 1 * 1024, max: 2 * 1024 },
              { min: 2 * 1024, max: 3 * 1024 },
              { min: 3 * 1024, max: 5 * 1024 },
              { min: 5 * 1024, max: maxStorage + 1 },
            ];
          } else if (maxStorageTB <= 20) {
            storageRanges = [
              { min: 0, max: 1 * 1024 },
              { min: 1 * 1024, max: 5 * 1024 },
              { min: 5 * 1024, max: 10 * 1024 },
              { min: 10 * 1024, max: 15 * 1024 },
              { min: 15 * 1024, max: 20 * 1024 },
              { min: 20 * 1024, max: maxStorage + 1 },
            ];
          } else {
            storageRanges = [
              { min: 0, max: 5 * 1024 },
              { min: 5 * 1024, max: 10 * 1024 },
              { min: 10 * 1024, max: 20 * 1024 },
              { min: 20 * 1024, max: 50 * 1024 },
              { min: 50 * 1024, max: 100 * 1024 },
              { min: 100 * 1024, max: maxStorage + 1 },
            ];
          }
        }

        const formatSize = (gb: number): string => {
          if (gb >= 1024) {
            const tb = gb / 1024;
            return tb % 1 === 0 ? `${tb}TB` : `${tb.toFixed(1)}TB`;
          }
          return gb % 1 === 0 ? `${gb}GB` : `${gb.toFixed(1)}GB`;
        };

        const storageDistribution = storageRanges.map(({ min, max }) => {
          const count = storageValues.filter(v => v >= min && v < max).length;
          const minLabel = min === 0 ? '0' : formatSize(min);
          const maxLabel = max >= maxStorage ? `${formatSize(Math.ceil(max))}+` : formatSize(max);
          
          return {
            range: `${minLabel}–${maxLabel}`,
            count,
            min,
            max,
          };
        }).filter(item => item.count > 0 || item.min === 0);

        const advancedMetrics = {
          avgCpu: latestStats.avgCpuPercent || 0,
          avgRam: latestStats.avgRamUsagePercent || 0,
          totalStreams: latestStats.totalActiveStreams || 0,
          totalPacketsSent: latestStats.totalPacketsSent?.toString() || "0",
          totalPacketsReceived: latestStats.totalPacketsReceived?.toString() || "0",
          totalPages: latestStats.totalPages || 0,
        };

        if (!refresh) {
          const historicalData = mapNetworkStatsToDto(latestStats);
          const result = {
            ...historicalData,
            versionDistribution,
            storageDistribution,
            advancedMetrics,
          } as NetworkStats;
          
          console.log("[NETWORK] Returning historical data with distributions:", {
            hasVersionDist: !!result.versionDistribution,
            versionCount: result.versionDistribution?.length,
            hasStorageDist: !!result.storageDistribution,
            storageCount: result.storageDistribution?.length,
            hasAdvanced: !!result.advancedMetrics,
            publicPods: result.publicPNodes,
            privatePods: result.privatePNodes,
          });
          
          return result;
        }

        try {
          console.log("[NETWORK] Fetching live network stats via get-pods-with-stats");
          const podsResult = await prpcClient.getPodsWithStats();

          const validPods = podsResult.pods.filter(
            (pod) => pod.pubkey && pod.pubkey.length > 0 && pod.address && pod.address.trim() !== ''
          );

          const now = Date.now() / 1000;

          let onlineCount = 0;
          let degradedCount = 0;
          let offlineCount = 0;
          let publicCount = 0;
          let privateCount = 0;

          let totalStorageCommitted = BigInt(0);
          let totalStorageUsed = BigInt(0);
          let totalUptime = 0;
          let totalHealthScore = 0;

  
          const versionCounts = new Map<string, number>();
          const storageValues: number[] = [];

          validPods.forEach((pod) => {
            const lastSeenMinutes = (now - pod.last_seen_timestamp) / 60;
            const healthScore = calculateHealthScore({
              storageUsagePercent: pod.storage_usage_percent || 0,
              uptime: pod.uptime,
              lastSeenMinutes,
            });
            
            const status = getHealthStatus(healthScore);

            if (status === "ONLINE") {
              onlineCount++;
            } else if (status === "DEGRADED") {
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
            totalHealthScore += healthScore;

            const version = pod.version || "Unknown";
            versionCounts.set(version, (versionCounts.get(version) || 0) + 1);

            const storageGB = Number(BigInt(pod.storage_committed || 0)) / (1024 * 1024 * 1024);
            storageValues.push(storageGB);
          });

          const totalNodes = validPods.length;
          const avgStorageUsagePercent =
            totalNodes > 0
              ? validPods.reduce((sum, pod) => sum + (pod.storage_usage_percent || 0), 0) / totalNodes
              : 0;
          const avgUptime = totalNodes > 0 ? Math.round(totalUptime / totalNodes) : 0;
          const avgHealthScore = totalNodes > 0 ? Math.round(totalHealthScore / totalNodes) : 0;

          const versionDistribution = Array.from(versionCounts.entries())
            .map(([version, count]) => ({ version, count }))
            .sort((a, b) => b.count - a.count);

          // Calculate storage distribution with intelligent ranges
          const maxStorage = storageValues.length > 0 ? Math.max(...storageValues) : 0;
          const sortedStorages = [...storageValues].sort((a, b) => a - b);
          
          // Convert to TB for better readability
          const maxStorageTB = maxStorage / 1024;
          
          // Create intelligent ranges based on data distribution
          let storageRanges: { min: number; max: number }[] = [];
          
          if (maxStorageTB <= 1) {
            // Less than 1TB: use GB ranges
            const maxGB = maxStorage;
            if (maxGB <= 10) {
              storageRanges = [
                { min: 0, max: 1 },
                { min: 1, max: 5 },
                { min: 5, max: 10 },
                { min: 10, max: maxGB + 1 },
              ];
            } else if (maxGB <= 100) {
              storageRanges = [
                { min: 0, max: 1 },
                { min: 1, max: 10 },
                { min: 10, max: 30 },
                { min: 30, max: 60 },
                { min: 60, max: 100 },
                { min: 100, max: maxGB + 1 },
              ];
            } else {
              storageRanges = [
                { min: 0, max: 10 },
                { min: 10, max: 50 },
                { min: 50, max: 100 },
                { min: 100, max: 500 },
                { min: 500, max: 1000 },
                { min: 1000, max: maxGB + 1 },
              ];
            }
          } else {
            // Greater than 1TB: use TB ranges
            if (maxStorageTB <= 5) {
              storageRanges = [
                { min: 0, max: 0.5 * 1024 },
                { min: 0.5 * 1024, max: 1 * 1024 },
                { min: 1 * 1024, max: 2 * 1024 },
                { min: 2 * 1024, max: 3 * 1024 },
                { min: 3 * 1024, max: 5 * 1024 },
                { min: 5 * 1024, max: maxStorage + 1 },
              ];
            } else if (maxStorageTB <= 20) {
              storageRanges = [
                { min: 0, max: 1 * 1024 },
                { min: 1 * 1024, max: 5 * 1024 },
                { min: 5 * 1024, max: 10 * 1024 },
                { min: 10 * 1024, max: 15 * 1024 },
                { min: 15 * 1024, max: 20 * 1024 },
                { min: 20 * 1024, max: maxStorage + 1 },
              ];
            } else {
              storageRanges = [
                { min: 0, max: 5 * 1024 },
                { min: 5 * 1024, max: 10 * 1024 },
                { min: 10 * 1024, max: 20 * 1024 },
                { min: 20 * 1024, max: 50 * 1024 },
                { min: 50 * 1024, max: 100 * 1024 },
                { min: 100 * 1024, max: maxStorage + 1 },
              ];
            }
          }

          const storageDistribution = storageRanges.map(({ min, max }) => {
            const count = storageValues.filter(v => v >= min && v < max).length;
            
            // Format labels based on size
            const formatSize = (gb: number): string => {
              if (gb >= 1024) {
                const tb = gb / 1024;
                return tb % 1 === 0 ? `${tb}TB` : `${tb.toFixed(1)}TB`;
              }
              return gb % 1 === 0 ? `${gb}GB` : `${gb.toFixed(1)}GB`;
            };
            
            const minLabel = min === 0 ? '0' : formatSize(min);
            const maxLabel = max >= maxStorage ? `${formatSize(Math.ceil(max))}+` : formatSize(max);
            
            return {
              range: `${minLabel}–${maxLabel}`,
              count,
              min,
              max,
            };
          }).filter(item => item.count > 0 || item.min === 0);

          // Calculate advanced metrics from detailed stats
          const advancedMetrics = {
            avgCpu: latestStats.avgCpuPercent || 0,
            avgRam: latestStats.avgRamUsagePercent || 0,
            totalStreams: latestStats.totalActiveStreams || 0,
            totalPacketsSent: latestStats.totalPacketsSent?.toString() || "0",
            totalPacketsReceived: latestStats.totalPacketsReceived?.toString() || "0",
            totalPages: latestStats.totalPages || 0,
          };

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
            versionDistribution,
            storageDistribution,
            advancedMetrics,
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

