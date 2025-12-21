"use client";

import React from "react";

export default function ChartHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {title}
      </h3>
      {description && <p className="mt-1 text-sm text-[#9CA3AF]">{description}</p>}
    </div>
  );
}
