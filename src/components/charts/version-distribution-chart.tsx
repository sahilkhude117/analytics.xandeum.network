"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface VersionDistributionChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { name: "0.8.0", value: 3, color: "#1E40AF" }, // blue
  { name: "0.8.0-trynet.20251217", value: 2, color: "#008000" }, // purple
  { name: "0.8.0-trynet.20251212", value: 1, color: "#FACC15" }, // yellow
  { name: "0.7.1", value: 1, color: "#9333EA" }, // teal
  { name: "1.0.0", value: 1, color: "#EF4444" }, // red
];

export function VersionDistributionChart({ data = defaultData }: VersionDistributionChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const percentage = ((entry.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3">
          <p className="text-sm font-semibold text-[#E5E7EB]">{entry.name}</p>
          <p className="text-sm text-[#9CA3AF]">
            {entry.value} nodes ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
      <div className="mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Version Distribution
        </h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Total: {total} nodes</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={115}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Color Guide (2 columns, names only) */}
      <div className="mt-6 grid grid-cols-3 gap-1">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1 text-sm">
            <div
              className="h-3 w-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#9CA3AF] text-xs truncate">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
