"use client";

import NetworkMapWrapper from '@/components/network-map-wrapper';
import { TotalPods, NetworkStats } from '@/components/network-stats';
import { KpiCard } from '@/components/kpi-card';
import { NetworkHealthChart } from '@/components/charts/network-health-chart';
import { VersionDistributionChart } from '@/components/charts/version-distribution-chart';
import { StorageDistributionChart } from '@/components/charts/storage-distribution-chart';
import { PodsGrowthChart } from '@/components/charts/pods-growth-chart';
import { AdvancedMetricsSection } from '@/components/advanced-metrics-section';
import { mockPods } from '@/lib/mockPods';
import { useState, useEffect } from 'react';
import KpiCardSkeleton  from '@/components/skeletons/kpi-card-skeleton';
import ChartSkeleton from '@/components/skeletons/chart-skeleton';

export default function NetworkPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate KPI metrics
  const avgStorageCommitted = (mockPods.reduce((sum, pod) => sum + pod.storageCommitted, 0) / mockPods.length).toFixed(1);
  const avgStorageUsed = (mockPods.reduce((sum, pod) => sum + pod.storageUsed, 0) / mockPods.length).toFixed(1);
  const totalCommitted = mockPods.reduce((sum, pod) => sum + pod.storageCommitted, 0);
  const totalUsed = mockPods.reduce((sum, pod) => sum + pod.storageUsed, 0);
  const avgUsagePercent = ((totalUsed / totalCommitted) * 100).toFixed(1);
  const avgUptime = (mockPods.reduce((sum, pod) => sum + pod.uptime, 0) / mockPods.length / 86400).toFixed(1); // Convert to days
  const avgHealth = Math.round(mockPods.reduce((sum, pod) => sum + pod.healthScore, 0) / mockPods.length);
  const lastUpdated = new Date(Math.max(...mockPods.map(pod => pod.lastSeen.getTime())));
  const timeDiff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000); // minutes ago
  const lastUpdatedText = timeDiff < 1 ? 'Just now' : timeDiff < 60 ? `${timeDiff}m ago` : `${Math.floor(timeDiff / 60)}h ago`;
  const publicCount = mockPods.filter(p => p.visibility === 'PUBLIC').length;
  const privateCount = mockPods.filter(p => p.visibility === 'PRIVATE').length;

  // Calculate version distribution
  const versionCounts = mockPods.reduce((acc, pod) => {
    acc[pod.version] = (acc[pod.version] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const versionColors: Record<string, string> = {
    '0.8.0': '#1E40AF',
    '0.8.0-trynet.20251217111503.7a5b0240.7.3': '#008000',
    '0.8.0-trynet.20251212183600.9eea72e': '',
    '0.7.1': '#9333EA',
    '1.0.0': '#EF4444',
  };

  const versionData = Object.entries(versionCounts).map(([version, count]) => ({
    name: version,
    value: count,
    color: versionColors[version] || '#6B7280',
  }));

  // Calculate storage distribution by size range
  const storageRanges = [
    { range: '0–1 GB', min: 0, max: 1, count: 12},
    { range: '1–10 GB', min: 1, max: 10, count: 50 },
    { range: '10–50 GB', min: 10, max: 50, count: 15 },
    { range: '50–100 GB', min: 50, max: 100, count: 30 },
    { range: '100–500 GB', min: 100, max: 500, count: 10 },
    { range: '500+ GB', min: 500, max: Infinity },
  ];

  const storageData = storageRanges.map(({ range, min, max }) => ({
    range,
    count: mockPods.filter(pod => {
      const storage = pod.storageCommitted;
      return storage >= min && storage < max;
    }).length,
  }));

  // If dataset is very small (e.g. demo/mock with only a few pods),
  // provide a fallback sample distribution so the chart shows varied bins
  const totalInRanges = storageData.reduce((s, r) => s + r.count, 0);
  if (totalInRanges < 20) {
    const sample = [
      { range: '0–1 GB', count: 42 },
      { range: '1–10 GB', count: 128 },
      { range: '10–50 GB', count: 76 },
      { range: '50–100 GB', count: 31 },
      { range: '100–500 GB', count: 14 },
      { range: '500+ GB', count: 6 },
    ];
    // Use sample for visualization only
    for (let i = 0; i < storageData.length; i++) {
      storageData[i].count = sample[i]?.count ?? 0;
    }
  }

  // Calculate advanced metrics (public pods only)
  const publicPods = mockPods.filter(p => p.visibility === 'PUBLIC');
  const advancedMetrics = {
    avgCpu: publicPods.length > 0 ? Math.round(publicPods.reduce((sum, pod) => sum + (Math.random() * 60 + 30), 0) / publicPods.length) : 0,
    avgRam: publicPods.length > 0 ? Math.round(publicPods.reduce((sum, pod) => sum + (Math.random() * 50 + 30), 0) / publicPods.length) : 0,
    totalStreams: publicPods.length * 156,
    totalPacketsSent: publicPods.length * 9842301,
    totalPacketsReceived: publicPods.length * 8234512,
    totalPages: publicPods.length * 234891,
  };

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
              <TotalPods />
              <NetworkStats />
            </div>
          </section>

          <div className="w-full flex justify-center pointer-events-none">
            <NetworkMapWrapper />
          </div>

          {/* KPI Cards Section - Mobile */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
            ) : (
              <>
                <KpiCard
                  title="Storage Committed"
                  value={`${avgStorageCommitted} GB`}
                />
                <KpiCard
                  title="Storage Used"
                  value={`${avgStorageUsed} GB`}
                />
                <KpiCard
                  title="Avg Usage"
                  value={`${avgUsagePercent}%`}
                  subtitle="utilization"
                />
                <KpiCard
                  title="Avg Uptime"
                  value={`${avgUptime} days`}
                />
                <KpiCard
                  title="Network Health"
                  value={`${avgHealth}%`}
                />
                <KpiCard
                  title="Public / Private Pods"
                  value={`${publicCount} / ${privateCount}`}
                />
              </>
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
              <TotalPods />
              <NetworkStats />
            </div>
          </section>

          <div className="w-full h-full pointer-events-none max-lg:scale-[1.5] max-lg:-translate-y-16 max-lg:translate-x-[-20%]">
            <NetworkMapWrapper />
          </div>
        </div>

        {/* KPI Cards Section */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                title="Avg Storage Committed"
                value={`${avgStorageCommitted} GB`}
              />
              <KpiCard
                title="Avg Storage Used"
                value={`${avgStorageUsed} GB`}
              />
              <KpiCard
                title="Avg Usage"
                value={`${avgUsagePercent}%`}
                subtitle="utilization"
              />
              <KpiCard
                title="Avg Uptime"
                value={`${avgUptime} days`}
              />
              <KpiCard
                title="Avg Health"
                value={`${avgHealth}%`}
              />
              <KpiCard
                title="Public / Private Pods"
                value={`${publicCount} / ${privateCount}`}
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLoading ? <ChartSkeleton /> : <NetworkHealthChart />}
          </div>
          <div className="lg:col-span-1">
            {isLoading ? <ChartSkeleton /> : <VersionDistributionChart data={versionData} />}
          </div>
        </div>

        {/* Storage Distribution Section */}
        <div className="mt-4">
          {isLoading ? <ChartSkeleton /> : <StorageDistributionChart data={storageData} />}
        </div>
        <div className="mt-6 mb-6">
          {isLoading ? <ChartSkeleton /> : <PodsGrowthChart />}
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
