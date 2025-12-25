"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
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
import { useNetworkHistory } from "@/hooks/use-network-history";
import { formatChartDate } from "@/lib/formatters";
import type { TimeRange } from "@/lib/api-client";
import type { NetworkHistoryPoint } from "@/lib/types";

interface ChartDataPoint {
  timestamp: string;
  date: string;
  committed: number;
  used: number;
  usedDisplay: number; // Used in appropriate unit (GB or TB)
}

interface StorageUtilizationChartProps {
  defaultTimeRange?: TimeRange;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export const StorageUtilizationChart = React.memo<StorageUtilizationChartProps>(({
  defaultTimeRange = "24h",
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [liveDataPoints, setLiveDataPoints] = useState<Map<string, ChartDataPoint>>(new Map());
  
  const { data: historyData, isLoading, isFetching } = useNetworkHistory(timeRange);

  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  // Clear live data points when time range changes
  useEffect(() => {
    setLiveDataPoints(new Map());
  }, [timeRange]);

  // Update live data points when new data arrives
  useEffect(() => {
    if (!historyData || !historyData.livePoint) return;

    const processPoint = (point: NetworkHistoryPoint): ChartDataPoint => {
      const committedTB = Number(point.totalStorageCommitted) / (1024 ** 4);
      const usedGB = Number(point.totalStorageUsed) / (1024 ** 3);
      const usedTB = usedGB / 1024;
      
      // Determine if we should use GB based on all historical data
      const maxUsedGB = Math.max(
        ...historyData.dataPoints.map(p => Number(p.totalStorageUsed) / (1024 ** 3)),
        usedGB
      );
      const useGB = maxUsedGB < 1024; // Use GB if max used is less than 1024 GB (1 TB)
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        committed: Math.round(committedTB * 100) / 100,
        used: usedTB,
        usedDisplay: useGB ? Math.round(usedGB * 100) / 100 : Math.round(usedTB * 100) / 100,
      };
    };

    const livePoint = processPoint(historyData.livePoint);
    const historicalTimestamps = new Set(historyData.dataPoints.map(p => p.timestamp));

    setLiveDataPoints((prev) => {
      const updated = new Map(prev);
      updated.set(livePoint.timestamp, livePoint);
      
      // Clean up old live points that are now in historical data
      for (const [ts] of updated) {
        if (historicalTimestamps.has(ts)) {
          updated.delete(ts);
        }
      }
      
      return updated;
    });
  }, [historyData, timeRange]);

  // Process historical + live data points (pure data transformation)
  const chartData = useMemo(() => {
    if (!historyData) return [];

    const processPoint = (point: NetworkHistoryPoint, useGB: boolean): ChartDataPoint => {
      const committedTB = Number(point.totalStorageCommitted) / (1024 ** 4);
      const usedGB = Number(point.totalStorageUsed) / (1024 ** 3);
      const usedTB = usedGB / 1024;
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        committed: Math.round(committedTB * 100) / 100,
        used: usedTB,
        usedDisplay: useGB ? Math.round(usedGB * 100) / 100 : Math.round(usedTB * 100) / 100,
      };
    };

    // First pass: determine if we should use GB or TB for used storage
    const maxUsedGB = Math.max(
      ...historyData.dataPoints.map(p => Number(p.totalStorageUsed) / (1024 ** 3)),
      ...Array.from(liveDataPoints.values()).map(p => p.used * 1024)
    );
    const useGB = maxUsedGB < 1024; // Use GB if max used is less than 1024 GB (1 TB)

    // Process historical data points
    let historicalPoints = historyData.dataPoints.map(p => processPoint(p, useGB));

    // Sample data points for long time ranges to avoid overcrowding
    if (timeRange === "7d" && historicalPoints.length > 50) {
      // Show ~50 points for 7 days (every ~3-4 hours if data is every 5 min)
      const step = Math.ceil(historicalPoints.length / 50);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    } else if (timeRange === "30d" && historicalPoints.length > 60) {
      // Show ~60 points for 30 days (roughly every 12 hours if data is every 5 min)
      const step = Math.ceil(historicalPoints.length / 60);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    }

    // Convert live data points to use correct unit
    const convertedLivePoints = Array.from(liveDataPoints.values()).map(p => ({
      ...p,
      usedDisplay: useGB ? (p.used * 1024) : p.used, // Convert TB to GB if needed
    }));

    // Merge historical + accumulated live points, sort by timestamp
    const allPoints = [
      ...historicalPoints,
      ...convertedLivePoints,
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return allPoints;
  }, [historyData, timeRange, liveDataPoints]);

  // Determine the unit for used storage
  const usedUnit = useMemo(() => {
    if (!chartData.length) return "GB";
    const maxUsedGB = Math.max(...chartData.map(p => p.used * 1024));
    return maxUsedGB < 1024 ? "GB" : "TB";
  }, [chartData]);

  // Calculate Y-axis ticks based on data range
  const usedAxisConfig = useMemo(() => {
    if (!chartData.length) return { ticks: [0, 10, 20, 30, 40, 50], domain: [0, 50] };
    
    const maxUsedGB = Math.max(...chartData.map(p => p.used * 1024));
    
    if (maxUsedGB < 100) {
      // Use 10 GB intervals until 100 GB
      const maxTick = Math.ceil(maxUsedGB / 10) * 10;
      const ticks = Array.from({ length: Math.floor(maxTick / 10) + 1 }, (_, i) => i * 10);
      return { ticks, domain: [0, maxTick] };
    } else if (maxUsedGB < 500) {
      // Use 100 GB intervals until 500 GB
      const maxTick = Math.ceil(maxUsedGB / 100) * 100;
      const ticks = Array.from({ length: Math.floor(maxTick / 100) + 1 }, (_, i) => i * 100);
      return { ticks, domain: [0, maxTick] };
    } else if (maxUsedGB < 1024) {
      // Use 500 GB intervals until 1 TB
      const maxTick = Math.ceil(maxUsedGB / 500) * 500;
      const ticks = Array.from({ length: Math.floor(maxTick / 500) + 1 }, (_, i) => i * 500);
      return { ticks, domain: [0, maxTick] };
    } else {
      // Use 1 TB intervals for TB range
      const maxUsedTB = maxUsedGB / 1024;
      const maxTick = Math.ceil(maxUsedTB);
      const ticks = Array.from({ length: maxTick + 1 }, (_, i) => i);
      return { ticks, domain: [0, maxTick] };
    }
  }, [chartData]);

  const tooltipFormatter = useCallback((value: number | undefined, name: string | undefined) => {
    if (name === "Committed") {
      return [`${value?.toFixed(2) ?? 0} TB`, "Committed"];
    } else {
      return [`${value?.toFixed(2) ?? 0} ${usedUnit}`, "Used"];
    }
  }, [usedUnit]);

  const legend = useMemo(() => [
    { color: "#1E40AF", label: "Committed" },
    { color: "#FACC15", label: "Used" }
  ], []);

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
        title="Storage Utilization Trend"
        description="Loading..."
        legend={legend}
      >
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-[#9CA3AF]">Loading chart data...</p>
        </div>
      </BaseChartContainer>
    );
  }

  if (!chartData.length) {
    return (
      <BaseChartContainer
        title="Storage Utilization Trend"
        description={timeRangeDescription}
        legend={legend}
      >
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-[#9CA3AF]">No storage data available</p>
        </div>
      </BaseChartContainer>
    );
  }

  return (
    <BaseChartContainer
      title="Storage Utilization Trend"
      description={`${timeRangeDescription} · Committed vs Used`}
      legend={legend}
      rightElement={
        <div className="flex gap-1 rounded-lg border border-white/10 bg-[#0b0b0b] p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                timeRange === range.value
                  ? "bg-[#1E40AF] text-white"
                  : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
              }`}
            >
              {range.label}
            </button>
          ))}
          {isFetching && (
            <div className="ml-2 flex items-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1E40AF] border-t-transparent" />
            </div>
          )}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            stroke={axis.stroke} 
            style={axis.style}
            angle={timeRange === "7d" || timeRange === "30d" ? -45 : 0}
            textAnchor={timeRange === "7d" || timeRange === "30d" ? "end" : "middle"}
            height={timeRange === "7d" || timeRange === "30d" ? 60 : 30}
          />
          <YAxis
            yAxisId="left"
            stroke={axis.stroke}
            style={axis.style}
            label={{
              value: "Committed (TB)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#1E40AF", fontSize: "11px" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={axis.stroke}
            style={axis.style}
            domain={usedAxisConfig.domain}
            ticks={usedAxisConfig.ticks}
            label={{
              value: `Used (${usedUnit})`,
              angle: 90,
              position: "insideRight",
              style: { fill: "#FACC15", fontSize: "11px" },
            }}
          />
          <Tooltip
            contentStyle={{ ...tooltip.contentStyle, border: "1px solid rgba(255,255,255,0.1)" }}
            labelStyle={tooltip.labelStyle}
            formatter={tooltipFormatter}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="committed"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="Committed"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="usedDisplay"
            stroke="#FACC15"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            name="Used"
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
