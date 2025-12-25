import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
  tooltip?: string; // Full precision value for hover
  valueColor?: string; // Custom color for the value
}

export function KpiCard({ title, value, subtitle, trend, className, tooltip, valueColor }: KpiCardProps) {
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
      <div className="flex items-center gap-2">
        <div 
          className="text-3xl font-bold text-[#E5E7EB]"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </div>
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-[#6B7280] hover:text-[#9CA3AF] cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs font-mono">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
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
