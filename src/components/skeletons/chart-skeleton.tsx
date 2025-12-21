"use client";

import React from "react";

interface ChartSkeletonProps {
  height?: number;
}

export default function ChartSkeleton({ height = 300 }: ChartSkeletonProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="h-5 w-1/3 mb-4 rounded bg-white/5 animate-pulse" />
      <div
        className="w-full rounded bg-gradient-to-r from-white/6 to-white/4 animate-pulse"
        style={{ height }}
      />
    </div>
  );
}
