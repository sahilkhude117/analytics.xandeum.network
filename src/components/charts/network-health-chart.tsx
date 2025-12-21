"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import { useChartData, TimeRange } from "../../hooks/use-chart-data";

const mockData = {
  "24h": [
    { time: "00:00", health: 92 },
    { time: "04:00", health: 93 },
    { time: "08:00", health: 91 },
    { time: "12:00", health: 94 },
    { time: "16:00", health: 95 },
    { time: "20:00", health: 93 },
    { time: "Now", health: 94 },
  ],
  "7d": [
    { time: "Dec 15", health: 89 },
    { time: "Dec 16", health: 91 },
    { time: "Dec 17", health: 92 },
    { time: "Dec 18", health: 93 },
    { time: "Dec 19", health: 94 },
    { time: "Dec 20", health: 93 },
    { time: "Dec 21", health: 94 },
  ],
  "30d": [
    { time: "Nov 22", health: 85 },
    { time: "Nov 27", health: 87 },
    { time: "Dec 2", health: 88 },
    { time: "Dec 7", health: 90 },
    { time: "Dec 12", health: 91 },
    { time: "Dec 17", health: 93 },
    { time: "Dec 21", health: 94 },
  ],
};

export const NetworkHealthChart = React.memo(() => {
  const { currentData, timeRange, setTimeRange, timeRangeOptions } = useChartData(mockData);

  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const legend = useMemo(() => [{ color: "#FACC15", label: "Health Score" }], []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, [setTimeRange]);

  const tooltipFormatter = useCallback((value: number | undefined) => [`${value ?? 'N/A'}%`, "Health Score"], []);

  const timeRangeButtons = useMemo(() =>
    timeRangeOptions.map((range) => (
      <button
        key={range}
        onClick={() => handleTimeRangeChange(range)}
        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
          timeRange === range
            ? "bg-[#FACC15] text-black"
            : "bg-white/5 text-[#9CA3AF] hover:bg-white/10"
        }`}
      >
        {range}
      </button>
    )), [timeRange, timeRangeOptions, handleTimeRangeChange]);

  return (
    <BaseChartContainer
      title="Network Health Growth"
      description="Health score trend over time"
      legend={legend}
    >
      <div className="mb-2 flex items-center justify-end">
        <div className="flex gap-2">
          {timeRangeButtons}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={currentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke={axis.stroke} style={axis.style} />
          <YAxis
            stroke={axis.stroke}
            style={axis.style}
            domain={[0, 100]}
            label={{
              value: "Health Score (%)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#6B7280", fontSize: "12px" },
            }}
          />
          <Tooltip
            contentStyle={{
              ...tooltip.contentStyle,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            labelStyle={tooltip.labelStyle}
            formatter={tooltipFormatter}
          />
          <Line
            type="monotone"
            dataKey="health"
            stroke="#FACC15"
            strokeWidth={2}
            dot={{ fill: "#FACC15", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
