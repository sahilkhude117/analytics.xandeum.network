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

interface StorageUtilizationChartProps {
  data?: Array<{
    date: string;
    committed: number;
    used: number;
  }>;
}

const defaultData = [
  { date: "Dec 13", committed: 168.2, used: 102.1 },
  { date: "Dec 14", committed: 169.5, used: 103.8 },
  { date: "Dec 15", committed: 170.1, used: 105.2 },
  { date: "Dec 16", committed: 171.3, used: 106.7 },
  { date: "Dec 17", committed: 171.8, used: 107.3 },
  { date: "Dec 18", committed: 172.2, used: 107.9 },
  { date: "Dec 19", committed: 172.6, used: 108.4 },
];

export function StorageUtilizationChart({
  data = defaultData,
}: StorageUtilizationChartProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Storage Utilization Trend
        </h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Last 7 days · Committed vs Used
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            label={{
              value: "Storage (TB)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#6B7280", fontSize: "12px" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0A0A0A",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#E5E7EB",
            }}
            labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
            formatter={(value: number | undefined) => [`${value?.toFixed(1) ?? 0} TB`, ""]}
          />
          <Line
            type="monotone"
            dataKey="committed"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={{ fill: "#1E40AF", r: 4 }}
            activeDot={{ r: 6 }}
            name="Committed"
          />
          <Line
            type="monotone"
            dataKey="used"
            stroke="#FACC15"
            strokeWidth={2}
            dot={{ fill: "#FACC15", r: 4 }}
            activeDot={{ r: 6 }}
            name="Used"
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
  );
}
