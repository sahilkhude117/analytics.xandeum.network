import type { PNode, PNodeStats } from "../../../prisma/generated/client/client";
import type { PNodeListItem, PNodeDetail } from "../types";

export function mapPNodeToListItem(pnode: PNode): PNodeListItem {
  return {
    pubkey: pnode.pubkey,
    ipAddress: pnode.ipAddress,
    status: pnode.status,
    version: pnode.version,
    country: pnode.country,
    city: pnode.city,
    latitude: pnode.latitude,
    longitude: pnode.longitude,
    storageCommitted: pnode.storageCommitted.toString(),
    storageUsed: pnode.storageUsed.toString(),
    storageUsagePercent: pnode.storageUsagePercent,
    uptime: pnode.uptime,
    lastSeenAt: pnode.lastSeenAt.toISOString(),
    healthScore: pnode.healthScore,
    isPublic: pnode.isPublic,
  };
}

export function mapPNodeToDetail(
  pnode: PNode,
  latestStats?: PNodeStats | null,
  dataSource: "live" | "historical" | "unavailable" = "historical"
): PNodeDetail {
  return {
    id: pnode.id,
    pubkey: pnode.pubkey,
    ipAddress: pnode.ipAddress,
    gossipPort: pnode.gossipPort,
    rpcPort: pnode.rpcPort,
    gossipAddress: pnode.gossipAddress,
    isPublic: pnode.isPublic,
    status: pnode.status,
    version: pnode.version,
    country: pnode.country,
    city: pnode.city,
    latitude: pnode.latitude,
    longitude: pnode.longitude,
    storageCommitted: pnode.storageCommitted.toString(),
    storageUsed: pnode.storageUsed.toString(),
    storageUsagePercent: pnode.storageUsagePercent,
    uptime: pnode.uptime,
    lastSeenAt: pnode.lastSeenAt.toISOString(),
    firstSeenAt: pnode.firstSeenAt.toISOString(),
    healthScore: pnode.healthScore,
    cpuPercent: latestStats?.cpuPercent ?? null,
    ramUsed: latestStats?.ramUsed?.toString() ?? null,
    ramTotal: latestStats?.ramTotal?.toString() ?? null,
    activeStreams: latestStats?.activeStreams ?? null,
    packetsReceived: latestStats?.packetsReceived?.toString() ?? null,
    packetsSent: latestStats?.packetsSent?.toString() ?? null,
    totalBytes: latestStats?.totalBytes?.toString() ?? null,
    totalPages: latestStats?.totalPages ?? null,
    currentIndex: latestStats?.currentIndex ?? null,
    dataSource,
    statsTimestamp: latestStats?.timestamp.toISOString() ?? null,
  };
}
