import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function KpiCard({ title, value, subtitle, trend, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/5 bg-[#0b0b0b] p-4",
        className
      )}
    >
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {title}
      </div>
      <div className="text-3xl font-bold text-[#E5E7EB]">{value}</div>
      {subtitle && (
        <div className="mt-1 text-sm text-[#9CA3AF]">{subtitle}</div>
      )}
      {trend && (
        <div
          className={cn(
            "mt-2 text-xs font-semibold",
            trend.isPositive ? "text-[#22c55e]" : "text-[#ef4444]"
          )}
        >
          {trend.isPositive ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  );
}
