import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function getTimeRangeMinutes(timeRange: string): number {
  const ranges: Record<string, number> = {
    "1h": 60,
    "6h": 360,
    "24h": 1440,
    "7d": 10080,
    "30d": 43200,
  };
  return ranges[timeRange] || 1440;
}

export function calculateExpectedPoints(timeRange: string): number {
  const ranges: Record<string, number> = {
    "1h": 1,
    "6h": 6,
    "24h": 24,
    "7d": 168,
    "30d": 720,
  };
  return ranges[timeRange] || 24;
}

export function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}