"use client";

import React, { useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BaseChartContainer } from "./base-chart-container";
import { getDefaultTooltipStyle, getDefaultAxisStyle } from "../../lib/chart-utils";

interface StorageUtilizationChartProps {
  data?: Array<{
    date: string;
    committed: number;
    used: number;
  }>;
}

const defaultData = [
  { date: "Dec 13", committed: 168.2, used: 102.1 },
  { date: "Dec 14", committed: 169.5, used: 103.8 },
  { date: "Dec 15", committed: 170.1, used: 105.2 },
  { date: "Dec 16", committed: 171.3, used: 106.7 },
  { date: "Dec 17", committed: 171.8, used: 107.3 },
  { date: "Dec 18", committed: 172.2, used: 107.9 },
  { date: "Dec 19", committed: 172.6, used: 108.4 },
];

export const StorageUtilizationChart = React.memo<StorageUtilizationChartProps>(({
  data = defaultData,
}) => {
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const tooltipFormatter = useCallback((value: number | undefined) => [`${value?.toFixed(1) ?? 0} TB`, ""], []);

  const legend = useMemo(() => [{ color: "#1E40AF", label: "Committed" }, { color: "#FACC15", label: "Used" }], []);

  return (
    <BaseChartContainer
      title="Storage Utilization Trend"
      description="Last 7 days · Committed vs Used"
      legend={legend}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke={axis.stroke} style={axis.style} />
          <YAxis
            stroke={axis.stroke}
            style={axis.style}
            label={{
              value: "Storage (TB)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#6B7280", fontSize: "12px" },
            }}
          />
          <Tooltip
            contentStyle={{ ...tooltip.contentStyle, border: "1px solid rgba(255,255,255,0.1)" }}
            labelStyle={tooltip.labelStyle}
            formatter={tooltipFormatter}
          />
          <Line
            type="monotone"
            dataKey="committed"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={{ fill: "#1E40AF", r: 4 }}
            activeDot={{ r: 6 }}
            name="Committed"
          />
          <Line
            type="monotone"
            dataKey="used"
            stroke="#FACC15"
            strokeWidth={2}
            dot={{ fill: "#FACC15", r: 4 }}
            activeDot={{ r: 6 }}
            name="Used"
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
