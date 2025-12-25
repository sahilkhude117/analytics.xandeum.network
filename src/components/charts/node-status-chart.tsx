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

export const NodeStatusChart = React.memo<NodeStatusChartProps>(({ data }) => {
  const total = useMemo(() => data?.reduce((sum, entry) => sum + entry.value, 0) || 0, [data]);
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);

  const legend = useMemo(() => data?.map((d) => ({ color: d.color, label: d.name })) || [], [data]);

  // Status definitions for tooltips
  const statusDefinitions = useMemo(() => ({
    "Online": "Health score ≥70. Last seen <5 min, good storage/uptime.",
    "Degraded": "Health score 1-69. Issues with storage, uptime, or connectivity.",
    "Offline": "Health score = 0. Not seen in last 5 minutes.",
    "Invalid": "Missing pubkey or address. Cannot participate in network."
  }), []);

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const percentage = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
      const definition = statusDefinitions[d.name as keyof typeof statusDefinitions];
      
      return (
        <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3 max-w-xs">
          <p className="text-sm font-semibold text-[#E5E7EB] mb-1">{d.name}</p>
          <p className="text-sm text-[#9CA3AF] mb-2">
            {d.value} nodes ({percentage}%)
          </p>
          {definition && (
            <p className="text-xs text-[#6B7280] border-t border-white/5 pt-2">
              {definition}
            </p>
          )}
        </div>
      );
    }
    return null;
  }, [total, statusDefinitions]);

  return (
    <BaseChartContainer
      title="Node Status Distribution"
      description={data && data.length > 0 ? `Total: ${total} nodes` : 'No data available'}
      legend={legend}
    >
      {!data || data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-[#6B7280]">No node status data available</p>
        </div>
      ) : (
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
      )}
    </BaseChartContainer>
  );
});
