import { Activity } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PodDetails } from "@/lib/types";
import { formatNumber, formatBytes } from "@/lib/formatters";

interface NetworkActivitySectionProps {
  pod: PodDetails;
}

export function NetworkActivitySection({ pod }: NetworkActivitySectionProps) {
  const networkMetrics = [
    "Active Streams",
    "Packets Sent",
    "Packets Received",
    "Total Bytes",
    "Total Pages",
    "Current Index",
  ];

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[#9CA3AF]" />
        <h2 className="text-lg font-semibold text-[#E5E7EB]">
          Network Activity
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {pod.visibility === "PUBLIC" ? (
          <>
            {pod.activeStreams !== undefined && (
              <KpiCard
                title="Active Streams"
                value={formatNumber(pod.activeStreams)}
              />
            )}
            {pod.packetsSent !== undefined && (
              <KpiCard
                title="Packets Sent"
                value={formatNumber(pod.packetsSent)}
              />
            )}
            {pod.packetsReceived !== undefined && (
              <KpiCard
                title="Packets Received"
                value={formatNumber(pod.packetsReceived)}
              />
            )}
            {pod.totalBytes !== undefined && (
              <KpiCard
                title="Total Bytes"
                value={formatBytes(pod.totalBytes)}
              />
            )}
            {pod.totalPages !== undefined && (
              <KpiCard
                title="Total Pages"
                value={formatNumber(pod.totalPages)}
              />
            )}
            {pod.currentIndex !== undefined && (
              <KpiCard
                title="Current Index"
                value={formatNumber(pod.currentIndex)}
              />
            )}
          </>
        ) : (
          <>
            {networkMetrics.map((label, index) => (
              <div key={index} className="relative">
                <KpiCard
                  title={label}
                  value="---"
                  className="blur-sm select-none"
                />
                <div className="absolute inset-0 bg-[#0b0b0b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                  <span className="flex items-center gap-2 text-[#9CA3AF] text-xs font-semibold">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
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
                    Locked
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
