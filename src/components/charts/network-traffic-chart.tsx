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
  bytes: number; 
  display: number;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export const NetworkTrafficChart = React.memo(() => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [liveDataPoints, setLiveDataPoints] = useState<Map<string, ChartDataPoint>>(new Map());
  
  const { data: historyData, isLoading, isFetching } = useNetworkHistory(timeRange);

  const tooltip = useMemo(() => getDefaultTooltipStyle(), []);
  const axis = useMemo(() => getDefaultAxisStyle(), []);

  const legend = useMemo(() => [{ color: "#22C55E", label: "Total Bytes" }], []);

  useEffect(() => {
    setLiveDataPoints(new Map());
  }, [timeRange]);

  useEffect(() => {
    if (!historyData || !historyData.livePoint) return;

    const processPoint = (point: NetworkHistoryPoint): ChartDataPoint | null => {
      if (point.totalBytes === null) {
        return null;
      }
      
      const rawBytes = Number(point.totalBytes);
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        bytes: rawBytes,
        display: rawBytes,
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
      if (point.totalBytes === null) {
        return null;
      }
      
      const rawBytes = Number(point.totalBytes);
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        bytes: rawBytes,
        display: rawBytes,
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

  const unitInfo = useMemo(() => {
    if (!chartData.length) return { unit: "KB", divisor: 1024 };
    
    const maxBytes = Math.max(...chartData.map(p => p.bytes));
    
    // Determine unit based on max value: KB -> MB -> GB -> TB
    if (maxBytes < 1024 * 999) {
      // Less than 999 KB
      return { unit: "KB", divisor: 1024 };
    } else if (maxBytes < 1024 * 1024 * 999) {
      // Less than 999 MB
      return { unit: "MB", divisor: 1024 * 1024 };
    } else if (maxBytes < 1024 * 1024 * 1024 * 999) {
      // Less than 999 GB
      return { unit: "GB", divisor: 1024 * 1024 * 1024 };
    } else {
      // 1000 GB or more -> use TB
      return { unit: "TB", divisor: 1024 * 1024 * 1024 * 1024 };
    }
  }, [chartData]);

  const displayData = useMemo(() => {
    return chartData.map(point => ({
      ...point,
      display: Math.round((point.bytes / unitInfo.divisor) * 100) / 100,
    }));
  }, [chartData, unitInfo]);

  const tooltipFormatter = useCallback((value: number | undefined) => {
    if (value === undefined) return ["N/A", "Total Bytes"];
    return [`${value.toFixed(2)} ${unitInfo.unit}`, "Total Bytes"];
  }, [unitInfo]);

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
        title="Network Traffic Over Time"
        description="Loading..."
        legend={legend}
      >
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-[#9CA3AF]">Loading network traffic data...</div>
        </div>
      </BaseChartContainer>
    );
  }

  if (!chartData.length) {
    return (
      <BaseChartContainer
        title="Network Traffic Over Time"
        description="No data available"
        legend={legend}
      >
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-[#9CA3AF]">
            No network traffic data available (Public nodes only)
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
          ? "bg-[#22C55E] text-black"
          : "bg-white/5 text-[#9CA3AF] hover:bg-white/10"
      }`}
    >
      {range.label}
    </button>
  ));

  return (
    <BaseChartContainer
      title="Network Traffic Over Time"
      description={`${timeRangeDescription} · Total bytes transmitted`}
      legend={legend}
    >
      <div className="mb-2 flex items-center justify-end">
        <div className="flex gap-2">
          {timeRangeButtons}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke={axis.stroke} style={axis.style} />
          <YAxis
            stroke={axis.stroke}
            style={axis.style}
            label={{
              value: `Total Bytes (${unitInfo.unit})`,
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
            dataKey="display"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
});
