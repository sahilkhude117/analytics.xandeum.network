import type { NetworkStats as NetworkStatsModel } from "../../../prisma/generated/client/client";
import { Network as NetworkModel } from "../../../prisma/generated/client/client";
import type { Network, NetworkStats } from "../types";

export function mapNetworkToDto(network: NetworkModel): Network {
  return {
    timestamp: network.timestamp.toISOString(),
    totalPNodes: network.totalPNodes,
    onlinePNodes: network.onlinePNodes,
    degradedPNodes: network.degradedPNodes,
    offlinePNodes: network.offlinePNodes,
    totalStorageCommitted: network.totalStorageCommitted.toString(),
    totalStorageUsed: network.totalStorageUsed.toString(),
    avgStorageUsagePercent: network.avgStorageUsagePercent,
    avgUptime: network.avgUptime,
    networkHealthScore: network.networkHealthScore,
  };
}

export function mapNetworkStatsToDto(stats: NetworkStatsModel): NetworkStats {
  return {
    timestamp: stats.timestamp.toISOString(),
    totalPNodes: stats.totalPNodes,
    onlinePNodes: stats.onlinePNodes,
    degradedPNodes: stats.degradedPNodes,
    offlinePNodes: stats.offlinePNodes,
    publicPNodes: stats.publicPNodes,
    privatePNodes: stats.privatePNodes,
    detailedStatsCoverage: stats.detailedStatsCoverage,
    totalStorageCommitted: stats.totalStorageCommitted.toString(),
    totalStorageUsed: stats.totalStorageUsed.toString(),
    avgStorageUsagePercent: stats.avgStorageUsagePercent,
    avgCpuPercent: stats.avgCpuPercent ?? null,
    avgRamUsagePercent: stats.avgRamUsagePercent ?? null,
    avgUptime: stats.avgUptime,
    totalActiveStreams: stats.totalActiveStreams ?? null,
    totalPacketsReceived: stats.totalPacketsReceived?.toString() ?? null,
    totalPacketsSent: stats.totalPacketsSent?.toString() ?? null,
    totalBytes: stats.totalBytes?.toString() ?? null,
    totalPages: stats.totalPages ?? null,
    networkHealthScore: stats.networkHealthScore,
  };
}
