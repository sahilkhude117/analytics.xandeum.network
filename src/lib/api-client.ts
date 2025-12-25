import type { NetworkStats, NetworkHybridResponse, NetworkHistory, PaginatedResponse, PNodeListItem } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";
export type SortField = "lastSeenAt" | "storageUsagePercent" | "uptime" | "healthScore" | "storageCommitted";
export type SortDirection = "asc" | "desc";

export interface PNodesListParams {
  page?: number;
  pageSize?: number;
  sortBy?: SortField;
  sortDir?: SortDirection;
  status?: string;
  version?: string;
  country?: string;
  storageCommitted?: string;
  search?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error?.message || "API request failed");
    }

    return json.data;
  }

  async getNetworkStats(refresh = false): Promise<NetworkStats | NetworkHybridResponse> {
    const queryParam = refresh ? "?refresh=true" : "";
    return this.request<NetworkStats | NetworkHybridResponse>(
      `/api/v1/network${queryParam}`
    );
  }

  async getNetworkHistory(
    timeRange: TimeRange = "24h",
    includeLive = false
  ): Promise<NetworkHistory> {
    const params = new URLSearchParams({
      timeRange,
      includeLive: includeLive.toString(),
    });
    return this.request<NetworkHistory>(
      `/api/v1/network/history?${params.toString()}`
    );
  }

  async getPnodesList(params: PNodesListParams = {}): Promise<PaginatedResponse<PNodeListItem>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortDir) searchParams.set("sortDir", params.sortDir);
    if (params.status) searchParams.set("status", params.status);
    if (params.version) searchParams.set("version", params.version);
    if (params.country) searchParams.set("country", params.country);
    if (params.storageCommitted) searchParams.set("storageCommitted", params.storageCommitted);
    if (params.search) searchParams.set("search", params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/v1/pnodes${queryString ? `?${queryString}` : ""}`;
    
    return this.request<PaginatedResponse<PNodeListItem>>(endpoint);
  }
}

export const apiClient = new ApiClient();
