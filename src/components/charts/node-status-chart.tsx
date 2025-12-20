"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface NodeStatusChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { name: "Online", value: 190, color: "#008000" }, // Dark green
  { name: "Degraded", value: 24, color: "#FACC15" }, // Yellow
  { name: "Offline", value: 8, color: "#EF4444" }, // Red
  { name: "Invalid", value: 4, color: "#9333EA" }, // Purple
];

export function NodeStatusChart({ data = defaultData }: NodeStatusChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3">
          <p className="text-sm font-semibold text-[#E5E7EB]">{data.name}</p>
          <p className="text-sm text-[#9CA3AF]">
            {data.value} nodes ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="mt-4 space-y-2">
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.payload.value / total) * 100).toFixed(1);
          return (
            <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[#9CA3AF]">{entry.value}</span>
              </div>
              <span className="font-semibold text-[#E5E7EB]">
                {entry.payload.value} <span className="text-[#6B7280]">({percentage}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      <div className="mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Node Status Distribution
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
      
      {/* Color Guide */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#008000]" />
          <span className="text-[#9CA3AF]">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#FACC15]" />
          <span className="text-[#9CA3AF]">Degraded</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#EF4444]" />
          <span className="text-[#9CA3AF]">Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#9333EA]" />
          <span className="text-[#9CA3AF]">Invalid</span>
        </div>
      </div>
    </div>
  );
}
