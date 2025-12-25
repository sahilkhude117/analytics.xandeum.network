"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Database, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePnodeHistory } from "@/hooks/use-pnode-history";
import { TimeRange } from "@/lib/api-client";
import { formatChartDate } from "@/lib/formatters";
import type { PNodeHistoryPoint } from "@/lib/types";

interface StorageUtilizationChartProps {
  idOrPubkey: string;
}

interface ChartDataPoint {
  timestamp: string;
  date: string;
  committed: number; // Always in GB
  used: number; // In MB or GB based on scale
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export const StorageUtilizationChart = React.memo<StorageUtilizationChartProps>(({ idOrPubkey }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [liveDataPoints, setLiveDataPoints] = useState<Map<string, ChartDataPoint>>(new Map());
  
  const { data: historyData, isLoading, isFetching } = usePnodeHistory(idOrPubkey, timeRange, true);

  useEffect(() => {
    setLiveDataPoints(new Map());
  }, [timeRange]);

  useEffect(() => {
    if (!historyData || !historyData.livePoint) return;

    const processPoint = (point: PNodeHistoryPoint, useMB: boolean): ChartDataPoint => {
      const committedGB = Number(point.storageCommitted) / (1024 ** 3);
      const usedBytes = Number(point.storageUsed);
      const usedGB = usedBytes / (1024 ** 3);
      const usedMB = usedBytes / (1024 ** 2);
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        committed: Math.round(committedGB * 100) / 100,
        used: useMB ? Math.round(usedMB * 100) / 100 : Math.round(usedGB * 100) / 100,
      };
    };

    const maxUsedGB = Math.max(
      ...historyData.dataPoints.map(p => Number(p.storageUsed) / (1024 ** 3)),
      Number(historyData.livePoint.storageUsed) / (1024 ** 3)
    );
    const useMB = maxUsedGB < 1; 

    const livePoint = processPoint(historyData.livePoint, useMB);
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

  const { chartData, usedUnit } = useMemo(() => {
    if (!historyData) return { chartData: [], usedUnit: "MB" };

    const maxUsedGB = Math.max(
      ...historyData.dataPoints.map(p => Number(p.storageUsed) / (1024 ** 3)),
      ...Array.from(liveDataPoints.values()).map(p => {
        const firstHistorical = historyData.dataPoints[0];
        if (firstHistorical) {
          const firstGB = Number(firstHistorical.storageUsed) / (1024 ** 3);
          return firstGB < 1 ? p.used / 1024 : p.used;
        }
        return p.used;
      })
    );
    const useMB = maxUsedGB < 1;
    const unit = useMB ? "MB" : "GB";

    const processPoint = (point: PNodeHistoryPoint): ChartDataPoint => {
      const committedGB = Number(point.storageCommitted) / (1024 ** 3);
      const usedBytes = Number(point.storageUsed);
      const usedGB = usedBytes / (1024 ** 3);
      const usedMB = usedBytes / (1024 ** 2);
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        committed: Math.round(committedGB * 100) / 100,
        used: useMB ? Math.round(usedMB * 100) / 100 : Math.round(usedGB * 100) / 100,
      };
    };

    let historicalPoints = historyData.dataPoints.map(p => processPoint(p));

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

    return { chartData: allPoints, usedUnit: unit };
  }, [historyData, timeRange, liveDataPoints]);

  const usedAxisConfig = useMemo(() => {
    if (!chartData.length) return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
    
    const maxUsed = Math.max(...chartData.map(p => p.used));
    
    if (usedUnit === "MB") {
      if (maxUsed < 10) {
        const maxTick = Math.ceil(maxUsed);
        const ticks = Array.from({ length: maxTick + 1 }, (_, i) => i);
        return { domain: [0, maxTick], ticks };
      } else if (maxUsed < 100) {
        const maxTick = Math.ceil(maxUsed / 10) * 10;
        const ticks = Array.from({ length: Math.floor(maxTick / 10) + 1 }, (_, i) => i * 10);
        return { domain: [0, maxTick], ticks };
      } else if (maxUsed < 500) {
        const maxTick = Math.ceil(maxUsed / 100) * 100;
        const ticks = Array.from({ length: Math.floor(maxTick / 100) + 1 }, (_, i) => i * 100);
        return { domain: [0, maxTick], ticks };
      } else {
        const maxTick = Math.ceil(maxUsed / 500) * 500;
        const ticks = Array.from({ length: Math.floor(maxTick / 500) + 1 }, (_, i) => i * 500);
        return { domain: [0, maxTick], ticks };
      }
    } else {
      if (maxUsed < 10) {
        const maxTick = Math.ceil(maxUsed);
        const ticks = Array.from({ length: maxTick + 1 }, (_, i) => i);
        return { domain: [0, maxTick], ticks };
      } else if (maxUsed < 100) {
        const maxTick = Math.ceil(maxUsed / 10) * 10;
        const ticks = Array.from({ length: Math.floor(maxTick / 10) + 1 }, (_, i) => i * 10);
        return { domain: [0, maxTick], ticks };
      } else {
        const maxTick = Math.ceil(maxUsed / 100) * 100;
        const ticks = Array.from({ length: Math.floor(maxTick / 100) + 1 }, (_, i) => i * 100);
        return { domain: [0, maxTick], ticks };
      }
    }
  }, [chartData, usedUnit]);

  const committedAxisConfig = useMemo(() => {
    if (!chartData.length) return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
    
    const maxCommitted = Math.max(...chartData.map(p => p.committed));
    
    if (maxCommitted < 10) {
      const maxTick = Math.ceil(maxCommitted);
      const ticks = Array.from({ length: maxTick + 1 }, (_, i) => i);
      return { domain: [0, maxTick], ticks };
    } else if (maxCommitted < 100) {
      const maxTick = Math.ceil(maxCommitted / 10) * 10;
      const ticks = Array.from({ length: Math.floor(maxTick / 10) + 1 }, (_, i) => i * 10);
      return { domain: [0, maxTick], ticks };
    } else {
      const maxTick = Math.ceil(maxCommitted / 100) * 100;
      const ticks = Array.from({ length: Math.floor(maxTick / 100) + 1 }, (_, i) => i * 100);
      return { domain: [0, maxTick], ticks };
    }
  }, [chartData]);

  const tooltipFormatter = useCallback((value: number | undefined, name: string | undefined) => {
    if (name === "Committed") {
      return [`${value?.toFixed(2) ?? 0} GB`, "Committed"];
    } else {
      return [`${value?.toFixed(2) ?? 0} ${usedUnit}`, "Used"];
    }
  }, [usedUnit]);

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
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-[#9CA3AF]" />
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Storage Utilization
          </h2>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
          </div>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#9CA3AF]" />
            <h2 className="text-lg font-semibold text-[#E5E7EB]">
              Storage Utilization
            </h2>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-[#9CA3AF]">No historical data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[#9CA3AF]" />
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Storage Utilization
          </h2>
          <span className="text-sm text-[#6B7280]">· {timeRangeDescription}</span>
        </div>
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
            <div className="flex items-center px-2">
              <Loader2 className="h-3 w-3 animate-spin text-[#9CA3AF]" />
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
            />
            {usedUnit === "GB" ? (
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: "12px" }}
                label={{ value: "GB", angle: -90, position: "insideLeft", style: { fill: "#6B7280" } }}
                domain={committedAxisConfig.domain}
                ticks={committedAxisConfig.ticks}
              />
            ) : (
              <>
                <YAxis
                  yAxisId="left"
                  stroke="#1E40AF"
                  style={{ fontSize: "12px" }}
                  label={{ value: "GB", angle: -90, position: "insideLeft", style: { fill: "#6B7280" } }}
                  domain={committedAxisConfig.domain}
                  ticks={committedAxisConfig.ticks}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#FACC15"
                  style={{ fontSize: "12px" }}
                  label={{ value: usedUnit, angle: 90, position: "insideRight", style: { fill: "#6B7280" } }}
                  domain={usedAxisConfig.domain}
                  ticks={usedAxisConfig.ticks}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #ffffff20",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#E5E7EB" }}
              itemStyle={{ color: "#E5E7EB" }}
              formatter={tooltipFormatter}
            />
            <Line
              yAxisId={usedUnit === "GB" ? undefined : "left"}
              type="monotone"
              dataKey="committed"
              stroke="#1E40AF"
              strokeWidth={2}
              name="Committed"
              dot={false}
            />
            <Line
              yAxisId={usedUnit === "GB" ? undefined : "right"}
              type="monotone"
              dataKey="used"
              stroke="#FACC15"
              strokeWidth={2}
              name="Used"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#1E40AF]" />
            <span className="text-[#9CA3AF]">Committed (GB)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#FACC15]" />
            <span className="text-[#9CA3AF]">Used ({usedUnit})</span>
          </div>
        </div>
      </div>
    </div>
  );
});

StorageUtilizationChart.displayName = "StorageUtilizationChart";
