import { useState, useMemo } from "react";

export type TimeRange = "24h" | "7d" | "30d";

export interface ChartDataPoint {
  time: string;
  [key: string]: string | number;
}

export interface ChartDataSets {
  [key: string]: ChartDataPoint[];
}

export function useChartData<T extends ChartDataSets>(
  dataSets: T,
  defaultTimeRange: keyof T = "7d"
) {
  const [timeRange, setTimeRange] = useState<keyof T>(defaultTimeRange);

  const currentData = useMemo(() => {
    return dataSets[timeRange] || [];
  }, [dataSets, timeRange]);

  const timeRangeOptions = useMemo(() => {
    return Object.keys(dataSets) as (keyof T)[];
  }, [dataSets]);

  return {
    currentData,
    timeRange,
    setTimeRange,
    timeRangeOptions,
  };
}