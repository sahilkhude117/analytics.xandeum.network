'use client';

import { formatNumber } from '@/lib/formatters';

interface NetworkData {
  totalPods: number;
  onlinePods: number;
  degradedPods: number;
  offlinePods: number;
}

interface TotalPodsProps {
  data?: NetworkData | null;
  isLoading?: boolean;
}

interface NetworkStatsProps {
  data?: NetworkData | null;
  isLoading?: boolean;
}

export function TotalPods({ data, isLoading }: TotalPodsProps) {
  const totalPods = data?.totalPods || 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-[#9CA3AF]">
          Total Pods
        </h2>
        <div className="text-4xl md:text-5xl tracking-normal font-mono tabular-nums text-[#E5E7EB]">
          ---
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-[#9CA3AF]">
        Total Pods
      </h2>
      <div className="text-4xl md:text-5xl tracking-normal font-mono tabular-nums text-[#E5E7EB]">
        {formatNumber(totalPods)}
      </div>
    </div>
  );
}

export function NetworkStats({ data, isLoading }: NetworkStatsProps) {
  const onlineCount = data?.onlinePods || 0;
  const offlineCount = data?.offlinePods || 0;
  const degradedCount = data?.degradedPods || 0;
  const invalidCount = data ? data.totalPods - (data.onlinePods + data.degradedPods + data.offlinePods) : 0;

  const statusData = [
    { label: 'Online', count: onlineCount, color: '#22C55E' },
    { label: 'Degraded', count: degradedCount, color: '#FACC15' },
    { label: 'Offline', count: offlineCount, color: '#EF4444' },
    { label: 'Invalid', count: invalidCount, color: '#8B5CF6' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-[#9CA3AF]">
          Status Distribution
        </h2>
        <ul className="list-none pl-0 space-y-1">
          {statusData.map((status) => (
            <li key={status.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                  aria-hidden="true"
                />
                <span className="text-sm" style={{ color: status.color }}>
                  {status.label}
                </span>
              </div>
              <span className="text-sm text-[#E5E7EB] font-mono tabular-nums">
                ---
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-[#9CA3AF]">
        Status Distribution
      </h2>
      <ul className="list-none pl-0 space-y-1">
        {statusData.map((status) => (
          <li key={status.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: status.color }}
                aria-hidden="true"
              />
              <span className="text-sm" style={{ color: status.color }}>
                {status.label}
              </span>
            </div>
            <span className="text-sm text-[#E5E7EB] font-mono tabular-nums">
              {status.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
