"use client";

import React, { useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BaseChartContainer } from "./base-chart-container";
import { getDefaultTooltipStyle } from "../../lib/chart-utils";

interface VersionDistributionChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { name: "0.8.0", value: 3, color: "#1E40AF" }, // blue
  { name: "0.8.0-trynet.20251217", value: 2, color: "#008000" }, // purple
  { name: "0.8.0-trynet.20251212", value: 1, color: "#FACC15" }, // yellow
  { name: "0.7.1", value: 1, color: "#9333EA" }, // teal
  { name: "1.0.0", value: 1, color: "#EF4444" }, // red
];

export const VersionDistributionChart = React.memo<VersionDistributionChartProps>(({ data = defaultData }) => {
  const total = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);

  const legend = useMemo(() => data.map((d) => ({ color: d.color, label: d.name })), [data]);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const percentage = ((entry.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3">
          <p className="text-sm font-semibold text-[#E5E7EB]">{entry.name}</p>
          <p className="text-sm text-[#9CA3AF]">
            {entry.value} nodes ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  }, [total]);

  return (
    <BaseChartContainer
      title="Version Distribution"
      description={`Total: ${total} nodes`}
      legend={legend}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={115}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
