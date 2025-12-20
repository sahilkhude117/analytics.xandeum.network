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

interface NetworkTrafficChartProps {
  data?: Array<{ time: string; bytes: number }>;
}

const defaultData = [
  { time: "Dec 15", bytes: 450 },
  { time: "Dec 16", bytes: 478 },
  { time: "Dec 17", bytes: 512 },
  { time: "Dec 18", bytes: 545 },
  { time: "Dec 19", bytes: 589 },
  { time: "Dec 20", bytes: 621 },
  { time: "Dec 21", bytes: 658 },
];

export function NetworkTrafficChart({ data = defaultData }: NetworkTrafficChartProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Network Traffic Over Time
        </h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Total bytes transmitted</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: "12px" }} />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            label={{
              value: "Total Bytes (GB)",
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
            formatter={(value: number | undefined) => [`${value ?? "N/A"} GB`, "Total Bytes"]}
          />
          <Line
            type="monotone"
            dataKey="bytes"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ fill: "#22C55E", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <div className="h-3 w-3 rounded-sm bg-[#22C55E]" />
        <span className="text-[#9CA3AF]">Total Bytes</span>
      </div>
    </div>
  );
}
