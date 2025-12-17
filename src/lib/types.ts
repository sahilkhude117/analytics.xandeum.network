import { Status } from "../../prisma/generated/client";

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
}

export interface PNodeDetail extends PNodeListItem {
  id: string;
  gossipPort: number;
  rpcPort: number;
  gossipAddress: string | null;
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
}

export interface PNodeHistoryPoint {
  timestamp: string;
  storageUsed: string;
  storageUsagePercent: number;
  uptime: number;
  healthScore: number;
}

export interface NetworkStats {
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
