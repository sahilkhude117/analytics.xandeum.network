"use client";

import { PodsTable } from "@/components/tables/pods-table";
import { useMemo, useState, useCallback, useEffect } from "react";
import { apiClient, SortField, SortDirection } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { PNodeListItem } from "@/lib/types";

export default function PodsPage() {
  const [page, setPage] = useState(1);
  const [allPods, setAllPods] = useState<PNodeListItem[]>([]);
  const pageSize = 50;

  const [sortBy, setSortBy] = useState<SortField>("healthScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [versionFilter, setVersionFilter] = useState<string | undefined>();
  const [countryFilter, setCountryFilter] = useState<string | undefined>();
  const [searchFilter, setSearchFilter] = useState<string | undefined>();

  useEffect(() => {
    setPage(1);
    setAllPods([]);
  }, [sortBy, sortDir, statusFilter, versionFilter, countryFilter, searchFilter]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["pods-list", page, sortBy, sortDir, statusFilter, versionFilter, countryFilter, searchFilter],
    queryFn: () =>
      apiClient.getPnodesList({
        page,
        pageSize,
        sortBy,
        sortDir,
        status: statusFilter,
        version: versionFilter,
        country: countryFilter,
        search: searchFilter,
      }),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      setAllPods((prev) => {
        const existingIds = new Set(prev.map((p) => p.pubkey));
        const newItems = data.items.filter((item) => !existingIds.has(item.pubkey));
        return [...prev, ...newItems];
      });
    }
  }, [data]);

  const pods = useMemo(() => {
    return allPods.map((item, index) => ({
      id: item.pubkey || `unknown-${index}`,
      rank: index + 1,
      pubkey: item.pubkey || "Unknown",
      ip: item.ipAddress.split(":")[0] || item.ipAddress,
      port: parseInt(item.ipAddress.split(":")[1]) || 9001,
      status: item.status as "ONLINE" | "DEGRADED" | "OFFLINE" | "INVALID",
      visibility: item.isPublic ? "PUBLIC" as const : "PRIVATE" as const,
      version: item.version,
      storageUsed: parseFloat(item.storageUsed) / (1024 * 1024 * 1024),
      storageCommitted: parseFloat(item.storageCommitted) / (1024 * 1024 * 1024),
      usagePercent: item.storageUsagePercent,
      uptime: item.uptime,
      healthScore: item.healthScore,
      lastSeen: new Date(item.lastSeenAt),
      city: item.city || undefined,
      country: item.country || undefined,
    }));
  }, [allPods]);

  const handleLoadMore = useCallback(() => {
    if (data && page < data.pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [data, page]);

  const handleSortChange = useCallback((columnId: string) => {
    const columnToFieldMap: Record<string, SortField> = {
      rank: "rank" as SortField,
      country: "country" as SortField,
      storage: "storageCommitted" as SortField,
      storageCommitted: "storageCommitted" as SortField,
      storageUsed: "storageUsed" as SortField,
      storageUsagePercent: "storageUsagePercent" as SortField,
      healthScore: "healthScore" as SortField,
    };
    
    const newSortBy = columnToFieldMap[columnId] || (columnId as SortField);
    if (sortBy === newSortBy) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(newSortBy);
      setSortDir("desc");
    }
  }, [sortBy]);

  const handleFilterChange = useCallback((filters: {
    status?: string[];
    version?: string[];
    country?: string[];
    search?: string;
  }) => {
    setStatusFilter(filters.status && filters.status.length > 0 ? filters.status[0] : undefined);
    setVersionFilter(filters.version && filters.version.length > 0 ? filters.version[0] : undefined);
    setCountryFilter(filters.country && filters.country.length > 0 ? filters.country[0] : undefined);
    setSearchFilter(filters.search && filters.search.trim() !== "" ? filters.search : undefined);
  }, []);

  const handleResetAll = useCallback(() => {
    setSortBy("healthScore");
    setSortDir("desc");
    setStatusFilter(undefined);
    setVersionFilter(undefined);
    setCountryFilter(undefined);
    setSearchFilter(undefined);
  }, []);

  const hasMore = data ? page < data.pagination.totalPages : false;

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">All pNodes</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          {isLoading && page === 1
            ? "Loading pNodes..."
            : `${pods.length}${hasMore ? '+' : ''} of ${data?.pagination.total || 0} pNodes`}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <p className="font-medium">Failed to load pods</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Table */}
      <PodsTable
        data={pods}
        isLoading={isLoading && page === 1}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isFetching}
        onSortChange={handleSortChange}
        sortBy={sortBy}
        sortDir={sortDir}
        onFilterChange={handleFilterChange}
        onResetAll={handleResetAll}
        availableVersions={data?.filters?.availableVersions}
        availableCountries={data?.filters?.availableCountries}
      />
    </main>
  );
}

