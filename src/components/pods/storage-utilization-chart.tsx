"use client";

import { Database } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PodDetails } from "@/lib/types";

interface StorageUtilizationChartProps {
  pod: PodDetails;
}

export function StorageUtilizationChart({ pod }: StorageUtilizationChartProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-[#9CA3AF]" />
        <h2 className="text-lg font-semibold text-[#E5E7EB]">
          Storage Utilization
        </h2>
      </div>
      <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pod.storageHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="timestamp"
              stroke="#6B7280"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis stroke="#6B7280" label={{ value: "GB", angle: -90 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #ffffff20",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#E5E7EB" }}
              itemStyle={{ color: "#E5E7EB" }}
              formatter={(value: number | undefined) =>
                value !== undefined ? `${value.toFixed(1)} GB` : "N/A"
              }
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }
            />
            <Line
              type="monotone"
              dataKey="committed"
              stroke="#1E40AF"
              strokeWidth={2}
              name="Storage Committed"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="used"
              stroke="#FACC15"
              strokeWidth={2}
              name="Storage Used"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#1E40AF]" />
            <span className="text-[#9CA3AF]">Committed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#FACC15]" />
            <span className="text-[#9CA3AF]">Used</span>
          </div>
        </div>
      </div>
    </div>
  );
}
