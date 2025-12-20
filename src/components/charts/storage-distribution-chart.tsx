"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface StorageDistributionChartProps {
  data?: Array<{
    range: string;
    count: number;
  }>;
}

const defaultData = [
  { range: '0–1 GB', count: 12 },
  { range: '1–10 GB', count: 28 },
  { range: '10–50 GB', count: 45 },
  { range: '50–100 GB', count: 67 },
  { range: '100–500 GB', count: 52 },
  { range: '500+ GB', count: 22 },
];

export function StorageDistributionChart({ data = defaultData }: StorageDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const { range, count } = payload[0].payload;

    return (
      <div
        style={{
          background: "#0f0f0f",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 16,
        }}
      >
        <div><strong>Storage Range:</strong> {range}</div>
        <div><strong>Pods:</strong> {count}</div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">

      <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280] mb-6">
         Storage Distribution by Size Range
      </h3>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="range"
              tick={{ fill: "#e5e7eb", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0f0f0f' }} />

            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              fill="#7c3aed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
