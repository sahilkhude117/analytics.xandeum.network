import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Status = "ONLINE" | "DEGRADED" | "OFFLINE" | "INVALID";
type Visibility = "PUBLIC" | "PRIVATE";

interface PodsTableFiltersProps {
  // Search
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;

  // Primary filters
  statusFilter: Status[];
  onStatusFilterToggle: (status: Status) => void;
  visibilityFilter: Visibility[];
  onVisibilityFilterToggle: (visibility: Visibility) => void;

  // Secondary filters
  versionFilter: string[];
  onVersionFilterToggle: (version: string) => void;
  countryFilter: string[];
  onCountryFilterToggle: (country: string) => void;

  // Available options
  uniqueVersions: string[];
  uniqueCountries: string[];

  // Filter state
  showMoreFilters: boolean;
  onShowMoreFiltersToggle: () => void;
  activeFilterCount: number;
  onClearAllFilters: () => void;
  onResetAll: () => void;
}

export function PodsTableFilters({
  globalFilter,
  onGlobalFilterChange,
  statusFilter,
  onStatusFilterToggle,
  visibilityFilter,
  onVisibilityFilterToggle,
  versionFilter,
  onVersionFilterToggle,
  countryFilter,
  onCountryFilterToggle,
  uniqueVersions,
  uniqueCountries,
  showMoreFilters,
  onShowMoreFiltersToggle,
  activeFilterCount,
  onClearAllFilters,
  onResetAll,
}: PodsTableFiltersProps) {
  return (
    <div className="sticky top-20 z-10 rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by pubkey, IP, or location"
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
        />

        {/* Primary Filters */}
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
              {statusFilter.length > 0 ? statusFilter[0] : "Status"}
              <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#0A0A0A]">
              {(["ONLINE", "DEGRADED", "OFFLINE", "INVALID"] as Status[]).map(
                (status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onStatusFilterToggle(status)}
                    className={`cursor-pointer text-sm ${
                      statusFilter.includes(status)
                        ? "bg-[#1E40AF] text-white"
                        : "text-[#E5E7EB] hover:bg-white/5"
                    }`}
                  >
                    {status}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Visibility Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
              {visibilityFilter.length > 0 ? visibilityFilter[0] : "Visibility"}
              <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-white/10 bg-[#0A0A0A]">
              {(["PUBLIC", "PRIVATE"] as Visibility[]).map((visibility) => (
                <DropdownMenuItem
                  key={visibility}
                  onClick={() => onVisibilityFilterToggle(visibility)}
                  className={`cursor-pointer text-sm ${
                    visibilityFilter.includes(visibility)
                      ? "bg-[#1E40AF] text-white"
                      : "text-[#E5E7EB] hover:bg-white/5"
                  }`}
                >
                  {visibility}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active Filter Count & Clear */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#9CA3AF]">
                Filters ({activeFilterCount})
              </span>
              <button
                onClick={onClearAllFilters}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#E5E7EB]"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={onResetAll}
            className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5"
          >
            <X className="h-4 w-4" />
            Reset All
          </button>

          {/* More Filters Button */}
          <button
            onClick={onShowMoreFiltersToggle}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5"
          >
            <Filter className="h-4 w-4" />
            More filters
            {showMoreFilters ? (
              <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
            )}
          </button>
        </div>

        {/* Secondary Filters */}
        {showMoreFilters && (
          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Version Filter */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Version
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-left text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
                    {versionFilter.length > 0
                      ? versionFilter[0]
                      : "All versions"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border-white/10 bg-[#0A0A0A]">
                    {uniqueVersions.map((version) => (
                      <DropdownMenuItem
                        key={version}
                        onClick={() => onVersionFilterToggle(version)}
                        className={`cursor-pointer text-sm ${
                          versionFilter.includes(version)
                            ? "bg-[#1E40AF] text-white"
                            : "text-[#E5E7EB] hover:bg-white/5"
                        }`}
                      >
                        {version}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Country Filter */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                  Country
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-left text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
                    {countryFilter.length > 0
                      ? countryFilter[0]
                      : "All countries"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border-white/10 bg-[#0A0A0A]">
                    {uniqueCountries.map((country) => (
                      <DropdownMenuItem
                        key={country}
                        onClick={() => onCountryFilterToggle(country)}
                        className={`cursor-pointer text-sm ${
                          countryFilter.includes(country)
                            ? "bg-[#1E40AF] text-white"
                            : "text-[#E5E7EB] hover:bg-white/5"
                        }`}
                      >
                        {country}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
