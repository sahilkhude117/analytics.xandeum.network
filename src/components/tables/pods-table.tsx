"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Copy, Check, ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_COLORS } from '@/lib/constants/colors';
import { formatUptime, formatRelativeTime, getHealthColor } from '@/lib/formatters';
import TableSkeleton from '@/components/skeletons/table-skeleton';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useDebounce } from '@/hooks/use-debounce';

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
  storageUsed: number; // GB
  storageCommitted: number; // GB
  usagePercent: number;
  uptime: number; // seconds
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
}

const columnHelper = createColumnHelper<Pod>();

// Status colors (centralized)
const statusColors = STATUS_COLORS;

// Health and formatting utilities imported from shared lib

const createColumns = (
  isCopied: (id: string, field: string) => boolean,
  copyToClipboard: (text: string, id: string, field: string) => void,
  storageSortMethod: 'committed' | 'used' | 'percent',
  setStorageSortMethod: (method: 'committed' | 'used' | 'percent') => void
) => [
  columnHelper.accessor("rank", {
    header: "#",
    enableSorting: false,
    cell: (info) => (
      <span className="text-sm text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: (info) => {
      const status = info.getValue();
      const colors = statusColors[status];
      return (
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colors.dot }}
          />
          <span className="text-sm capitalize" style={{ color: colors.text }}>
            {status.toLowerCase()}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("pubkey", {
    header: "Pod ID",
    enableSorting: false,
    cell: (info) => {
      const pubkey = info.getValue();
      const id = info.row.original.id;
      const copied = isCopied(id, "pubkey");
      return (
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-md text-[#E5E7EB]"
            title={pubkey}
          >
            {pubkey.slice(0, 4)}...{pubkey.slice(-4)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(pubkey, id, "pubkey");
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy pubkey"
          >
            {copied ? (
              <Check className="h-3 w-3 text-[#22C55E]" />
            ) : (
              <Copy className="h-3 w-3 text-[#9CA3AF] hover:text-[#1E40AF]" />
            )}
          </button>
        </div>
      );
    },
  }),
  columnHelper.accessor("ip", {
    header: "Address",
    enableSorting: false,
    cell: (info) => {
      const ip = info.getValue();
      const port = info.row.original.port;
      const id = info.row.original.id;
      const copied = isCopied(id, "ip");
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-md text-[#9CA3AF]">
            {ip}:{port}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(ip, id, "ip");
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy IP address"
          >
            {copied ? (
              <Check className="h-3 w-3 text-[#22C55E]" />
            ) : (
              <Copy className="h-3 w-3 text-[#9CA3AF] hover:text-[#1E40AF]" />
            )}
          </button>
        </div>
      );
    },
  }),
  columnHelper.accessor("visibility", {
    header: "Visibility",
    enableSorting: false,
    cell: (info) => {
      const visibility = info.getValue();
      return (
        <span
          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
            visibility === "PUBLIC"
              ? "bg-[#1E40AF]/20 text-[#60A5FA]"
              : "bg-white/5 text-[#9CA3AF]"
          }`}
        >
          {visibility}
        </span>
      );
    },
  }),
  columnHelper.accessor("version", {
    header: "Version",
    enableSorting: false,
    cell: (info) => (
      <span className="text-sm text-[#E5E7EB]">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("country", {
    header: "Location",
    cell: (info) => {
      const country = info.getValue();
      const city = info.row.original.city;
      return (
        <div className="flex flex-col">
          <span className="text-sm text-[#E5E7EB]">{country || "N/A"}</span>
          <span className="text-xs text-[#6B7280]">{city || "N/A"}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor(
    (row) => {
      if (storageSortMethod === 'committed') return row.storageCommitted;
      if (storageSortMethod === 'used') return row.storageUsed;
      return (row.storageUsed / row.storageCommitted) * 100;
    },
    {
      id: "storage",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Storage</span>
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors hover:bg-white/10 focus:outline-none focus:ring-0"
            >
              <span className="text-[#9CA3AF]">
                ({storageSortMethod === 'committed' ? 'Total' : storageSortMethod === 'used' ? 'Used' : '%'})
              </span>
              <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="border-white/10 bg-[#0A0A0A]"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setStorageSortMethod('committed');
                }}
                className={`cursor-pointer text-sm ${
                  storageSortMethod === 'committed'
                    ? "bg-[#1E40AF] text-white"
                    : "text-[#E5E7EB] hover:bg-white/5"
                }`}
              >
                Sort by Total
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setStorageSortMethod('used');
                }}
                className={`cursor-pointer text-sm ${
                  storageSortMethod === 'used'
                    ? "bg-[#1E40AF] text-white"
                    : "text-[#E5E7EB] hover:bg-white/5"
                }`}
              >
                Sort by Used
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setStorageSortMethod('percent');
                }}
                className={`cursor-pointer text-sm ${
                  storageSortMethod === 'percent'
                    ? "bg-[#1E40AF] text-white"
                    : "text-[#E5E7EB] hover:bg-white/5"
                }`}
              >
                Sort by Usage %
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      cell: (info) => {
        const committed = info.row.original.storageCommitted;
        const used = info.row.original.storageUsed;
        const percent = (used / committed) * 100;
        return (
          <div className="min-w-[160px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#E5E7EB]">
                {used.toFixed(0)} GB / {committed.toFixed(0)} GB
              </span>
              <span className="text-[#9CA3AF]">{percent.toFixed(0)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-[#1E40AF]"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    }
  ),
  columnHelper.accessor("uptime", {
    header: "Uptime",
    cell: (info) => {
      const seconds = info.getValue();
      return (
        <span className="text-sm text-[#E5E7EB]" title={`${seconds}s`}>
          {formatUptime(seconds)}
        </span>
      );
    },
  }),
  columnHelper.accessor("healthScore", {
    header: "Health",
    cell: (info) => {
      const score = info.getValue();
      const color = getHealthColor(score);
      return (
        <span className="text-sm font-semibold" style={{ color }}>
          {score}
        </span>
      );
    },
  }),
  columnHelper.accessor("lastSeen", {
    header: "Last Seen",
    cell: (info) => {
      const date = info.getValue();
      return (
        <span
          className="text-sm text-[#9CA3AF]"
          title={date.toISOString()}
        >
          {formatRelativeTime(date)}
        </span>
      );
    },
  }),
];

export function PodsTable({
  data = [],
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: PodsTableProps) {
  const [mounted, setMounted] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "healthScore", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);
  
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
  const [healthScoreRange, setHealthScoreRange] = useState<[number, number]>([0, 100]);
  const [storageUsageRange, setStorageUsageRange] = useState<[number, number]>([0, 100]);
  const [storageSortMethod, setStorageSortMethod] = useState<'committed' | 'used' | 'percent'>('committed');

  const columns = useMemo(
    () =>
      createColumns(
        isCopied,
        copyToClipboard,
        storageSortMethod,
        setStorageSortMethod
      ),
    [isCopied, copyToClipboard, storageSortMethod]
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

    // Health score range filter
    if (healthScoreRange[0] > 0 || healthScoreRange[1] < 100) {
      filtered = filtered.filter(
        (pod) =>
          pod.healthScore >= healthScoreRange[0] &&
          pod.healthScore <= healthScoreRange[1]
      );
    }

    // Storage usage % range filter
    if (storageUsageRange[0] > 0 || storageUsageRange[1] < 100) {
      filtered = filtered.filter(
        (pod) => {
          const percent = (pod.storageUsed / pod.storageCommitted) * 100;
          return percent >= storageUsageRange[0] && percent <= storageUsageRange[1];
        }
      );
    }

    return filtered;
  }, [data, debouncedGlobalFilter, statusFilter, visibilityFilter, versionFilter, countryFilter, healthScoreRange, storageUsageRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const activeFilterCount =
    statusFilter.length + 
    visibilityFilter.length + 
    versionFilter.length + 
    countryFilter.length + 
    (globalFilter ? 1 : 0) +
    (healthScoreRange[0] > 0 || healthScoreRange[1] < 100 ? 1 : 0) +
    (storageUsageRange[0] > 0 || storageUsageRange[1] < 100 ? 1 : 0);

  const clearAllFilters = () => {
    setGlobalFilter("");
    setStatusFilter([]);
    setVisibilityFilter([]);
    setVersionFilter([]);
    setCountryFilter([]);
    setHealthScoreRange([0, 100]);
    setStorageUsageRange([0, 100]);
  };

  const toggleStatusFilter = (status: Status) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleVisibilityFilter = (visibility: Visibility) => {
    setVisibilityFilter((prev) =>
      prev.includes(visibility)
        ? prev.filter((v) => v !== visibility)
        : [...prev, visibility]
    );
  };

  const toggleVersionFilter = (version: string) => {
    setVersionFilter((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version]
    );
  };

  const toggleCountryFilter = (country: string) => {
    setCountryFilter((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  // Get unique versions and countries from data
  const uniqueVersions = useMemo(
    () => Array.from(new Set(data.map((pod) => pod.version))),
    [data]
  );

  const uniqueCountries = useMemo(
    () => Array.from(new Set(data.map((pod) => pod.country).filter(Boolean))),
    [data]
  );

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="sticky top-20 z-10 rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by pubkey, IP, or location"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
          />

          {/* Primary Filters */}
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
                Status
                {statusFilter.length > 0 && (
                  <span className="rounded-full bg-[#1E40AF] px-2 py-0.5 text-xs">
                    {statusFilter.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-white/10 bg-[#0A0A0A]">
                {(["ONLINE", "DEGRADED", "OFFLINE", "INVALID"] as Status[]).map(
                  (status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
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
                Visibility
                {visibilityFilter.length > 0 && (
                  <span className="rounded-full bg-[#1E40AF] px-2 py-0.5 text-xs">
                    {visibilityFilter.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-white/10 bg-[#0A0A0A]">
                {(["PUBLIC", "PRIVATE"] as Visibility[]).map((visibility) => (
                  <DropdownMenuItem
                    key={visibility}
                    onClick={() => toggleVisibilityFilter(visibility)}
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
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#E5E7EB]"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => {
                clearAllFilters();
                setSorting([]);
                setStorageSortMethod('committed');
              }}
              className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5"
            >
              <X className="h-4 w-4" />
              Reset All
            </button>

            {/* More Filters Button */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Version Filter */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Version
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
                      <span>
                        {versionFilter.length > 0
                          ? `${versionFilter.length} selected`
                          : "All versions"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 border-white/10 bg-[#0A0A0A]">
                      {uniqueVersions.map((version) => (
                        <DropdownMenuItem
                          key={version}
                          onClick={() => toggleVersionFilter(version)}
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
                    <DropdownMenuTrigger className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
                      <span>
                        {countryFilter.length > 0
                          ? `${countryFilter.length} selected`
                          : "All countries"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 border-white/10 bg-[#0A0A0A] max-h-64 overflow-y-auto">
                      {uniqueCountries.map((country) => (
                        <DropdownMenuItem
                          key={country}
                          onClick={() => toggleCountryFilter(country!)}
                          className={`cursor-pointer text-sm ${
                            countryFilter.includes(country!)
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

                {/* Health Score Range */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Health Score
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={healthScoreRange[0]}
                      onChange={(e) =>
                        setHealthScoreRange([
                          parseInt(e.target.value) || 0,
                          healthScoreRange[1],
                        ])
                      }
                      className="w-20 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      placeholder="Min"
                    />
                    <span className="text-[#6B7280]">-</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={healthScoreRange[1]}
                      onChange={(e) =>
                        setHealthScoreRange([
                          healthScoreRange[0],
                          parseInt(e.target.value) || 100,
                        ])
                      }
                      className="w-20 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Storage Usage % Range */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Storage Usage %
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={storageUsageRange[0]}
                      onChange={(e) =>
                        setStorageUsageRange([
                          parseInt(e.target.value) || 0,
                          storageUsageRange[1],
                        ])
                      }
                      className="w-20 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      placeholder="Min"
                    />
                    <span className="text-[#6B7280]">-</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={storageUsageRange[1]}
                      onChange={(e) =>
                        setStorageUsageRange([
                          storageUsageRange[0],
                          parseInt(e.target.value) || 100,
                        ])
                      }
                      className="w-20 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-[#E5E7EB] focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#0b0b0b]">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={10} />
          </div>
        ) : !mounted ? (
          <div className="w-full p-8">
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <table className="w-full" suppressHydrationWarning>
            <thead>
              <tr className="border-b border-white/5">
                {table.getFlatHeaders().map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#6B7280]"
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        header.column.getCanSort() ? "cursor-pointer select-none" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <div className="flex flex-col">
                          {header.column.getIsSorted() === "asc" && (
                            <ChevronUp className="h-3 w-3 text-[#1E40AF]" />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ChevronDown className="h-3 w-3 text-[#1E40AF]" />
                          )}
                          {!header.column.getIsSorted() && (
                            <ChevronDown className="h-3 w-3 text-[#6B7280]" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-white/5">
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={11} className="py-12 text-center">
                  <p className="text-[#9CA3AF]">No pods match your filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-2 text-sm text-[#1E40AF] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
                  onClick={() => {
                    // Navigate to pod detail page
                    window.location.href = `/pods/${row.original.pubkey}`;
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      {hasMore && !isLoading && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onLoadMore}
            variant="outline"
            className="border-white/10 bg-[#0b0b0b] text-[#E5E7EB] hover:bg-white/5"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
