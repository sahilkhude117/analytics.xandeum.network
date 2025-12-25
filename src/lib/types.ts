import { Status } from "../../prisma/generated/client/client";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
  filters?: {
    availableVersions: string[];
    availableCountries: string[];
  };
}

export interface PNodeListItem {
  pubkey: string | null;
  ipAddress: string;
  status: Status;
  version: string;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  storageCommitted: string; // BigInt as string for JSON
  storageUsed: string;
  storageUsagePercent: number;
  uptime: number;
  lastSeenAt: string; // ISO timestamp
  healthScore: number;
  isPublic: boolean;
}

export interface PNodeDetail extends PNodeListItem {
  id: string;
  gossipPort: number;
  rpcPort: number;
  gossipAddress: string | null;
  isPublic: boolean;
  firstSeenAt: string;
  cpuPercent: number | null;
  ramUsed: string | null;
  ramTotal: string | null;
  activeStreams: number | null;
  packetsReceived: string | null;
  packetsSent: string | null;
  totalBytes: string | null;
  totalPages: number | null;
  currentIndex: number | null;
  dataSource: "live" | "historical" | "unavailable";
  statsTimestamp: string | null;
}

export interface PNodeHistoryPoint {
  timestamp: string;
  storageCommitted: string;
  storageUsed: string;
  storageUsagePercent: number;
  cpuPercent: number | null;
  ramUsed: string | null;
  ramTotal: string | null;
  ramUsagePercent: number | null;
  uptime: number;
  activeStreams: number | null;
  packetsReceived: string | null;
  packetsSent: string | null;
  totalBytes: string | null;
  totalPages: number | null;
  healthScore: number;
}

export interface PNodeHistoryMetadata {
  pubkey: string | null;
  isPublic: boolean;
  timeRange: string;
  totalPoints: number;
  availablePoints: number;
  startTime: string;
  endTime: string;
  hasGaps: boolean;
  gapPercentage: number;
  availableMetrics: string[];
  unavailableMetrics: {
    [key: string]: string; // metric -> reason
  };
}

export interface PNodeHistory {
  metadata: PNodeHistoryMetadata;
  dataPoints: PNodeHistoryPoint[];
  livePoint?: PNodeHistoryPoint; 
}

export interface NetworkHistoryPoint {
  timestamp: string;
  totalPNodes: number;
  onlinePNodes: number;
  degradedPNodes: number;
  offlinePNodes: number;
  publicPNodes: number;
  privatePNodes: number;
  totalStorageCommitted: string;
  totalStorageUsed: string;
  avgStorageUsagePercent: number;
  avgCpuPercent: number | null;
  avgRamUsagePercent: number | null;
  avgUptime: number;
  totalActiveStreams: number | null;
  totalPacketsReceived: string | null;
  totalPacketsSent: string | null;
  totalBytes: string | null;
  totalPages: number | null;
  networkHealthScore: number;
  detailedStatsCoverage: number;
}

export interface NetworkHistoryMetadata {
  timeRange: string;
  totalPoints: number;
  availablePoints: number;
  startTime: string;
  endTime: string;
  hasGaps: boolean;
  gapPercentage: number;
  availableMetrics: string[];
  unavailableMetrics: {
    [key: string]: string; // metric -> reason
  };
}

export interface NetworkHistory {
  metadata: NetworkHistoryMetadata;
  dataPoints: NetworkHistoryPoint[];
  livePoint?: NetworkHistoryPoint;
}

export interface Network {
  timestamp: string;
  totalPNodes: number;
  onlinePNodes: number;
  degradedPNodes: number;
  offlinePNodes: number;
  totalStorageCommitted: string;
  totalStorageUsed: string;
  avgStorageUsagePercent: number;
  avgUptime: number;
  networkHealthScore: number;
}

