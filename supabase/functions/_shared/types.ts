
export interface RPCRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown[];
  id: number | string;
}

export interface RPCResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number | string;
  result?: T;
  error?: RPCError | null;
}

export interface RPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface GetStatsResult {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
}

export interface PodWithStats {
  address: string;
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string;
  rpc_port: number;
  storage_committed: number;
  storage_usage_percent: number;
  storage_used: number;
  uptime: number;
  version: string;
}

export interface GetPodsWithStatsResult {
  pods: PodWithStats[];
  total_count: number;
}

export interface Pod {
  address: string;
  last_seen_timestamp: number;
  pubkey: string;
  version: string;
}

export interface GetPodsResult {
  pods: Pod[];
  total_count: number;
}

export interface GeoLocation {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export enum PRPCMethod {
  GET_STATS = "get-stats",
  GET_PODS_WITH_STATS = "get-pods-with-stats",
  GET_PODS = "get-pods",
  GET_VERSION = "get-version",
}

export interface PRPCConfig {
  bootstrapUrl: string;
  fallbackUrls?: string[];
  timeout: number;
  maxRetries: number;
  enableLogging: boolean;
}

export const DEFAULT_PRPC_CONFIG: PRPCConfig = {
  bootstrapUrl: "http://173.212.207.32:6000/rpc",
  fallbackUrls: [],
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  enableLogging: true,
};
