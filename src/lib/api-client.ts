import type { NetworkStats, NetworkHybridResponse, NetworkHistory } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

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
}

export const apiClient = new ApiClient();
