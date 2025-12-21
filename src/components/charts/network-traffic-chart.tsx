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

interface NetworkTrafficChartProps {
  data?: Array<{ time: string; bytes: number }>;
}

const defaultData = [
  { time: "Dec 15", bytes: 450 },
  { time: "Dec 16", bytes: 478 },
  { time: "Dec 17", bytes: 512 },
  { time: "Dec 18", bytes: 545 },
  { time: "Dec 19", bytes: 589 },
  { time: "Dec 20", bytes: 621 },
  { time: "Dec 21", bytes: 658 },
];

export const NetworkTrafficChart = React.memo<NetworkTrafficChartProps>(({ data = defaultData }) => {
  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const tooltipFormatter = useCallback((value: number | undefined) => [`${value ?? "N/A"} GB`, "Total Bytes"], []);

  const legend = useMemo(() => [{ color: "#22C55E", label: "Total Bytes" }], []);

  return (
    <BaseChartContainer
      title="Network Traffic Over Time"
      description="Total bytes transmitted"
      legend={legend}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="time" stroke={axis.stroke} style={axis.style} />
          <YAxis
            stroke={axis.stroke}
            style={axis.style}
            label={{
              value: "Total Bytes (GB)",
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
            dataKey="bytes"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ fill: "#22C55E", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
