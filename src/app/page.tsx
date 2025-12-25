
"use client";

import { KpiCard } from "@/components/kpi-card";
import { StorageUtilizationChart } from "@/components/charts/storage-utilization-chart";
import { NodeStatusChart } from "@/components/charts/node-status-chart";
import { TopPerformersTable } from "@/components/tables/top-performers-table";
import { ArrowRight, RefreshCw } from "lucide-react";
import KpiCardSkeleton from "@/components/skeletons/kpi-card-skeleton";
import ChartSkeleton from "@/components/skeletons/chart-skeleton";
import { useNetworkData } from "@/hooks/use-network-data";
import { useState, useMemo, useEffect } from "react";
import type { NetworkStats, NetworkHybridResponse } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { formatUptime, formatStorageValue, getFullStorageValue } from "@/lib/formatters";
import { apiClient } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  const { data, isLoading, isFetching } = useNetworkData();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshTime(new Date());
    setCountdown(30); // Reset timer immediately when manually refreshed
    try {
      const freshData = await apiClient.getNetworkStats(true);
      queryClient.setQueryData(["network"], freshData);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          (async () => {
            setIsRefreshing(true);
            setLastRefreshTime(new Date());
            try {
              const freshData = await apiClient.getNetworkStats(true);
              queryClient.setQueryData(["network"], freshData);
            } finally {
              setIsRefreshing(false);
            }
          })();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [queryClient]);

  const networkData = useMemo(() => {
    if (!data) return null;

    const isHybrid = "dataSource" in data;
    
    if (isHybrid) {
      const hybrid = data as NetworkHybridResponse;
      const live = hybrid.liveMetrics;
      const detailed = hybrid.detailedMetrics;
      
      return {
        totalPods: live?.totalPNodes ?? 0,
        onlinePods: live?.onlinePNodes ?? 0,
        degradedPods: live?.degradedPNodes ?? 0,
        offlinePods: live?.offlinePNodes ?? 0,
        totalStorageCommitted: live?.totalStorageCommitted ?? "0",
        totalStorageUsed: live?.totalStorageUsed ?? "0",
        avgStorageUsagePercent: live?.avgStorageUsagePercent ?? 0,
        avgUptime: live?.avgUptime ?? 0,
        healthScore: live?.networkHealthScore ?? 0,
        timestamp: live?.timestamp ?? new Date().toISOString(),
      };
    } else {
      const stats = data as NetworkStats;
      return {
        totalPods: stats.totalPNodes,
        onlinePods: stats.onlinePNodes,
        degradedPods: stats.degradedPNodes,
        offlinePods: stats.offlinePNodes,
        totalStorageCommitted: stats.totalStorageCommitted,
        totalStorageUsed: stats.totalStorageUsed,
        avgStorageUsagePercent: stats.avgStorageUsagePercent,
        avgUptime: stats.avgUptime,
        healthScore: stats.networkHealthScore,
        timestamp: stats.timestamp,
      };
    }
  }, [data]);

  const avgStoragePerPod = useMemo(() => {
    if (!networkData || networkData.totalPods === 0) return "0";
    const committed = BigInt(networkData.totalStorageCommitted);
    const avgBytes = Number(committed) / networkData.totalPods;
    return avgBytes.toString();
  }, [networkData]);

  const nodeStatusData = useMemo(() => {
    if (!networkData) return undefined;
    const { totalPods, onlinePods, degradedPods, offlinePods } = networkData;
    const invalidPods = totalPods - (onlinePods + degradedPods + offlinePods);
    
    return [
      { name: "Online", value: onlinePods, color: "#008000" },
      { name: "Degraded", value: degradedPods, color: "#FACC15" },
      { name: "Offline", value: offlinePods, color: "#EF4444" },
      { name: "Invalid", value: invalidPods, color: "#9333EA" },
    ].filter(item => item.value > 0); // Only show categories with values
  }, [networkData]);

  const lastUpdatedText = useMemo(() => {
    if (lastRefreshTime) {
      return formatDistanceToNow(lastRefreshTime, { addSuffix: true });
    }
    if (networkData?.timestamp) {
      return formatDistanceToNow(new Date(networkData.timestamp), { addSuffix: true });
    }
    return "moments ago";
  }, [lastRefreshTime, networkData?.timestamp]);

  return (
    <main className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#E5E7EB]">
            Xandeum pNodes – Network Overview
          </h1>
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0b0b0b] px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <span className="text-sm font-semibold text-[#E5E7EB]">
              Network Status: Healthy
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching || isRefreshing}
            className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0b] px-4 py-2 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] hover:bg-[#1E40AF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh network data"
          >
            <RefreshCw className={`h-4 w-4 transition-transform ${isFetching || isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh in {countdown}s</span>
          </button>
        </div>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Devnet · Updated {lastUpdatedText}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : networkData ? (
          <>
            <KpiCard
              title="Total Pods"
              value={networkData.totalPods}
              subtitle={`${networkData.onlinePods} online`}
            />
            <KpiCard
              title="Storage Committed"
              value={formatStorageValue(networkData.totalStorageCommitted)}
              tooltip={getFullStorageValue(networkData.totalStorageCommitted)}
            />
            <KpiCard
              title="Storage Used"
              value={formatStorageValue(networkData.totalStorageUsed)}
              tooltip={getFullStorageValue(networkData.totalStorageUsed)}
              subtitle={`${networkData.avgStorageUsagePercent > 0 ? networkData.avgStorageUsagePercent.toFixed(2) : '< 0.01'}% utilized`}
            />
            <KpiCard
              title="Avg Storage Per Pod"
              value={formatStorageValue(avgStoragePerPod)}
              tooltip={getFullStorageValue(avgStoragePerPod)}
              subtitle="committed"
            />
            <KpiCard
              title="Avg Uptime"
              value={formatUptime(networkData.avgUptime)}
              subtitle={`${networkData.avgUptime.toLocaleString()} seconds`}
            />
            <KpiCard
              title="Health Score"
              value={`${networkData.healthScore}%`}
            />
          </>
        ) : (
          <div className="col-span-full text-center text-[#9CA3AF]">
            No data available
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? <ChartSkeleton /> : <StorageUtilizationChart />}
        </div>
        <div className="lg:col-span-1">
          {isLoading ? <ChartSkeleton /> : <NodeStatusChart data={nodeStatusData} />}
        </div>
      </div>

      {/* Top Performers Section */}
      <div className="mt-8">
        <TopPerformersTable isLoading={isLoading} />
      </div>

      {/* Navigation Links */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <a
          href="/pods"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0b] px-6 py-3 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] hover:bg-[#1E40AF]/10"
        >
          <span>VIEW ALL PODS</span>
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="/network"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0b] px-6 py-3 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] hover:bg-[#1E40AF]/10"
        >
          <span>NETWORK STATS</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}

