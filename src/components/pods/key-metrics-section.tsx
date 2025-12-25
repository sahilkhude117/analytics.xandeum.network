import { KpiCard } from "@/components/kpi-card";
import { PodDetails } from "@/lib/types";
import { formatUptime, formatRelativeTime, formatStorageValue, getFullStorageValue } from "@/lib/formatters";

interface KeyMetricsSectionProps {
  pod: PodDetails;
}

export function KeyMetricsSection({ pod }: KeyMetricsSectionProps) {
  const storageCommittedBytes = BigInt(Math.round(pod.storageCommitted * (1024 ** 3)));
  const storageUsedBytes = BigInt(Math.round(pod.storageUsed * (1024 ** 3)));
  const usagePercent = (pod.storageUsed / pod.storageCommitted) * 100;

  const getHealthColor = (score: number): string => {
    if (score >= 80) return "#22C55E"; // Green
    if (score >= 50) return "#FACC15"; // Yellow
    return "#EF4444"; // Red
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-[#E5E7EB]">
        Key Metrics
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Storage Committed"
          value={formatStorageValue(storageCommittedBytes)}
          tooltip={getFullStorageValue(storageCommittedBytes)}
          subtitle="committed"
        />
        <KpiCard
          title="Storage Used"
          value={formatStorageValue(storageUsedBytes)}
          tooltip={getFullStorageValue(storageUsedBytes)}
          subtitle="used"
        />
        <KpiCard
          title="Storage Usage"
          value={`${usagePercent.toFixed(1)}%`}
          tooltip={`${usagePercent.toFixed(2)}% of committed storage`}
          subtitle="utilization"
        />
        <KpiCard title="Uptime" value={formatUptime(pod.uptime)} />
        <KpiCard 
          title="Health Score" 
          value={pod.healthScore.toString()}
          valueColor={getHealthColor(pod.healthScore)}
        />
        <KpiCard title="Last Seen" value={formatRelativeTime(pod.lastSeen)} />
      </div>
    </div>
  );
}
