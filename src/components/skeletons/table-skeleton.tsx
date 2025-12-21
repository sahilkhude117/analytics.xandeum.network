"use client";

import React from "react";

interface TableSkeletonProps {
  rows?: number;
}

export default function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
      <div className="h-6 w-1/4 mb-4 rounded bg-white/5 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="h-4 w-1/3 rounded bg-white/6 animate-pulse" />
            <div className="h-4 w-1/6 rounded bg-white/6 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
