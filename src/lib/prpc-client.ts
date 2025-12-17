import {
  PRPCConfig,
  PRPCMethod,
  RPCRequest,
  RPCResponse,
  GetStatsResult,
  GetPodsWithStatsResult,
  GetPodsResult,
  DEFAULT_PRPC_CONFIG,
} from "./types/prpc";
import axios from "axios";

export class PRPCClient {
  private config: PRPCConfig;
  private requestId: number = 1;

  constructor(config?: Partial<PRPCConfig>) {
    this.config = { ...DEFAULT_PRPC_CONFIG, ...config };
  }

  async getPodsWithStats(): Promise<GetPodsWithStatsResult> {
    const response = await this.makeRequest<GetPodsWithStatsResult>(
      PRPCMethod.GET_PODS_WITH_STATS,
      []
    );

    if (!response.result) {
      throw new Error("No result in get-pods-with-stats response");
    }

    return response.result;
  }

  async getPods(): Promise<GetPodsResult> {
    const response = await this.makeRequest<GetPodsResult>(
      PRPCMethod.GET_PODS,
      []
    );

    if (!response.result) {
      throw new Error("No result in get-pods response");
    }

    return response.result;
  }

  async getStats(nodeUrl: string): Promise<GetStatsResult> {
    const response = await this.makeRequest<GetStatsResult>(
      PRPCMethod.GET_STATS,
      [],
      nodeUrl
    );

    if (!response.result) {
      throw new Error(`No result in get-stats response from ${nodeUrl}`);
    }

    return response.result;
  }

  async getVersion(nodeUrl: string): Promise<string> {
    const response = await this.makeRequest<string>(
      PRPCMethod.GET_VERSION,
      [],
      nodeUrl
    );

    if (!response.result) {
      throw new Error(`No result in get-version response from ${nodeUrl}`);
    }

    return response.result;
  }

  private async makeRequest<T>(
    method: string,
    params: unknown[] = [],
    customUrl?: string
  ): Promise<RPCResponse<T>> {
    const rpcRequest: RPCRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: this.requestId++,
    };

    const url = customUrl || this.config.bootstrapUrl;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (this.config.enableLogging) {
          console.log(
            `[pRPC] ${method} → ${url} (attempt ${attempt}/${this.config.maxRetries})`
          );
        }

        const response = await axios.post<RPCResponse<T>>(url, rpcRequest, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds
        });

        const rpcResponse = response.data;

        if (rpcResponse.error) {
          throw new Error(
            `RPC Error ${rpcResponse.error.code}: ${rpcResponse.error.message}`
          );
        }

        if (this.config.enableLogging) {
          console.log(`[pRPC] ${method} succeeded`);
        }

        return rpcResponse;
      } catch (error) {
        const lastError = error as Error;

        if (this.config.enableLogging) {
          console.error(
            `[pRPC] ${method} failed (attempt ${attempt}):`,
            error
          );
        }

        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw new Error(
            `pRPC request failed after ${this.config.maxRetries} retries: ${lastError?.message}`
          );
        }
      }
    }

    throw new Error("Unexpected end of makeRequest");
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getPods();
      return result.total_count > 0;
    } catch (error) {
      console.error("[pRPC] Connection test failed:", error);
      return false;
    }
  }

  getConfig(): PRPCConfig {
    return { ...this.config };
  }
}

export const prpcClient = new PRPCClient({
  enableLogging: process.env.NODE_ENV === "development",
});

export function buildRpcUrl(ipAddress: string, rpcPort: number = 6000): string {
  // Ensure port is stringified to avoid Node.js fetch "bad port" error
  const port = String(rpcPort);
  return `http://${ipAddress}:${port}/rpc`;
}
