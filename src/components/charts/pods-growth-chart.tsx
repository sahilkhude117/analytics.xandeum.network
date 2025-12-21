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

interface PodsGrowthChartProps {
  data?: { time: string; pods: number }[];
}

const defaultData = [
  { time: "Dec 15", pods: 98 },
  { time: "Dec 16", pods: 102 },
  { time: "Dec 17", pods: 110 },
  { time: "Dec 18", pods: 118 },
  { time: "Dec 19", pods: 125 },
  { time: "Dec 20", pods: 132 },
  { time: "Dec 21", pods: 140 },
];

export const PodsGrowthChart = React.memo<PodsGrowthChartProps>(({ data = defaultData }) => {
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const tooltipFormatter = useCallback((value: number | undefined) => [`${value ?? "N/A"}`, "Pods"], []);

  const legend = useMemo(() => [{ color: "#1E40AF", label: "Pods" }], []);

  return (
    <BaseChartContainer
      title="Pods Growth Over Time"
      description="Total pods tracked over time"
      legend={legend}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="time" stroke={axis.stroke} style={axis.style} />
          <YAxis stroke={axis.stroke} style={axis.style} />
          <Tooltip
            contentStyle={tooltip.contentStyle}
            labelStyle={tooltip.labelStyle}
            formatter={tooltipFormatter}
          />
          <Line
            type="monotone"
            dataKey="pods"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={{ fill: "#1E40AF", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
