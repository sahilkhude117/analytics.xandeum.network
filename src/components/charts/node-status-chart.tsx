"use client";

import React, { useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BaseChartContainer } from "./base-chart-container";
import { getDefaultTooltipStyle } from "../../lib/chart-utils";

interface NodeStatusChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { name: "Online", value: 190, color: "#008000" }, // Dark green
  { name: "Degraded", value: 24, color: "#FACC15" }, // Yellow
  { name: "Offline", value: 8, color: "#EF4444" }, // Red
  { name: "Invalid", value: 4, color: "#9333EA" }, // Purple
];

export const NodeStatusChart = React.memo<NodeStatusChartProps>(({ data = defaultData }) => {
  const total = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);

  const legend = useMemo(() => data.map((d) => ({ color: d.color, label: d.name })), [data]);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const percentage = ((d.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3">
          <p className="text-sm font-semibold text-[#E5E7EB]">{d.name}</p>
          <p className="text-sm text-[#9CA3AF]">
            {d.value} nodes ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  }, [total]);

  return (
    <BaseChartContainer
      title="Node Status Distribution"
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
