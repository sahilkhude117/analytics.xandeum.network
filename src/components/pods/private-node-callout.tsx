import { Info } from "lucide-react";

export function PrivateNodeCallout() {
  return (
    <div className="rounded-lg border border-[#60A5FA]/20 bg-[#1E40AF]/10 p-6">
      <div className="flex gap-4">
        <Info className="h-5 w-5 flex-shrink-0 text-[#60A5FA]" />
        <div>
          <h3 className="mb-2 font-semibold text-[#E5E7EB]">
            Limited Metrics for Private Nodes
          </h3>
          <p className="text-sm leading-relaxed text-[#9CA3AF]">
            Detailed runtime metrics such as CPU, RAM, and network activity
            are not available for private nodes. Core health, uptime, and
            storage metrics are still monitored to ensure reliable network
            participation.
          </p>
        </div>
      </div>
    </div>
  );
}
