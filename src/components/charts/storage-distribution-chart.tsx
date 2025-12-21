"use client";

import React, { useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BaseChartContainer } from "./base-chart-container";
import { getDefaultTooltipStyle, getDefaultAxisStyle } from "../../lib/chart-utils";

interface StorageDistributionChartProps {
  data?: Array<{
    range: string;
    count: number;
  }>;
}

const defaultData = [
  { range: '0–1 GB', count: 12 },
  { range: '1–10 GB', count: 28 },
  { range: '10–50 GB', count: 45 },
  { range: '50–100 GB', count: 67 },
  { range: '100–500 GB', count: 52 },
  { range: '500+ GB', count: 22 },
];

export const StorageDistributionChart = React.memo<StorageDistributionChartProps>(({ data = defaultData }) => {
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const { range, count } = payload[0].payload;

    return (
      <div
        style={{
          background: "#0f0f0f",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 16,
        }}
      >
        <div><strong>Storage Range:</strong> {range}</div>
        <div><strong>Pods:</strong> {count}</div>
      </div>
    );
  }, []);

  return (
    <BaseChartContainer title="Storage Distribution by Size Range">
      <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="range"
              tick={{ fill: "#e5e7eb", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              contentStyle={tooltip.contentStyle}
              labelStyle={tooltip.labelStyle}
              cursor={{ fill: '#0f0f0f' }}
            />

            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              fill="#7c3aed"
            />
          </BarChart>
        </ResponsiveContainer>
    </BaseChartContainer>
  );
});
