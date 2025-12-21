import { KpiCard } from "@/components/kpi-card";
import { PodDetails } from "@/lib/types";
import { formatUptime, formatRelativeTime } from "@/lib/formatters";

interface KeyMetricsSectionProps {
  pod: PodDetails;
}

export function KeyMetricsSection({ pod }: KeyMetricsSectionProps) {
  const usagePercent = (pod.storageUsed / pod.storageCommitted) * 100;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-[#E5E7EB]">
        Key Metrics
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Storage Committed"
          value={`${pod.storageCommitted} GB`}
          subtitle="committed"
        />
        <KpiCard
          title="Storage Used"
          value={`${pod.storageUsed} GB`}
          subtitle="used"
        />
        <KpiCard
          title="Storage Usage"
          value={`${usagePercent.toFixed(1)}%`}
          subtitle="utilization"
        />
        <KpiCard title="Uptime" value={formatUptime(pod.uptime)} />
        <KpiCard title="Health Score" value={`${pod.healthScore}/100`} />
        <KpiCard title="Last Seen" value={formatRelativeTime(pod.lastSeen)} />
      </div>
    </div>
  );
}
