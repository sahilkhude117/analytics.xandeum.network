
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prpcClient, buildRpcUrl } from "@/lib/prpc-client";
import { buildCacheKey } from "@/lib/api";
import { withCache } from "@/lib/cache";
import { successResponse, errorResponse, handleError } from "@/lib/api";
import { IdOrPubkeySchema, HistoryQuerySchema } from "@/lib/validations";
import type {
  PNodeHistory,
  PNodeHistoryPoint,
  PNodeHistoryMetadata,
} from "@/lib/types";
import { calculateExpectedPoints, getTimeRangeMinutes, isUUID } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idOrPubkey: string }> }
) {
  try {
    const { idOrPubkey } = await params;
    const { searchParams } = new URL(request.url);

    IdOrPubkeySchema.parse(idOrPubkey);

    const query = HistoryQuerySchema.parse({
      timeRange: searchParams.get("timeRange") || undefined,
      metrics: searchParams.get("metrics") || undefined,
      includeLive: searchParams.get("includeLive") || undefined,
    });

    const cacheKey = buildCacheKey([
      "v1",
      "pnodes",
      "history",
      idOrPubkey,
      query.timeRange,
      query.metrics?.join(",") || "all",
      String(query.includeLive),
    ]);

    // Cache for 5 minutes (data updates hourly anyway)
    // Skip cache if includeLive=true (need fresh RPC data)
    const cacheTTL = query.includeLive ? 0 : 300;

    const result = await withCache(
      cacheKey,
      cacheTTL,
      async (): Promise<PNodeHistory> => {
        const isId = isUUID(idOrPubkey);

        const pnode = await prisma.pNode.findFirst({
          where: isId ? { id: idOrPubkey } : { pubkey: idOrPubkey },
        });

        if (!pnode) {
          throw new Error("PNode not found");
        }

        const minutesAgo = getTimeRangeMinutes(query.timeRange);
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - minutesAgo);
        const endTime = new Date();

        const stats = await prisma.pNodeStats.findMany({
          where: {
            pnodeId: pnode.id,
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
          "storageCommitted",
          "storageUsed",
          "storageUsagePercent",
          "cpuPercent",
          "ramUsed",
          "ramTotal",
          "ramUsagePercent",
          "uptime",
          "activeStreams",
          "packetsReceived",
          "packetsSent",
          "totalBytes",
          "totalPages",
          "healthScore",
        ];

        const availableMetrics: string[] = [];
        const unavailableMetrics: Record<string, string> = {};

        availableMetrics.push(
          "storageCommitted",
          "storageUsed",
          "storageUsagePercent",
          "uptime",
          "healthScore"
        );

        if (!pnode.isPublic) {
          unavailableMetrics["cpuPercent"] = "Node is private (no RPC access)";
          unavailableMetrics["ramUsed"] = "Node is private (no RPC access)";
          unavailableMetrics["ramTotal"] = "Node is private (no RPC access)";
          unavailableMetrics["ramUsagePercent"] =
            "Node is private (no RPC access)";
          unavailableMetrics["activeStreams"] =
            "Node is private (no RPC access)";
          unavailableMetrics["packetsReceived"] =
            "Node is private (no RPC access)";
          unavailableMetrics["packetsSent"] =
            "Node is private (no RPC access)";
          unavailableMetrics["totalBytes"] = "Node is private (no RPC access)";
          unavailableMetrics["totalPages"] = "Node is private (no RPC access)";
        } else {
          const hasDetailedStats = stats.some(
            (s) =>
              s.cpuPercent !== null ||
              s.ramUsed !== null ||
              s.activeStreams !== null
          );

          if (hasDetailedStats) {
            availableMetrics.push(
              "cpuPercent",
              "ramUsed",
              "ramTotal",
              "ramUsagePercent",
              "activeStreams",
              "packetsReceived",
              "packetsSent",
              "totalBytes",
              "totalPages"
            );
          } else {
            unavailableMetrics["cpuPercent"] =
              "No detailed stats collected yet";
            unavailableMetrics["ramUsed"] = "No detailed stats collected yet";
            unavailableMetrics["ramTotal"] = "No detailed stats collected yet";
            unavailableMetrics["ramUsagePercent"] =
              "No detailed stats collected yet";
            unavailableMetrics["activeStreams"] =
              "No detailed stats collected yet";
            unavailableMetrics["packetsReceived"] =
              "No detailed stats collected yet";
            unavailableMetrics["packetsSent"] =
              "No detailed stats collected yet";
            unavailableMetrics["totalBytes"] =
              "No detailed stats collected yet";
            unavailableMetrics["totalPages"] =
              "No detailed stats collected yet";
          }
        }

        const dataPoints: PNodeHistoryPoint[] = stats.map((stat) => ({
          timestamp: stat.timestamp.toISOString(),
          storageCommitted: stat.storageCommitted.toString(),
          storageUsed: stat.storageUsed.toString(),
          storageUsagePercent: stat.storageUsagePercent,
          cpuPercent: stat.cpuPercent ?? null,
          ramUsed: stat.ramUsed?.toString() ?? null,
          ramTotal: stat.ramTotal?.toString() ?? null,
          ramUsagePercent:
            stat.ramUsed && stat.ramTotal
              ? (Number(stat.ramUsed) / Number(stat.ramTotal)) * 100
              : null,
          uptime: stat.uptime,
          activeStreams: stat.activeStreams ?? null,
          packetsReceived: stat.packetsReceived?.toString() ?? null,
          packetsSent: stat.packetsSent?.toString() ?? null,
          totalBytes: stat.totalBytes?.toString() ?? null,
          totalPages: stat.totalPages ?? null,
          healthScore: stat.healthScore,
        }));

        const expectedPoints = calculateExpectedPoints(query.timeRange);
        const actualPoints = dataPoints.length;
        const hasGaps = actualPoints < expectedPoints;
        const gapPercentage = hasGaps
          ? ((expectedPoints - actualPoints) / expectedPoints) * 100
          : 0;

        const metadata: PNodeHistoryMetadata = {
          pubkey: pnode.pubkey,
          isPublic: pnode.isPublic,
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

        const response: PNodeHistory = {
          metadata,
          dataPoints,
        };

        if (query.includeLive && pnode.isPublic && pnode.status === "ONLINE") {
          try {
            console.log(
              `[HISTORY] Fetching live data point for ${pnode.pubkey}`
            );
            const rpcUrl = buildRpcUrl(pnode.ipAddress, pnode.rpcPort);
            const liveStats = await prpcClient.getStats(rpcUrl);

            const livePoint: PNodeHistoryPoint = {
              timestamp: new Date().toISOString(),
              storageCommitted: pnode.storageCommitted.toString(),
              storageUsed: pnode.storageUsed.toString(),
              storageUsagePercent: pnode.storageUsagePercent,
              cpuPercent: liveStats.cpu_percent,
              ramUsed: liveStats.ram_used.toString(),
              ramTotal: liveStats.ram_total.toString(),
              ramUsagePercent:
                (liveStats.ram_used / liveStats.ram_total) * 100,
              uptime: liveStats.uptime,
              activeStreams: liveStats.active_streams,
              packetsReceived: liveStats.packets_received.toString(),
              packetsSent: liveStats.packets_sent.toString(),
              totalBytes: liveStats.total_bytes.toString(),
              totalPages: liveStats.total_pages,
              healthScore: pnode.healthScore,
            };

            response.livePoint = livePoint;
          } catch (rpcError) {
            console.warn(
              `[HISTORY] Failed to fetch live data for ${pnode.pubkey}:`,
              rpcError
            );
            // Continue without live point - not critical
          }
        } else if (query.includeLive && !pnode.isPublic) {
          try {
            console.log(
              `[HISTORY] Fetching live data for private node ${pnode.pubkey} via get-pods-with-stats`
            );
            const podsResult = await prpcClient.getPodsWithStats();
            const podData = podsResult.pods.find(
              (p) => p.pubkey === pnode.pubkey
            );

            if (podData) {
              const livePoint: PNodeHistoryPoint = {
                timestamp: new Date().toISOString(),
                storageCommitted: podData.storage_committed.toString(),
                storageUsed: podData.storage_used.toString(),
                storageUsagePercent: podData.storage_usage_percent,
                cpuPercent: null,
                ramUsed: null,
                ramTotal: null,
                ramUsagePercent: null,
                uptime: podData.uptime,
                activeStreams: null,
                packetsReceived: null,
                packetsSent: null,
                totalBytes: null,
                totalPages: null,
                healthScore: pnode.healthScore,
              };

              response.livePoint = livePoint;
            } else {
              console.warn(
                `[HISTORY] Private node ${pnode.pubkey} not found in get-pods-with-stats`
              );
            }
          } catch (rpcError) {
            console.warn(
              `[HISTORY] Failed to fetch live data for private node ${pnode.pubkey}:`,
              rpcError
            );
          }
        }

        return response;
      }
    );

    return successResponse(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PNode not found") {
      return errorResponse("NOT_FOUND", "PNode not found", 404);
    }
    return handleError(error);
  }
}
