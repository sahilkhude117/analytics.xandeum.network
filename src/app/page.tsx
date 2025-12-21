
import { KpiCard } from "@/components/kpi-card";
import { StorageUtilizationChart } from "@/components/charts/storage-utilization-chart";
import { NodeStatusChart } from "@/components/charts/node-status-chart";
import { TopPerformersTable } from "@/components/tables/top-performers-table";
import { ArrowRight } from "lucide-react";
import KpiCardSkeleton from "@/components/skeletons/kpi-card-skeleton";
import ChartSkeleton from "@/components/skeletons/chart-skeleton";

export default function Home() {
  const isLoading = false;

  // Mock data
  const networkData = {
    totalPods: 226,
    onlinePods: 190,
    storageCommitted: 172.6, // TB
    storageUsed: 108.4, // TB
    avgCommittedPerPod: 0.76, // TB
    avgUptime: 98.4, // percentage
    healthScore: 94, // out of 100
  };

  const storageUsedPercentage = (
    (networkData.storageUsed / networkData.storageCommitted) *
    100
  ).toFixed(1);

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
        </div>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Devnet · Updated moments ago
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Total Pods"
              value={networkData.totalPods}
              subtitle={`${networkData.onlinePods} online`}
            />
            <KpiCard
              title="Storage Committed"
              value={`${networkData.storageCommitted} TB`}
              trend={{ value: "6.2% (7d)", isPositive: true }}
            />
            <KpiCard
              title="Storage Used"
              value={`${networkData.storageUsed} TB`}
              subtitle={`${storageUsedPercentage}% utilized`}
            />
            <KpiCard
              title="Avg Storage Per Pod"
              value={`${networkData.avgCommittedPerPod} TB`}
              subtitle="committed"
            />
            <KpiCard
              title="Avg Uptime"
              value={`${networkData.avgUptime}%`}
              trend={{ value: "0.3% (7d)", isPositive: true }}
            />
            <KpiCard
              title="Health Score"
              value={`${networkData.healthScore}%`}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? <ChartSkeleton /> : <StorageUtilizationChart />}
        </div>
        <div className="lg:col-span-1">
          {isLoading ? <ChartSkeleton /> : <NodeStatusChart />}
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

