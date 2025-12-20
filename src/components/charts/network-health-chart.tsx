"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "24h" | "7d" | "30d";

const mockData = {
  "24h": [
    { time: "00:00", health: 92 },
    { time: "04:00", health: 93 },
    { time: "08:00", health: 91 },
    { time: "12:00", health: 94 },
    { time: "16:00", health: 95 },
    { time: "20:00", health: 93 },
    { time: "Now", health: 94 },
  ],
  "7d": [
    { time: "Dec 15", health: 89 },
    { time: "Dec 16", health: 91 },
    { time: "Dec 17", health: 92 },
    { time: "Dec 18", health: 93 },
    { time: "Dec 19", health: 94 },
    { time: "Dec 20", health: 93 },
    { time: "Dec 21", health: 94 },
  ],
  "30d": [
    { time: "Nov 22", health: 85 },
    { time: "Nov 27", health: 87 },
    { time: "Dec 2", health: 88 },
    { time: "Dec 7", health: 90 },
    { time: "Dec 12", health: 91 },
    { time: "Dec 17", health: 93 },
    { time: "Dec 21", health: 94 },
  ],
};

export function NetworkHealthChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const data = mockData[timeRange];

  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Network Health Growth
          </h3>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Health score trend over time
          </p>
        </div>
        <div className="flex gap-2">
          {(["24h", "7d", "30d"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === range
                  ? "bg-[#FACC15] text-black"
                  : "bg-white/5 text-[#9CA3AF] hover:bg-white/10"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            domain={[0, 100]}
            label={{
              value: "Health Score (%)",
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
            formatter={(value: number | undefined) => [`${value ?? 'N/A'}%`, "Health Score"]}
          />
          <Line
            type="monotone"
            dataKey="health"
            stroke="#FACC15"
            strokeWidth={2}
            dot={{ fill: "#FACC15", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <div className="h-3 w-3 rounded-sm bg-[#FACC15]" />
        <span className="text-[#9CA3AF]">Health Score</span>
      </div>
    </div>
  );
}
