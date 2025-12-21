"use client";

export default function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
      <div className="h-3 w-2/5 mb-2 rounded bg-white/6 animate-pulse" />
      <div className="h-10 w-3/4 rounded bg-white/5 animate-pulse" />
    </div>
  );
}
