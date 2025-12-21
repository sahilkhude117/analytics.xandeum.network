"use client";

import { Cpu } from "lucide-react";
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
import { PodDetails } from "@/lib/types";

interface ResourceUtilizationSectionProps {
  pod: PodDetails;
}

export function ResourceUtilizationSection({
  pod,
}: ResourceUtilizationSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <Cpu className="h-5 w-5 text-[#9CA3AF]" />
        <h2 className="text-lg font-semibold text-[#E5E7EB]">
          Resource Utilization
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CPU Usage */}
        <div className="relative rounded-lg border border-white/5 bg-[#0b0b0b] p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-[#E5E7EB]">CPU Usage</h3>
            {pod.visibility === "PUBLIC" ? (
              <div className="mt-1 text-2xl font-bold text-[#E5E7EB]">
                {pod.cpuPercent}%
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
          {pod.visibility === "PUBLIC" && pod.cpuHistory ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pod.cpuHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#6B7280"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
                <YAxis stroke="#6B7280" domain={[0, 100]} />
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
                  labelFormatter={(label) => new Date(label).toLocaleString()}
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
          ) : (
            <div className="w-full h-[200px] bg-[#181818] blur-sm rounded"></div>
          )}
          {pod.visibility === "PRIVATE" && (
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
            {pod.visibility === "PUBLIC" ? (
              <div className="mt-1 text-2xl font-bold text-[#E5E7EB]">
                {pod.ramUsed?.toFixed(1)} GB
                <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                  / {pod.ramTotal} GB
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
          {pod.visibility === "PUBLIC" && pod.ramHistory ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={pod.ramHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#6B7280"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
                <YAxis stroke="#6B7280" domain={[0, pod.ramTotal || 32]} />
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
                  labelFormatter={(label) => new Date(label).toLocaleString()}
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
          ) : (
            <div className="w-full h-[200px] bg-[#181818] blur-sm rounded"></div>
          )}
          {pod.visibility === "PRIVATE" && (
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
}
