import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { prpcClient, buildRpcUrl } from "@/lib/prpc-client";
import { buildCacheKey } from "@/lib/api";
import { withCache } from "@/lib/cache";
import { successResponse, errorResponse, handleError } from "@/lib/api";
import { IdOrPubkeySchema } from "@/lib/validations";
import { mapPNodeToDetail } from "@/lib/mappers/pnodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idOrPubkey: string }> }
) {
  try {
    const { idOrPubkey } = await params;

    IdOrPubkeySchema.parse(idOrPubkey);

    const cacheKey = buildCacheKey(["v1", "pnodes", "item", idOrPubkey]);

    const result = await withCache(
      cacheKey,
      30, // 30 seconds TTL
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

        if (pnode.rpcPort && pnode.rpcPort > 0 && pnode.rpcPort <= 65535) {
          try {
            const rpcUrl = buildRpcUrl(pnode.ipAddress, pnode.rpcPort);
            const liveStats = await prpcClient.getStats(rpcUrl);

            // Round timestamp to nearest minute to match cron behavior
            const timestamp = new Date();
            timestamp.setSeconds(0, 0);

            latestStats = await prisma.pNodeStats.upsert({
              where: {
                pnodeId_timestamp: {
                  pnodeId: pnode.id,
                  timestamp: timestamp,
                },
              },
              update: {
                // Update with live heavy stats (cron leaves these NULL)
                cpuPercent: liveStats.cpu_percent,
                ramUsed: BigInt(liveStats.ram_used),
                ramTotal: BigInt(liveStats.ram_total),
                activeStreams: liveStats.active_streams,
                packetsReceived: BigInt(liveStats.packets_received),
                packetsSent: BigInt(liveStats.packets_sent),
                totalBytes: BigInt(liveStats.total_bytes),
                totalPages: liveStats.total_pages,
                currentIndex: liveStats.current_index,
                uptime: liveStats.uptime,
              },
              create: {
                pnodeId: pnode.id,
                timestamp: timestamp,
                storageCommitted: pnode.storageCommitted,
                storageUsed: pnode.storageUsed,
                storageUsagePercent: pnode.storageUsagePercent,
                uptime: liveStats.uptime,
                healthScore: pnode.healthScore,
                // Heavy stats from get-stats RPC
                cpuPercent: liveStats.cpu_percent,
                ramUsed: BigInt(liveStats.ram_used),
                ramTotal: BigInt(liveStats.ram_total),
                activeStreams: liveStats.active_streams,
                packetsReceived: BigInt(liveStats.packets_received),
                packetsSent: BigInt(liveStats.packets_sent),
                totalBytes: BigInt(liveStats.total_bytes),
                totalPages: liveStats.total_pages,
                currentIndex: liveStats.current_index,
              },
            });

            await prisma.pNode.update({
              where: { id: pnode.id },
              data: {
                lastSeenAt: new Date(),
                lastSeenTimestamp: Math.floor(Date.now() / 1000),
              },
            });
          } catch (rpcError) {
            console.warn(
              `[API] Failed to fetch live stats for ${pnode.pubkey}:`,
              rpcError
            );
          }
        } else {
          console.warn(
            `[API] Skipping live stats for ${pnode.pubkey}: invalid RPC port ${pnode.rpcPort}`
          );
        }

        return mapPNodeToDetail(pnode, latestStats);
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
