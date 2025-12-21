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

interface CpuRamChartProps {
  data?: Array<{ time: string; cpu: number; ram: number }>;
}

const defaultData = [
  { time: "00:00", cpu: 42, ram: 38 },
  { time: "04:00", cpu: 45, ram: 41 },
  { time: "08:00", cpu: 52, ram: 46 },
  { time: "12:00", cpu: 48, ram: 43 },
  { time: "16:00", cpu: 55, ram: 49 },
  { time: "20:00", cpu: 50, ram: 45 },
  { time: "Now", cpu: 47, ram: 42 },
];

export const CpuRamChart = React.memo<CpuRamChartProps>(({ data = defaultData }) => {
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const tooltipFormatter = useCallback((value: number | undefined) => [`${value ?? "N/A"}%`], []);

  const legend = useMemo(() => [
    { color: "#3B82F6", label: "CPU" },
    { color: "#FACC15", label: "RAM" }
  ], []);

  return (
    <BaseChartContainer
      title="CPU & RAM Over Time"
      description="Resource utilization trends"
      legend={legend}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="time" stroke={axis.stroke} style={axis.style} />
          <YAxis
            stroke={axis.stroke}
            style={axis.style}
            domain={[0, 100]}
            label={{
              value: "Utilization (%)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#6B7280", fontSize: "12px" },
            }}
          />
          <Tooltip
            contentStyle={tooltip.contentStyle}
            labelStyle={tooltip.labelStyle}
            formatter={tooltipFormatter}
          />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#3B82F6"
            strokeWidth={2}
            name="CPU"
            dot={{ fill: "#3B82F6", r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ram"
            stroke="#FACC15"
            strokeWidth={2}
            name="RAM"
            dot={{ fill: "#FACC15", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
