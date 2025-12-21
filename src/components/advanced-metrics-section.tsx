"use client";

import { useEffect } from "react";
import { ChevronUp, ChevronDown, Info } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { CpuRamChart } from "@/components/charts/cpu-ram-chart";
import { NetworkTrafficChart } from "@/components/charts/network-traffic-chart";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAdvancedMetrics, showTooltip, hideTooltip } from "@/store/uiSlice";

interface AdvancedMetricsProps {
  avgCpu: number;
  avgRam: number;
  totalStreams: number;
  totalPacketsSent: number;
  totalPacketsReceived: number;
  totalPages: number;
}

export function AdvancedMetricsSection({
  avgCpu,
  avgRam,
  totalStreams,
  totalPacketsSent,
  totalPacketsReceived,
  totalPages,
}: AdvancedMetricsProps) {
  const dispatch = useAppDispatch();
  const isExpanded = useAppSelector((s) => s.ui.advancedMetricsExpanded);
  const showTooltipState = useAppSelector((s) => s.ui.tooltips["advanced-info"] ?? false);

  return (
    <div className="mt-8 mb-12">
      {/* Expand Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => dispatch(toggleAdvancedMetrics())}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0b0b0b] px-6 py-3 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] hover:bg-[#1E40AF]/10"
        >
          <span>Advanced Network Metrics (Public Nodes Only)</span>
          <div className="relative">
            <Info
              className="h-4 w-4 text-[#60A5FA] cursor-help"
              onMouseEnter={() => dispatch(showTooltip("advanced-info"))}
              onMouseLeave={() => dispatch(hideTooltip("advanced-info"))}
            />
            {showTooltipState && (
              <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-[#60A5FA]/20 bg-[#0b1537] p-3 text-xs text-[#E5E7EB] shadow-lg z-50">
                <p className="font-semibold text-[#60A5FA] mb-1">
                  Public Nodes Only
                </p>
                <p className="text-[#9CA3AF]">
                  This data is only available for public pods. Private pods do not expose advanced metrics.
                </p>
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Advanced Metrics Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <KpiCard title="Avg CPU %" value={`${avgCpu}%`} />
            <KpiCard title="Avg RAM Usage %" value={`${avgRam}%`} />
            <KpiCard title="Total Active Streams" value={totalStreams.toLocaleString()} />
            <KpiCard
              title="Total Packets Sent"
              value={totalPacketsSent.toLocaleString()}
            />
            <KpiCard
              title="Total Packets Received"
              value={totalPacketsReceived.toLocaleString()}
            />
            <KpiCard title="Total Pages" value={totalPages.toLocaleString()} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CpuRamChart />
            <NetworkTrafficChart />
          </div>
        </div>
      )}
    </div>
  );
}
