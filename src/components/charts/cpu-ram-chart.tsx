"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { getDefaultTooltipStyle, getDefaultAxisStyle } from "@/lib/chart-utils";
import { useNetworkHistory } from "../../hooks/use-network-history";
import { formatChartDate } from "@/lib/formatters";
import { TimeRange } from "@/lib/api-client";
import type { NetworkHistoryPoint } from "@/lib/types";

interface ChartDataPoint {
  timestamp: string;
  date: string;
  cpu: number;
  ram: number;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export const CpuRamChart = React.memo(() => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [liveDataPoints, setLiveDataPoints] = useState<Map<string, ChartDataPoint>>(new Map());
  
  const { data: historyData, isLoading, isFetching } = useNetworkHistory(timeRange);

  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const legend = useMemo(() => [
    { color: "#3B82F6", label: "CPU" },
    { color: "#FACC15", label: "RAM" }
  ], []);

  useEffect(() => {
    setLiveDataPoints(new Map());
  }, [timeRange]);

  useEffect(() => {
    if (!historyData || !historyData.livePoint) return;

    const processPoint = (point: NetworkHistoryPoint): ChartDataPoint | null => {
      if (point.avgCpuPercent === null || point.avgRamUsagePercent === null) {
        return null;
      }
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        cpu: point.avgCpuPercent,
        ram: point.avgRamUsagePercent,
      };
    };

    const livePoint = processPoint(historyData.livePoint);
    if (!livePoint) return;

    const historicalTimestamps = new Set(historyData.dataPoints.map(p => p.timestamp));

    setLiveDataPoints((prev) => {
      const updated = new Map(prev);
      updated.set(livePoint.timestamp, livePoint);

      for (const [ts] of updated) {
        if (historicalTimestamps.has(ts)) {
          updated.delete(ts);
        }
      }
      
      return updated;
    });
  }, [historyData, timeRange]);

  const chartData = useMemo(() => {
    if (!historyData) return [];

    const processPoint = (point: NetworkHistoryPoint): ChartDataPoint | null => {
      if (point.avgCpuPercent === null || point.avgRamUsagePercent === null) {
        return null;
      }
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        cpu: point.avgCpuPercent,
        ram: point.avgRamUsagePercent,
      };
    };

    let historicalPoints = historyData.dataPoints
      .map(p => processPoint(p))
      .filter((p): p is ChartDataPoint => p !== null);

    if (timeRange === "7d" && historicalPoints.length > 50) {
      const step = Math.ceil(historicalPoints.length / 50);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    } else if (timeRange === "30d" && historicalPoints.length > 60) {
      const step = Math.ceil(historicalPoints.length / 60);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    }

    const allPoints = [
      ...historicalPoints,
      ...Array.from(liveDataPoints.values()),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return allPoints;
  }, [historyData, timeRange, liveDataPoints]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const tooltipFormatter = useCallback((value: number | undefined, name: string | undefined) => {
    const label = name === "cpu" ? "CPU" : "RAM";
    return [`${value?.toFixed(2) ?? "N/A"}%`, label];
  }, []);

  const timeRangeDescription = useMemo(() => {
    const labels: Record<TimeRange, string> = {
      "1h": "Last hour",
      "6h": "Last 6 hours",
      "24h": "Last 24 hours",
      "7d": "Last 7 days",
      "30d": "Last 30 days",
    };
    return labels[timeRange];
  }, [timeRange]);

  if (isLoading) {
    return (
      <BaseChartContainer
        title="CPU & RAM Over Time"
        description="Loading..."
        legend={legend}
      >
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-[#9CA3AF]">Loading CPU/RAM data...</div>
        </div>
      </BaseChartContainer>
    );
  }

  if (!chartData.length) {
    return (
      <BaseChartContainer
        title="CPU & RAM Over Time"
        description="No data available"
        legend={legend}
      >
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-[#9CA3AF]">
            No CPU/RAM data available (Public nodes only)
          </div>
        </div>
      </BaseChartContainer>
    );
  }

  const timeRangeButtons = TIME_RANGES.map((range) => (
    <button
      key={range.value}
      onClick={() => handleTimeRangeChange(range.value)}
      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
        timeRange === range.value
          ? "bg-[#3B82F6] text-white"
          : "bg-white/5 text-[#9CA3AF] hover:bg-white/10"
      }`}
    >
      {range.label}
    </button>
  ));

  return (
    <BaseChartContainer
      title="CPU & RAM Over Time"
      description={`${timeRangeDescription} · Resource utilization trends`}
      legend={legend}
    >
      <div className="mb-2 flex items-center justify-end">
        <div className="flex gap-2">
          {timeRangeButtons}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke={axis.stroke} style={axis.style} />
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
            contentStyle={{
              ...tooltip.contentStyle,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            labelStyle={tooltip.labelStyle}
            formatter={tooltipFormatter}
          />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#3B82F6"
            strokeWidth={2}
            name="cpu"
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="ram"
            stroke="#FACC15"
            strokeWidth={2}
            name="ram"
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
