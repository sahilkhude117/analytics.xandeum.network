"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useDebounce } from "@/hooks/use-debounce";
import { createPodColumns } from "./pods-table-columns";
import { PodsTableFilters } from "./pods-table-filters";

type Status = "ONLINE" | "DEGRADED" | "OFFLINE" | "INVALID";
type Visibility = "PUBLIC" | "PRIVATE";

interface Pod {
  id: string;
  rank: number;
  pubkey: string;
  ip: string;
  port: number;
  status: Status;
  visibility: Visibility;
  version: string;
  storageUsed: number;
  storageCommitted: number;
  usagePercent: number;
  uptime: number;
  healthScore: number;
  lastSeen: Date;
  city?: string;
  country?: string;
}

interface PodsTableProps {
  data?: Pod[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onSortChange?: (columnId: string) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onFilterChange?: (filters: {
    status?: string[];
    version?: string[];
    country?: string[];
    search?: string;
  }) => void;
  onResetAll?: () => void;
  availableVersions?: string[];
  availableCountries?: string[];
}

export function PodsTable({
  data = [],
  isLoading = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onSortChange,
  sortBy: externalSortBy,
  sortDir: externalSortDir,
  onFilterChange,
  onResetAll: onResetAllFromParent,
  availableVersions = [],
  availableCountries = [],
}: PodsTableProps) {
  const [mounted, setMounted] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  
  // Track if we're fetching after initial load
  const isFetching = isLoadingMore;

  const { copyToClipboard, isCopied } = useCopyToClipboard();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Secondary filters
  const [versionFilter, setVersionFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);

  const columns = useMemo(
    () =>
      createPodColumns(
        isCopied,
        copyToClipboard,
        onSortChange,
        externalSortBy
      ),
    [isCopied, copyToClipboard, onSortChange, externalSortBy]
  );

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Global search
    if (debouncedGlobalFilter) {
      const search = debouncedGlobalFilter.toLowerCase();
      filtered = filtered.filter(
        (pod) =>
          pod.pubkey.toLowerCase().includes(search) ||
          pod.ip.toLowerCase().includes(search) ||
          pod.city?.toLowerCase().includes(search) ||
          pod.country?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((pod) => statusFilter.includes(pod.status));
    }

    // Visibility filter
    if (visibilityFilter.length > 0) {
      filtered = filtered.filter((pod) =>
        visibilityFilter.includes(pod.visibility)
      );
    }

    // Version filter
    if (versionFilter.length > 0) {
      filtered = filtered.filter((pod) => versionFilter.includes(pod.version));
    }

    // Country filter
    if (countryFilter.length > 0) {
      filtered = filtered.filter((pod) =>
        pod.country ? countryFilter.includes(pod.country) : false
      );
    }

    return filtered;
  }, [
    data,
    debouncedGlobalFilter,
    statusFilter,
    visibilityFilter,
    versionFilter,
    countryFilter,
  ]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Sorting removed - handled by API
  });

  const activeFilterCount =
    statusFilter.length +
    visibilityFilter.length +
    versionFilter.length +
    countryFilter.length +
    (globalFilter ? 1 : 0);

  const clearAllFilters = () => {
    setGlobalFilter("");
    setStatusFilter([]);
    setVisibilityFilter([]);
    setVersionFilter([]);
    setCountryFilter([]);
  };

  const handleResetAll = () => {
    clearAllFilters();
    // Call parent reset to handle sort state
    if (onResetAllFromParent) {
      onResetAllFromParent();
    }
  };

  const toggleStatusFilter = (status: Status) => {
    setStatusFilter((prev) =>
      prev.includes(status) && prev.length === 1
        ? [] // Remove if it's the only one selected
        : [status] // Replace with new selection
    );
  };

  const toggleVisibilityFilter = (visibility: Visibility) => {
    setVisibilityFilter((prev) =>
      prev.includes(visibility) && prev.length === 1
        ? [] // Remove if it's the only one selected
        : [visibility] // Replace with new selection
    );
  };

  const toggleVersionFilter = (version: string) => {
    setVersionFilter((prev) =>
      prev.includes(version) && prev.length === 1
        ? [] // Remove if it's the only one selected
        : [version] // Replace with new selection
    );
  };

  const toggleCountryFilter = (country: string) => {
    setCountryFilter((prev) =>
      prev.includes(country) && prev.length === 1
        ? [] // Remove if it's the only one selected
        : [country] // Replace with new selection
    );
  };

  // Use API-provided versions and countries, fallback to data-derived for initial render
  const uniqueVersions = useMemo(
    () => availableVersions.length > 0 ? availableVersions : Array.from(new Set(data.map((pod) => pod.version))),
    [availableVersions, data]
  );

  const uniqueCountries = useMemo(
    () => availableCountries.length > 0 ? availableCountries : Array.from(
      new Set(data.map((pod) => pod.country).filter(Boolean) as string[])
    ),
    [availableCountries, data]
  );

  // Trigger server-side filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter,
        version: versionFilter,
        country: countryFilter,
        search: debouncedGlobalFilter || undefined,
      });
    }
  }, [statusFilter, versionFilter, countryFilter, debouncedGlobalFilter, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <PodsTableFilters
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        statusFilter={statusFilter}
        onStatusFilterToggle={toggleStatusFilter}
        visibilityFilter={visibilityFilter}
        onVisibilityFilterToggle={toggleVisibilityFilter}
        versionFilter={versionFilter}
        onVersionFilterToggle={toggleVersionFilter}
        countryFilter={countryFilter}
        onCountryFilterToggle={toggleCountryFilter}
        uniqueVersions={uniqueVersions}
        uniqueCountries={uniqueCountries}
        showMoreFilters={showMoreFilters}
        onShowMoreFiltersToggle={() => setShowMoreFilters(!showMoreFilters)}
        activeFilterCount={activeFilterCount}
        onClearAllFilters={clearAllFilters}
        onResetAll={handleResetAll}
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#0b0b0b]">
        {!mounted ? (
          <div className="w-full p-8">
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded bg-white/5"
                />
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full" suppressHydrationWarning>
            <thead>
              <tr className="border-b border-white/5">
                {table.getFlatHeaders().map((header) => {
                  // Map backend field names back to column IDs for sort indicator
                  const fieldToColumnMap: Record<string, string> = {
                    rank: "rank",
                    country: "country",
                    storageCommitted: "storage",
                    healthScore: "healthScore",
                  };
                  const backendField = externalSortBy || "";
                  const activeColumnId = fieldToColumnMap[backendField] || backendField;
                  const isSorted = activeColumnId === header.id;
                  const isSortable = header.column.columnDef.enableSorting !== false;
                  
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#6B7280]"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            isSortable && onSortChange
                              ? "flex cursor-pointer select-none items-center gap-2 hover:text-[#E5E7EB]"
                              : "flex items-center gap-2"
                          }
                          onClick={() => {
                            if (isSortable && onSortChange) {
                              onSortChange(header.id);
                            }
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {isSortable && onSortChange && (
                            <span className="text-[#6B7280]">
                              {isSorted ? (
                                externalSortDir === "asc" ? (
                                  <ChevronUp className="h-4 w-4 text-[#1E40AF]" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-[#1E40AF]" />
                                )
                              ) : (
                                <ChevronUp className="h-4 w-4 opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading || (isFetching && table.getRowModel().rows.length === 0) ? (
                // Show skeleton rows when loading
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={11} className="px-4 py-4">
                      <div className="h-8 w-full animate-pulse rounded bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-[#9CA3AF]">
                        No pods found matching your filters
                      </p>
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-[#1E40AF] hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
                    onClick={() => {
                      window.location.href = `/pods/${row.original.pubkey}`;
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore || isLoading}
            variant="outline"
            className="border-white/10 bg-[#0b0b0b] text-[#E5E7EB] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore || isLoading ? "Loading more..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
