"use client";

import React from "react";
import ChartHeader from "./chart-header";
import ChartLegend from "./chart-legend";

export interface LegendItem {
  color: string;
  label: string;
}

interface BaseChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  legend?: LegendItem[];
  className?: string;
}

export function BaseChartContainer({
  title,
  description,
  children,
  legend,
  className = "",
}: BaseChartContainerProps) {
  return (
    <div className={`rounded-lg border border-white/5 bg-[#0b0b0b] p-6 ${className}`}>
      <ChartHeader title={title} description={description} />
        <div style={{ minWidth: 0, minHeight: 0 }} className="mt-4 w-full">
          {children}
        </div>
        {legend && <ChartLegend items={legend} />}
    </div>
  );
}
