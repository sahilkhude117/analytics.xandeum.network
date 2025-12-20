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

interface CpuRamChartProps {
  data?: Array<{ time: string; cpu: number; ram: number }>;
}

const defaultData = [
  { time: "00:00", cpu: 42, ram: 38 },
  { time: "04:00", cpu: 45, ram: 41 },
  { time: "08:00", cpu: 52, ram: 46 },
  { time: "12:00", cpu: 48, ram: 43 },
  { time: "16:00", cpu: 55, ram: 49 },
  { time: "20:00", cpu: 50, ram: 45 },
  { time: "Now", cpu: 47, ram: 42 },
];

export function CpuRamChart({ data = defaultData }: CpuRamChartProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          CPU & RAM Over Time
        </h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Resource utilization trends</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: "12px" }} />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
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
              backgroundColor: "#0A0A0A",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              color: "#E5E7EB",
            }}
            labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
            formatter={(value: number | undefined) => [`${value ?? "N/A"}%`]}
          />
          {/* Legend replaced by colored chips below for consistent styling */}
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#3B82F6"
            strokeWidth={2}
            name="CPU"
            dot={{ fill: "#3B82F6", r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ram"
            stroke="#FACC15"
            strokeWidth={2}
            name="RAM"
            dot={{ fill: "#FACC15", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <div className="h-3 w-3 rounded-sm bg-[#3B82F6]" />
        <span className="text-[#9CA3AF]">CPU</span>
        <div className="h-3 w-3 rounded-sm bg-[#FACC15] ml-4" />
        <span className="text-[#9CA3AF]">RAM</span>
      </div>
    </div>
  );
}
