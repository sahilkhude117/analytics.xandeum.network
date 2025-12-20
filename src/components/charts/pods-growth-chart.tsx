"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PodsGrowthChartProps {
  data?: { time: string; pods: number }[];
}

const defaultData = [
  { time: "Dec 15", pods: 98 },
  { time: "Dec 16", pods: 102 },
  { time: "Dec 17", pods: 110 },
  { time: "Dec 18", pods: 118 },
  { time: "Dec 19", pods: 125 },
  { time: "Dec 20", pods: 132 },
  { time: "Dec 21", pods: 140 },
];

export function PodsGrowthChart({ data = defaultData }: PodsGrowthChartProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Pods Growth Over Time
        </h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Total pods tracked over time</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0A0A0A",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              color: "#E5E7EB",
            }}
            labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
            formatter={(value: number | undefined) => [`${value ?? "N/A"}`, "Pods"]}
          />
          <Line
            type="monotone"
            dataKey="pods"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={{ fill: "#1E40AF", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <div className="h-3 w-3 rounded-sm bg-[#1E40AF]" />
        <span className="text-[#9CA3AF]">Pods</span>
      </div>
    </div>
  );
}
