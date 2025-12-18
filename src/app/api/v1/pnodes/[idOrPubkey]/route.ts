
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prpcClient, buildRpcUrl } from "@/lib/prpc-client";
import { buildCacheKey } from "@/lib/api";
import { withCache } from "@/lib/cache";
import { successResponse, errorResponse, handleError } from "@/lib/api";
import { IdOrPubkeySchema } from "@/lib/validations";
import { mapPNodeToDetail } from "@/lib/mappers/pnodes";
import { isUUID } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idOrPubkey: string }> }
) {
  try {
    const { idOrPubkey } = await params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    IdOrPubkeySchema.parse(idOrPubkey);

    const cacheKey = buildCacheKey(["v1", "pnodes", "item", idOrPubkey]);
    const cacheTTL = refresh ? 0 : 30;

    const result = await withCache(
      cacheKey,
      cacheTTL,
      async () => {
        const isId = isUUID(idOrPubkey);

        const pnode = await prisma.pNode.findFirst({
          where: isId ? { id: idOrPubkey } : { pubkey: idOrPubkey },
        });

        if (!pnode) {
          throw new Error("PNode not found");
        }

        let latestStats = await prisma.pNodeStats.findFirst({
          where: { pnodeId: pnode.id },
          orderBy: { timestamp: "desc" },
        });

        let dataSource: "live" | "historical" | "unavailable" = latestStats
          ? "historical"
          : "unavailable";

        const shouldFetchLive =
          (refresh || pnode.status === "ONLINE") &&
          pnode.isPublic &&
          pnode.rpcPort &&
          pnode.rpcPort > 0 &&
          pnode.rpcPort <= 65535;

        if (shouldFetchLive) {
          try {
            console.log(
              `[API] Fetching live stats for ${pnode.pubkey} (refresh=${refresh}, status=${pnode.status})`
            );
            const rpcUrl = buildRpcUrl(pnode.ipAddress, pnode.rpcPort);
            const liveStats = await prpcClient.getStats(rpcUrl);

            const timestamp = new Date();
            timestamp.setSeconds(0, 0);

            latestStats = {
              id: BigInt(0),
              pnodeId: pnode.id,
              timestamp: timestamp,
              storageCommitted: pnode.storageCommitted,
              storageUsed: pnode.storageUsed,
              storageUsagePercent: pnode.storageUsagePercent,
              uptime: liveStats.uptime,
              healthScore: pnode.healthScore,
              cpuPercent: liveStats.cpu_percent,
              ramUsed: BigInt(liveStats.ram_used),
              ramTotal: BigInt(liveStats.ram_total),
              activeStreams: liveStats.active_streams,
              packetsReceived: BigInt(liveStats.packets_received),
              packetsSent: BigInt(liveStats.packets_sent),
              totalBytes: BigInt(liveStats.total_bytes),
              totalPages: liveStats.total_pages,
              currentIndex: liveStats.current_index,
            };

            dataSource = "live";
          } catch (rpcError) {
            console.warn(
              `[API] Failed to fetch live stats for ${pnode.pubkey}:`,
              rpcError
            );
          }
        } else if (refresh && !pnode.isPublic) {
          try {
            console.log(
              `[API] Refreshing private node ${pnode.pubkey} via get-pods-with-stats`
            );
            const podsResult = await prpcClient.getPodsWithStats();
            const podData = podsResult.pods.find(
              (p) => p.pubkey === pnode.pubkey
            );

            if (podData) {
              const timestamp = new Date();
              timestamp.setSeconds(0, 0);

              latestStats = {
                id: BigInt(0),
                pnodeId: pnode.id,
                timestamp: timestamp,
                storageCommitted: BigInt(podData.storage_committed),
                storageUsed: BigInt(podData.storage_used),
                storageUsagePercent: podData.storage_usage_percent,
                uptime: podData.uptime,
                healthScore: pnode.healthScore,
                cpuPercent: null,
                ramUsed: null,
                ramTotal: null,
                activeStreams: null,
                packetsReceived: null,
                packetsSent: null,
                totalBytes: null,
                totalPages: null,
                currentIndex: null,
              };
              dataSource = "live";
            } else {
              console.warn(
                `[API] Private node ${pnode.pubkey} not found in get-pods-with-stats`
              );
            }
          } catch (rpcError) {
            console.warn(
              `[API] Failed to refresh private node ${pnode.pubkey}:`,
              rpcError
            );
          }
        }

        return mapPNodeToDetail(pnode, latestStats, dataSource);
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
