import { PodDetails } from "@/lib/types";

interface OperationalMetadataProps {
  pod: PodDetails;
}

export function OperationalMetadata({ pod }: OperationalMetadataProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-[#E5E7EB]">
        Operational Metadata
      </h2>
      <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Last Seen
            </dt>
            <dd className="mt-1 text-md text-[#E5E7EB]">
              {pod.lastSeen.toLocaleString()}
            </dd>
          </div>
          {pod.city && pod.country && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Location
              </dt>
              <dd className="mt-1 text-md text-[#E5E7EB]">
                {pod.city}, {pod.country}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
