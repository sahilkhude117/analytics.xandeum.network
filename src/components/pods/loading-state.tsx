import KpiCardSkeleton from "@/components/skeletons/kpi-card-skeleton";
import ChartSkeleton from "@/components/skeletons/chart-skeleton";

export function LoadingState() {
  return (
    <main className="container mx-auto px-6 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-4">
          <div className="h-8 w-64 rounded bg-white/5 animate-pulse" />
          <div className="h-8 w-32 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
      </div>

      {/* Pod info skeleton */}
      <div className="mb-8 rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="h-6 w-48 mb-2 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-20 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-8 w-16 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-8 w-24 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Key Metrics skeleton */}
      <div className="mb-8">
        <div className="h-6 w-32 mb-4 rounded bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-white/5 animate-pulse" />
          <div className="h-6 w-40 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div className="lg:col-span-1">
            <ChartSkeleton />
          </div>
        </div>
      </div>

      {/* Network Activity skeleton */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-white/5 animate-pulse" />
          <div className="h-6 w-36 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
