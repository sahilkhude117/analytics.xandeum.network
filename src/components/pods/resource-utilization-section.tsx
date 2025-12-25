"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Cpu, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

interface ResourceUtilizationSectionProps {
  idOrPubkey: string;
  isPublic: boolean;
  currentCpuPercent?: number;
  currentRamUsed?: number;
  currentRamTotal?: number;
}

interface CpuDataPoint {
  timestamp: string;
  date: string;
  percent: number;
}

interface RamDataPoint {
  timestamp: string;
  date: string;
  used: number;
  total: number;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export const ResourceUtilizationSection = React.memo<ResourceUtilizationSectionProps>(({
  idOrPubkey,
  isPublic,
  currentCpuPercent,
  currentRamUsed,
  currentRamTotal,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [liveCpuPoints, setLiveCpuPoints] = useState<Map<string, CpuDataPoint>>(new Map());
  const [liveRamPoints, setLiveRamPoints] = useState<Map<string, RamDataPoint>>(new Map());
  
  const { data: historyData, isLoading, isFetching } = usePnodeHistory(
    idOrPubkey,
    timeRange,
    isPublic 
  );

  useEffect(() => {
    setLiveCpuPoints(new Map());
    setLiveRamPoints(new Map());
  }, [timeRange]);

  useEffect(() => {
    if (!historyData || !historyData.livePoint || !isPublic) return;

    const livePoint = historyData.livePoint;

    if (livePoint.cpuPercent !== null) {
      const cpuPoint: CpuDataPoint = {
        timestamp: livePoint.timestamp,
        date: formatChartDate(livePoint.timestamp, timeRange),
        percent: livePoint.cpuPercent,
      };

      const historicalTimestamps = new Set(historyData.dataPoints.map(p => p.timestamp));

      setLiveCpuPoints((prev) => {
        const updated = new Map(prev);
        updated.set(cpuPoint.timestamp, cpuPoint);

        for (const [ts] of updated) {
          if (historicalTimestamps.has(ts)) {
            updated.delete(ts);
          }
        }
        
        return updated;
      });
    }

    if (livePoint.ramUsed !== null && livePoint.ramTotal !== null) {
      const ramPoint: RamDataPoint = {
        timestamp: livePoint.timestamp,
        date: formatChartDate(livePoint.timestamp, timeRange),
        used: Number(livePoint.ramUsed) / (1024 ** 3),
        total: Number(livePoint.ramTotal) / (1024 ** 3),
      };

      const historicalTimestamps = new Set(historyData.dataPoints.map(p => p.timestamp));

      setLiveRamPoints((prev) => {
        const updated = new Map(prev);
        updated.set(ramPoint.timestamp, ramPoint);

        for (const [ts] of updated) {
          if (historicalTimestamps.has(ts)) {
            updated.delete(ts);
          }
        }
        
        return updated;
      });
    }
  }, [historyData, timeRange, isPublic]);

  const cpuChartData = useMemo(() => {
    if (!historyData || !isPublic) return [];

    const processCpuPoint = (point: PNodeHistoryPoint): CpuDataPoint | null => {
      if (point.cpuPercent === null) return null;
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        percent: point.cpuPercent,
      };
    };

    let historicalPoints = historyData.dataPoints
      .map(p => processCpuPoint(p))
      .filter((p): p is CpuDataPoint => p !== null);

    if (timeRange === "7d" && historicalPoints.length > 50) {
      const step = Math.ceil(historicalPoints.length / 50);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    } else if (timeRange === "30d" && historicalPoints.length > 60) {
      const step = Math.ceil(historicalPoints.length / 60);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    }

    const allPoints = [
      ...historicalPoints,
      ...Array.from(liveCpuPoints.values()),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return allPoints;
  }, [historyData, timeRange, liveCpuPoints, isPublic]);

  const ramChartData = useMemo(() => {
    if (!historyData || !isPublic) return [];

    const processRamPoint = (point: PNodeHistoryPoint): RamDataPoint | null => {
      if (point.ramUsed === null || point.ramTotal === null) return null;
      
      return {
        timestamp: point.timestamp,
        date: formatChartDate(point.timestamp, timeRange),
        used: Number(point.ramUsed) / (1024 ** 3),
        total: Number(point.ramTotal) / (1024 ** 3),
      };
    };

    let historicalPoints = historyData.dataPoints
      .map(p => processRamPoint(p))
      .filter((p): p is RamDataPoint => p !== null);

    if (timeRange === "7d" && historicalPoints.length > 50) {
      const step = Math.ceil(historicalPoints.length / 50);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    } else if (timeRange === "30d" && historicalPoints.length > 60) {
      const step = Math.ceil(historicalPoints.length / 60);
      historicalPoints = historicalPoints.filter((_, index) => index % step === 0);
    }

    const allPoints = [
      ...historicalPoints,
      ...Array.from(liveRamPoints.values()),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return allPoints;
  }, [historyData, timeRange, liveRamPoints, isPublic]);

  const maxRamTotal = useMemo(() => {
    if (!ramChartData.length) return 32;
    return Math.max(...ramChartData.map(p => p.total));
  }, [ramChartData]);

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

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-[#9CA3AF]" />
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Resource Utilization
          </h2>
          {isPublic && <span className="text-sm text-[#6B7280]">· {timeRangeDescription}</span>}
        </div>
        {isPublic && (
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
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CPU Usage */}
        <div className="relative rounded-lg border border-white/5 bg-[#0b0b0b] p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-[#E5E7EB]">CPU Usage</h3>
            {isPublic ? (
              <div className="mt-1 text-2xl font-bold text-[#E5E7EB]">
                {currentCpuPercent !== undefined ? `${currentCpuPercent}%` : "N/A"}
                <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                  current
                </span>
              </div>
            ) : (
              <div className="mt-1 text-2xl font-bold text-[#E5E7EB] select-none blur-sm">
                ---%
                <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                  current
                </span>
              </div>
            )}
          </div>
          {isPublic && !isLoading && cpuChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cpuChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  domain={[0, 100]}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#E5E7EB" }}
                  itemStyle={{ color: "#E5E7EB" }}
                  formatter={(value: number | undefined) =>
                    value !== undefined ? `${value.toFixed(1)}%` : "N/A"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="#22C55E"
                  strokeWidth={2}
                  name="CPU %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : isPublic && isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
            </div>
          ) : isPublic ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-[#9CA3AF]">No data available</p>
            </div>
          ) : (
            <div className="w-full h-[200px] bg-[#181818] blur-sm rounded"></div>
          )}
          {!isPublic && (
            <div className="absolute inset-0 bg-[#0b0b0b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <span className="flex items-center gap-2 text-[#9CA3AF] text-sm font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 4h.01M19.07 4.93a10 10 0 11-14.14 0m14.14 0A10 10 0 004.93 19.07m14.14-14.14L4.93 19.07"
                  />
                </svg>
                Private Data Locked
              </span>
            </div>
          )}
        </div>

        {/* RAM Usage */}
        <div className="relative rounded-lg border border-white/5 bg-[#0b0b0b] p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-[#E5E7EB]">RAM Usage</h3>
            {isPublic ? (
              <div className="mt-1 text-2xl font-bold text-[#E5E7EB]">
                {currentRamUsed !== undefined ? `${currentRamUsed.toFixed(1)} GB` : "N/A"}
                <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                  / {currentRamTotal !== undefined ? `${currentRamTotal.toFixed(1)} GB` : "N/A"}
                </span>
              </div>
            ) : (
              <div className="mt-1 text-2xl font-bold text-[#E5E7EB] select-none blur-sm">
                --- GB
                <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                  / --- GB
                </span>
              </div>
            )}
          </div>
          {isPublic && !isLoading && ramChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ramChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  domain={[0, maxRamTotal]}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#E5E7EB" }}
                  itemStyle={{ color: "#E5E7EB" }}
                  formatter={(value: number | undefined) =>
                    value !== undefined ? `${value.toFixed(2)} GB` : "N/A"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="used"
                  stroke="#60A5FA"
                  fill="#60A5FA40"
                  name="RAM Used"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : isPublic && isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
            </div>
          ) : isPublic ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-[#9CA3AF]">No data available</p>
            </div>
          ) : (
            <div className="w-full h-[200px] bg-[#181818] blur-sm rounded"></div>
          )}
          {!isPublic && (
            <div className="absolute inset-0 bg-[#0b0b0b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <span className="flex items-center gap-2 text-[#9CA3AF] text-sm font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 4h.01M19.07 4.93a10 10 0 11-14.14 0m14.14 0A10 10 0 004.93 19.07m14.14-14.14L4.93 19.07"
                  />
                </svg>
                Private Data Locked
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ResourceUtilizationSection.displayName = "ResourceUtilizationSection";
