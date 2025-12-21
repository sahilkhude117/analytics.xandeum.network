"use client";

import React from "react";

export default function ChartLegend({
  items,
}: {
  items: { color: string; label: string }[];
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-6 text-sm flex-wrap">
      {items.map((it, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: it.color }} />
          <span className="text-[#9CA3AF]">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