export interface NetworkStats {
  timestamp: string;
  totalPNodes: number;
  onlinePNodes: number;
  degradedPNodes: number;
  offlinePNodes: number;
  // Metadata for transparency
  publicPNodes: number; // Nodes with RPC access
  privatePNodes: number; // Nodes without RPC access
  detailedStatsCoverage: number; // Percentage (0-100)
  // Accurate metrics (from ALL nodes)
  totalStorageCommitted: string;
  totalStorageUsed: string;
  avgStorageUsagePercent: number;
  avgUptime: number;
  // Sampled metrics (from PUBLIC nodes only)
  avgCpuPercent: number | null; 
  avgRamUsagePercent: number | null; 
  totalActiveStreams: number | null; 
  totalPacketsReceived: string | null;
  totalPacketsSent: string | null;
  totalBytes: string | null;
  totalPages: number | null;
  networkHealthScore: number;
  // Optional distribution data (may not be present in all responses)
  versionDistribution?: Array<{ version: string; count: number }>;
  storageDistribution?: Array<{ range: string; count: number; min: number; max: number }>;
  advancedMetrics?: {
    avgCpu: number;
    avgRam: number;
    totalStreams: number;
    totalPacketsSent: string;
    totalPacketsReceived: string;
    totalPages: number;
  };
}

export interface NetworkLiveMetrics {
  timestamp: string;
  totalPNodes: number;
  onlinePNodes: number;
  degradedPNodes: number;
  offlinePNodes: number;
  publicPNodes: number;
  privatePNodes: number;
  totalStorageCommitted: string;
  totalStorageUsed: string;
  avgStorageUsagePercent: number;
  avgUptime: number;
  networkHealthScore: number;
  versionDistribution?: Array<{ version: string; count: number }>;
  storageDistribution?: Array<{ range: string; count: number; min: number; max: number }>;
  advancedMetrics?: {
    avgCpu: number;
    avgRam: number;
    totalStreams: number;
    totalPacketsSent: string;
    totalPacketsReceived: string;
    totalPages: number;
  };
}

export interface NetworkDetailedMetrics {
  timestamp: string;
  avgCpuPercent: number | null;
  avgRamUsagePercent: number | null;
  totalActiveStreams: number | null;
  totalPacketsReceived: string | null;
  totalPacketsSent: string | null;
  totalBytes: string | null;
  totalPages: number | null;
  detailedStatsCoverage: number;
}

export interface NetworkHybridResponse {
  dataSource: "historical" | "live";
  liveMetrics?: NetworkLiveMetrics;
  detailedMetrics: NetworkDetailedMetrics;
  metadata: {
    liveDataAge?: string;
    detailedDataAge: string;
    nextUpdateIn?: number; // Seconds until next hourly update
  };
}

export interface LiveNodeStats {
  cpuPercent: number;
  ramUsed: string;
  ramTotal: string;
  activeStreams: number;
  packetsReceived: string;
  packetsSent: string;
  totalBytes: string;
  totalPages: number;
  currentIndex: number;
  lastUpdated: string;
}

// Pod Details Page Types
export type Visibility = "PUBLIC" | "PRIVATE";

export interface PodDetails {
  // Always available
  pubkey: string;
  ip: string;
  gossipPort: number;
  version: string;
  status: Status;
  rpcPort: number;
  visibility: Visibility;
  storageCommitted: number; // GB
  storageUsed: number; // GB
  uptime: number; // seconds
  healthScore: number;
  lastSeen: Date;
  firstSeen: Date;
  city?: string;
  country?: string;

  // Public node only
  cpuPercent?: number;
  ramUsed?: number;
  ramTotal?: number;
  activeStreams?: number;
  packetsSent?: number;
  packetsReceived?: number;
  totalBytes?: number;
  totalPages?: number;
  currentIndex?: number;

  // Time series data
  storageHistory: Array<{
    timestamp: Date;
    committed: number;
    used: number;
  }>;
  cpuHistory?: Array<{
    timestamp: Date;
    percent: number;
  }>;
  ramHistory?: Array<{
    timestamp: Date;
    used: number;
    total: number;
  }>;
}
