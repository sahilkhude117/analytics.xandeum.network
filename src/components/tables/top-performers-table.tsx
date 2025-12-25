"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, Copy, Check, HelpCircle } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useTopPerformers, type PerformanceSortOption, type TopPerformersParams } from "@/hooks/use-top-performers";
import { formatStorageValue } from "@/lib/formatters";
import TableSkeleton from "@/components/skeletons/table-skeleton";
import { useRouter } from "next/navigation";
import type { PNodeListItem } from "@/lib/types";

interface TopPerformersTableProps {
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<PNodeListItem>();

const createColumns = (
  isCopied: (rowId: string, field: string) => boolean,
  copyToClipboard: (text: string, rowId: string, field: string) => void
) => [
  columnHelper.accessor("pubkey", {
    header: "Pubkey",
    cell: (info) => {
      const rowId = info.row.id;
      const value = info.getValue();
      const copied = isCopied(rowId, "pubkey");
      
      if (!value) return <span className="text-sm text-[#9CA3AF]">N/A</span>;
      
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-md text-[#E5E7EB]">
            {value.slice(0, 8)}...{value.slice(-8)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(value, rowId, "pubkey");
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy pubkey"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-white" />
            )}
          </button>
        </div>
      );
    },
  }),
  columnHelper.accessor("ipAddress", {
    header: "Address",
    cell: (info) => {
      const rowId = info.row.id;
      const value = info.getValue();
      const copied = isCopied(rowId, "ip");
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-md text-[#9CA3AF]">
            {value}:9001
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(value, rowId, "ip");
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy IP address"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-white" />
            )}
          </button>
        </div>
      );
    },
  }),
  columnHelper.accessor("storageCommitted", {
    header: "Committed",
    cell: (info) => (
      <span className="text-base text-[#E5E7EB]">
        {formatStorageValue(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("storageUsed", {
    header: "Used",
    cell: (info) => (
      <span className="text-base text-[#E5E7EB]">
        {formatStorageValue(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("storageUsagePercent", {
    header: "Usage %",
    cell: (info) => {
      const value = info.getValue();
      const color =
        value >= 80 ? "#EF4444" : value >= 60 ? "#FACC15" : "#22C55E";
      return (
        <span className="text-base font-semibold" style={{ color }}>
          {value.toFixed(1)}%
        </span>
      );
    },
  }),
  columnHelper.accessor("uptime", {
    header: "Uptime",
    cell: (info) => {
      const uptimeSeconds = info.getValue();
      const uptimeDays = uptimeSeconds / (24 * 60 * 60);
      
      if (uptimeDays < 1) {
        const hours = Math.floor(uptimeSeconds / 3600);
        return <span className="text-base text-[#E5E7EB]">{hours}h</span>;
      }
      
      return (
        <span className="text-base text-[#E5E7EB]">
          {uptimeDays.toFixed(1)}d
        </span>
      );
    },
  }),
  columnHelper.accessor("healthScore", {
    header: () => (
      <div className="flex items-center gap-1.5 group/tooltip relative">
        <span>Health Score</span>
        <HelpCircle className="h-3.5 w-3.5 text-[#9CA3AF]" />
        <div className="invisible group-hover/tooltip:visible absolute left-0 top-full mt-2 w-80 rounded-lg border border-white/10 bg-[#1a1a1a] p-4 text-xs font-normal normal-case tracking-normal shadow-lg z-50">
          <div className="space-y-2">
            <p className="text-[#E5E7EB] font-semibold">Health Score Calculation (Max: 100)</p>
            <ul className="space-y-1 text-[#9CA3AF]">
              <li>• <span className="text-[#E5E7EB]">Online Status (40pts)</span> - Node seen in last 5 minutes</li>
              <li>• <span className="text-[#E5E7EB]">Last Seen (20pts)</span> - Recent activity (&lt;1min = 20pts)</li>
              <li>• <span className="text-[#E5E7EB]">Storage Health (15pts)</span> - Optimal: 0-70% usage</li>
              <li>• <span className="text-[#E5E7EB]">CPU Health (10pts)</span> - Lower CPU is better (optional)</li>
              <li>• <span className="text-[#E5E7EB]">Uptime (15pts)</span> - Longer uptime = more stable</li>
            </ul>
            <div className="pt-2 border-t border-white/10 text-[#9CA3AF]">
              <p><span className="text-green-400">90+:</span> Excellent | <span className="text-yellow-400">70-89:</span> Good | <span className="text-red-400">&lt;70:</span> Fair/Poor</p>
            </div>
          </div>
        </div>
      </div>
    ),
    cell: (info) => {
      const value = info.getValue();
      const color =
        value >= 90 ? "#22C55E" : value >= 70 ? "#FACC15" : "#EF4444";
      return (
        <span className="text-base font-semibold" style={{ color }}>
          {value}
        </span>
      );
    },
  }),
  columnHelper.accessor("version", {
    header: "Version",
    cell: (info) => (
      <span className="text-sm text-[#9CA3AF]">{info.getValue()}</span>
    ),
  }),
];

const sortOptions: Record<PerformanceSortOption, string> = {
  reliability: "Reliability",
  storage: "Storage Used",
  uptime: "Uptime",
  storageCommitted: "Storage Committed",
};

export function TopPerformersTable({ isLoading: parentLoading = false }: TopPerformersTableProps) {
  const [sortBy, setSortBy] = useState<PerformanceSortOption>("reliability");
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const router = useRouter();
  
  const { data, isLoading: queryLoading } = useTopPerformers({ sortBy });
  const isLoading = parentLoading || queryLoading;

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => createColumns(isCopied, copyToClipboard),
    [isCopied, copyToClipboard]
  );

  const tableData = useMemo(() => data?.items || [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (row: PNodeListItem) => {
    if (row.pubkey) {
      router.push(`/pods/${row.pubkey}`);
    }
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#E5E7EB]">
                Top Performers
              </h2>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Top 10 pods by {sortOptions[sortBy].toLowerCase()}
              </p>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as PerformanceSortOption)}
                className="appearance-none rounded-lg border border-white/10 bg-[#0b0b0b] px-4 py-2 pr-10 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] focus:border-[#1E40AF] focus:outline-none"
              >
                {Object.entries(sortOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {table.getFlatHeaders().map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original)}
                    className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
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
                ))}
              </tbody>
            </table>
          </div>

          {tableData.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[#9CA3AF]">No pNodes found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
