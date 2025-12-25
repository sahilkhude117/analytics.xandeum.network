"use client";

import NetworkMapWrapper from '@/components/network-map-wrapper';
import { TotalPods, NetworkStats } from '@/components/network-stats';
import { KpiCard } from '@/components/kpi-card';
import { NetworkHealthChart } from '@/components/charts/network-health-chart';
import { VersionDistributionChart } from '@/components/charts/version-distribution-chart';
import { StorageDistributionChart } from '@/components/charts/storage-distribution-chart';
import { PodsGrowthChart } from '@/components/charts/pods-growth-chart';
import { AdvancedMetricsSection } from '@/components/advanced-metrics-section';
import { useState, useEffect, useMemo } from 'react';
import KpiCardSkeleton  from '@/components/skeletons/kpi-card-skeleton';
import ChartSkeleton from '@/components/skeletons/chart-skeleton';
import { useNetworkData } from '@/hooks/use-network-data';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { formatUptime, formatStorageValue, getFullStorageValue } from '@/lib/formatters';
import { RefreshCw } from 'lucide-react';
import type { NetworkStats as NetworkStatsType, NetworkHybridResponse } from '@/lib/types';

export default function NetworkPage() {
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  const { data, isLoading: isNetworkLoading, isFetching } = useNetworkData();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshTime(new Date());
    setCountdown(30);
    try {
      const freshData = await apiClient.getNetworkStats(true);
      queryClient.setQueryData(["network"], freshData);
      await queryClient.invalidateQueries({ queryKey: ["network-history"] });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          (async () => {
            setIsRefreshing(true);
            setLastRefreshTime(new Date());
            try {
              const freshData = await apiClient.getNetworkStats(true);
              queryClient.setQueryData(["network"], freshData);
              await queryClient.invalidateQueries({ queryKey: ["network-history"] });
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

    console.log("[NETWORK PAGE] Processing data:", {
      hasData: !!data,
      isHybrid: "dataSource" in data,
      keys: Object.keys(data),
    });

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
        publicPods: live?.publicPNodes ?? 0,
        privatePods: live?.privatePNodes ?? 0,
        totalStorageCommitted: live?.totalStorageCommitted ?? "0",
        totalStorageUsed: live?.totalStorageUsed ?? "0",
        avgStorageUsagePercent: live?.avgStorageUsagePercent ?? 0,
        avgUptime: live?.avgUptime ?? 0,
        healthScore: live?.networkHealthScore ?? 0,
        timestamp: live?.timestamp ?? new Date().toISOString(),
        versionDistribution: live?.versionDistribution ?? [],
        storageDistribution: live?.storageDistribution ?? [],
        advancedMetrics: live?.advancedMetrics ?? {
          avgCpu: detailed?.avgCpuPercent ?? 0,
          avgRam: detailed?.avgRamUsagePercent ?? 0,
          totalStreams: detailed?.totalActiveStreams ?? 0,
          totalPacketsSent: detailed?.totalPacketsSent ?? "0",
          totalPacketsReceived: detailed?.totalPacketsReceived ?? "0",
          totalPages: detailed?.totalPages ?? 0,
        },
      };
    } else {
      const stats = data as NetworkStatsType;
      
      return {
        totalPods: stats.totalPNodes,
        onlinePods: stats.onlinePNodes,
        degradedPods: stats.degradedPNodes,
        offlinePods: stats.offlinePNodes,
        publicPods: stats.publicPNodes ?? 0,
        privatePods: stats.privatePNodes ?? 0,
        totalStorageCommitted: stats.totalStorageCommitted,
        totalStorageUsed: stats.totalStorageUsed,
        avgStorageUsagePercent: stats.avgStorageUsagePercent,
        avgUptime: stats.avgUptime,
        healthScore: stats.networkHealthScore,
        timestamp: stats.timestamp,
        versionDistribution: stats.versionDistribution ?? [],
        storageDistribution: stats.storageDistribution ?? [],
        advancedMetrics: stats.advancedMetrics ?? {
          avgCpu: stats.avgCpuPercent ?? 0,
          avgRam: stats.avgRamUsagePercent ?? 0,
          totalStreams: stats.totalActiveStreams ?? 0,
          totalPacketsSent: stats.totalPacketsSent ?? "0",
          totalPacketsReceived: stats.totalPacketsReceived ?? "0",
          totalPages: stats.totalPages ?? 0,
        },
      };
    }
  }, [data]);

  const avgStoragePerPod = useMemo(() => {
    if (!networkData || networkData.totalPods === 0) return "0";
    const committed = BigInt(networkData.totalStorageCommitted);
    const avgBytes = Number(committed) / networkData.totalPods;
    return avgBytes.toString();
  }, [networkData]);

  const avgStorageUsed = useMemo(() => {
    if (!networkData || networkData.totalPods === 0) return 0;
    const used = Number(BigInt(networkData.totalStorageUsed));
    const avgBytes = used / networkData.totalPods;
    const avgMB = avgBytes / (1024 * 1024);
    return avgMB;
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

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#22C55E'; // Green
    if (score >= 60) return '#FACC15'; // Yellow
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Prepare chart data from live network data
  const versionData = useMemo(() => {
    if (!networkData?.versionDistribution) return [];
    
    const versionColors: Record<string, string> = {
      '0.8.0': '#1E40AF',
      '0.8.0-trynet.20251217111503.7a5b0240.7.3': '#008000',
      '0.8.0-trynet.20251212183600.9eea72e': '#6366F1',
      '0.7.1': '#9333EA',
      '1.0.0': '#EF4444',
    };
    
    return networkData.versionDistribution.map((item) => ({
      name: item.version,
      value: item.count,
      color: versionColors[item.version] || '#6B7280',
    }));
  }, [networkData?.versionDistribution]);

  const storageData = useMemo(() => {
    if (!networkData?.storageDistribution) return [];
    return networkData.storageDistribution.map((item) => ({
      range: item.range,
      count: item.count,
    }));
  }, [networkData?.storageDistribution]);

  const advancedMetrics = useMemo(() => {
    if (!networkData?.advancedMetrics) {
      return {
        avgCpu: 0,
        avgRam: 0,
        totalStreams: 0,
        totalPacketsSent: 0,
        totalPacketsReceived: 0,
        totalPages: 0,
      };
    }
    
    return {
      avgCpu: Math.round(networkData.advancedMetrics.avgCpu),
      avgRam: Math.round(networkData.advancedMetrics.avgRam),
      totalStreams: networkData.advancedMetrics.totalStreams,
      totalPacketsSent: parseInt(networkData.advancedMetrics.totalPacketsSent) || 0,
      totalPacketsReceived: parseInt(networkData.advancedMetrics.totalPacketsReceived) || 0,
      totalPages: networkData.advancedMetrics.totalPages,
    };
  }, [networkData?.advancedMetrics]);

  return (
    <main className="font-mono min-h-screen max-w-[min(100vw,1600px)] mx-auto relative overflow-hidden flex flex-col px-6">
      <div className="w-full max-w-[1600px] space-y-1.5 mx-auto mt-0 mb-0">
        {/* Mobile Layout */}
        <div className="flex flex-col min-[961px]:hidden">
          <header className="flex flex-col items-start font-mono text-sm uppercase gap-2">
            <h1 className="text-[#E5E7EB] font-mono my-0 text-2xl font-bold normal-case">
              Network Overview
            </h1>
            <p className="text-[#9CA3AF] font-mono my-0">
              Global pNodes Distribution
            </p>
          </header>

          <section className="pb-6 w-full">
            <div className="flex flex-col gap-y-6">
              <TotalPods data={networkData} isLoading={isNetworkLoading} />
              <NetworkStats data={networkData} isLoading={isNetworkLoading} />
            </div>
          </section>

          <div className="w-full flex justify-center pointer-events-none">
            <NetworkMapWrapper />
          </div>

          {/* KPI Cards Section - Mobile */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {isNetworkLoading ? (
              Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : networkData ? (
              <>
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
                  title="Avg Storage Used"
                  value={avgStorageUsed < 1 ? `${avgStorageUsed.toFixed(2)} MB` : `${(avgStorageUsed / 1024).toFixed(2)} GB`}
                  tooltip={`${avgStorageUsed.toFixed(2)} MB per pod`}
                  subtitle="per pod"
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
                  valueColor={getHealthColor(networkData.healthScore)}
                />
              </>
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <KpiCard key={i} title="---" value="---" />
              ))
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="relative hidden min-[961px]:flex flex-row max-lg:items-end lg:items-center lg:justify-between">
          <header className="flex flex-col items-start font-mono text-sm xl:text-md uppercase gap-2 max-lg:mb-6 mb-auto mt-8">
            <h1 className="text-[#E5E7EB] font-mono my-0 text-xl xl:text-2xl font-bold">
              Network Overview
            </h1>
            <p className="text-[#9CA3AF] font-mono my-0">
              Global pNodes Distribution
            </p>
          </header>

          <section className="lg:absolute lg:bottom-0 pb-12 w-fit z-10 relative">
            <div className="flex flex-col gap-y-8">
              <TotalPods data={networkData} isLoading={isNetworkLoading} />
              <NetworkStats data={networkData} isLoading={isNetworkLoading} />
            </div>
          </section>

          <div className="w-full h-full pointer-events-none max-lg:scale-[1.5] max-lg:-translate-y-16 max-lg:translate-x-[-20%]">
            <NetworkMapWrapper />
          </div>
        </div>

        {/* Network Status Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#0b0b0b] p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
              <span className="text-sm font-semibold text-[#E5E7EB]">
                Network Status: Healthy
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-sm text-[#9CA3AF]">
              Updated {lastUpdatedText}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching || isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] hover:bg-[#1E40AF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh network data"
          >
            <RefreshCw className={`h-4 w-4 transition-transform ${isFetching || isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh in {countdown}s</span>
          </button>
        </div>

        {/* KPI Cards Section */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {isNetworkLoading ? (
            Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : networkData ? (
            <>
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
                title="Avg Storage Used"
                value={avgStorageUsed < 1 ? `${avgStorageUsed.toFixed(2)} MB` : `${(avgStorageUsed / 1024).toFixed(2)} GB`}
                tooltip={`${avgStorageUsed.toFixed(2)} MB per pod`}
                subtitle="per pod"
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
                valueColor={getHealthColor(networkData.healthScore)}
              />
            </>
          ) : (
            <>
              <KpiCard
                title="Storage Committed"
                value="---"
              />
              <KpiCard
                title="Storage Used"
                value="---"
              />
              <KpiCard
                title="Avg Storage Used"
                value="---"
              />
              <KpiCard
                title="Avg Storage Per Pod"
                value="---"
              />
              <KpiCard
                title="Avg Uptime"
                value="---"
              />
              <KpiCard
                title="Health Score"
                value="---"
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isNetworkLoading ? <ChartSkeleton /> : <NetworkHealthChart />}
          </div>
          <div className="lg:col-span-1">
            {isNetworkLoading ? <ChartSkeleton /> : <VersionDistributionChart data={versionData} />}
          </div>
        </div>

        {/* Storage Distribution Section */}
        <div className="mt-4">
          {isNetworkLoading ? <ChartSkeleton /> : <StorageDistributionChart data={storageData} />}
        </div>
        <div className="mt-6 mb-6">
          {isNetworkLoading ? <ChartSkeleton /> : <PodsGrowthChart />}
        </div>

        {/* Advanced Metrics Section */}
        <AdvancedMetricsSection
          avgCpu={advancedMetrics.avgCpu}
          avgRam={advancedMetrics.avgRam}
          totalStreams={advancedMetrics.totalStreams}
          totalPacketsSent={advancedMetrics.totalPacketsSent}
          totalPacketsReceived={advancedMetrics.totalPacketsReceived}
          totalPages={advancedMetrics.totalPages}
        />
      </div>
    </main>
  );
}
