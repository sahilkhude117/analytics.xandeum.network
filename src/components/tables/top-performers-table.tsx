"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, Check } from "lucide-react";
import TableSkeleton from "../skeletons/table-skeleton";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type SortOption = "reliability" | "storage" | "uptime";

interface PodPerformance {
  pubkey: string;
  ip: string;
  committed: number; // TB
  used: number; // TB
  usedPercentage: number;
  uptime: number; // percentage
  healthScore: number;
  version: string;
}

interface TopPerformersTableProps {
  data?: PodPerformance[];
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<PodPerformance>();

const createColumns = (
  isCopied: (rowId: string, field: string) => boolean,
  copyToClipboard: (text: string, rowId: string, field: string) => void
) => [
  columnHelper.accessor("pubkey", {
    header: "Pubkey",
    cell: (info) => {
      const rowId = info.row.id;
      const copied = isCopied(rowId, "pubkey");
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-md text-[#E5E7EB]">
            {info.getValue().slice(0, 8)}...{info.getValue().slice(-6)}
          </span>
          <button
            onClick={() => copyToClipboard(info.getValue(), rowId, "pubkey")}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy pubkey"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#22C55E]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-[#1E40AF]" />
            )}
          </button>
        </div>
      );
    },
  }),
  columnHelper.accessor("ip", {
    header: "Address",
    cell: (info) => {
      const rowId = info.row.id;
      const copied = isCopied(rowId, "ip");
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-md text-[#9CA3AF]">
            {info.getValue()}:9001
          </span>
          <button
            onClick={() => copyToClipboard(info.getValue(), rowId, "ip")}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy IP address"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#22C55E]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-[#1E40AF]" />
            )}
          </button>
        </div>
      );
    },
  }),
  columnHelper.accessor("committed", {
    header: "Committed",
    cell: (info) => (
      <span className="text-base text-[#E5E7EB]">
        {info.getValue().toFixed(2)} TB
      </span>
    ),
  }),
  columnHelper.accessor("used", {
    header: "Used",
    cell: (info) => (
      <span className="text-base text-[#E5E7EB]">
        {info.getValue().toFixed(2)} TB
      </span>
    ),
  }),
  columnHelper.accessor("usedPercentage", {
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
    cell: (info) => (
      <span className="text-base text-[#E5E7EB]">{info.getValue().toFixed(1)}%</span>
    ),
  }),
  columnHelper.accessor("healthScore", {
    header: "Health Score",
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

// Mock data - 20 pods for sorting variations
const defaultData: PodPerformance[] = [
  {
    pubkey: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    ip: "203.0.113.45",
    committed: 1.2,
    used: 0.95,
    usedPercentage: 79.2,
    uptime: 99.8,
    healthScore: 98,
    version: "v0.7.2",
  },
  {
    pubkey: "9pQNW76Yh4aUExqKVmFLqV4CfVqfF1HNjWzv8oGXfJgC",
    ip: "198.51.100.23",
    committed: 2.4,
    used: 1.87,
    usedPercentage: 77.9,
    uptime: 99.5,
    healthScore: 97,
    version: "v0.7.2",
  },
  {
    pubkey: "3kMbZe5gKzRPxWrF7dNqY6JhPvTuCxQsL9aVmBnHfDpE",
    ip: "192.0.2.178",
    committed: 0.8,
    used: 0.58,
    usedPercentage: 72.5,
    uptime: 99.9,
    healthScore: 96,
    version: "v0.7.1",
  },
  {
    pubkey: "5nPqX8jKdLwRvYtH2sBmZ4FgNcQeUaJiVpMrDoGhTfWx",
    ip: "203.0.113.89",
    committed: 1.5,
    used: 1.12,
    usedPercentage: 74.7,
    uptime: 98.7,
    healthScore: 95,
    version: "v0.7.2",
  },
  {
    pubkey: "8rTyB4fGhXjKqWsL9mVnCdPzNuEaQoRxJiDpMcHgFtYv",
    ip: "198.51.100.67",
    committed: 3.0,
    used: 2.31,
    usedPercentage: 77.0,
    uptime: 99.2,
    healthScore: 94,
    version: "v0.7.2",
  },
  {
    pubkey: "2wQzA6kPjLvYxHmDrNsFbCgTuXeRoEnKpMiJqBhVtGcU",
    ip: "192.0.2.134",
    committed: 0.6,
    used: 0.41,
    usedPercentage: 68.3,
    uptime: 99.6,
    healthScore: 93,
    version: "v0.7.1",
  },
  {
    pubkey: "6sVxD3nKmPjQrYzL8tWbFaHgCuNeXoJpRiMqEvTdGfBw",
    ip: "203.0.113.156",
    committed: 1.8,
    used: 1.35,
    usedPercentage: 75.0,
    uptime: 98.4,
    healthScore: 92,
    version: "v0.7.2",
  },
  {
    pubkey: "4mUyF5pLnJwQsXzH9tRbCeKgDvPaNoGqRiMjTxBdYhWc",
    ip: "198.51.100.201",
    committed: 2.1,
    used: 1.61,
    usedPercentage: 76.7,
    uptime: 99.1,
    healthScore: 91,
    version: "v0.7.2",
  },
  {
    pubkey: "7pVzE6rNkMqTxYwL3sWbFdHgCuPeXnJoRiQjDvMaGfBy",
    ip: "192.0.2.89",
    committed: 1.0,
    used: 0.73,
    usedPercentage: 73.0,
    uptime: 98.9,
    healthScore: 90,
    version: "v0.7.1",
  },
  {
    pubkey: "9qXzG8tPmNrLyZwH4vWbFeKgDuQeYoJpSiRjEvNcHfCx",
    ip: "203.0.113.92",
    committed: 2.8,
    used: 2.15,
    usedPercentage: 76.8,
    uptime: 99.3,
    healthScore: 89,
    version: "v0.7.2",
  },
  {
    pubkey: "3nWyH6sQoKtMzYxL5vXbGfJhEuReZpKqTiSjFwOdIgDz",
    ip: "198.51.100.45",
    committed: 1.3,
    used: 0.97,
    usedPercentage: 74.6,
    uptime: 98.2,
    healthScore: 88,
    version: "v0.7.1",
  },
  {
    pubkey: "5oYzJ8uRpLvNaZyM6wYbHgKiEvSeApLrUjTkGxPeJhEa",
    ip: "192.0.2.167",
    committed: 1.9,
    used: 1.44,
    usedPercentage: 75.8,
    uptime: 99.0,
    healthScore: 87,
    version: "v0.7.2",
  },
  {
    pubkey: "8qZaK9vTrNwObAzN7xZbIhLjFvTfBqMsVkUlHyQfKiGb",
    ip: "203.0.113.234",
    committed: 0.9,
    used: 0.65,
    usedPercentage: 72.2,
    uptime: 98.5,
    healthScore: 86,
    version: "v0.7.1",
  },
  {
    pubkey: "2mAbL7wUsOxPcBaN8yAbJiMkGvUgCrNtWlVmIzRgLjHc",
    ip: "198.51.100.123",
    committed: 2.6,
    used: 1.98,
    usedPercentage: 76.2,
    uptime: 98.8,
    healthScore: 85,
    version: "v0.7.2",
  },
  {
    pubkey: "6pCdM9xVtPyQdCbO9zBcKjNlHvWhDsOuXmWnJaShMkId",
    ip: "192.0.2.78",
    committed: 1.1,
    used: 0.81,
    usedPercentage: 73.6,
    uptime: 97.9,
    healthScore: 84,
    version: "v0.7.1",
  },
  {
    pubkey: "4nDeN8yWuQzReDbP8aCdLkOmIwXiEtPvYnXoKbTiNlJe",
    ip: "203.0.113.56",
    committed: 2.2,
    used: 1.68,
    usedPercentage: 76.4,
    uptime: 98.6,
    healthScore: 83,
    version: "v0.7.2",
  },
  {
    pubkey: "7oEfO9zXvRaSeEcQ9bDeNmPlJyYjFuQwZoYpLcUjOmKf",
    ip: "198.51.100.189",
    committed: 1.6,
    used: 1.19,
    usedPercentage: 74.4,
    uptime: 99.4,
    healthScore: 82,
    version: "v0.7.1",
  },
  {
    pubkey: "3mFgP8aYwSbTfFdR8cEeMnQmKzZkGvRxApZqMdVkPnLg",
    ip: "192.0.2.145",
    committed: 2.5,
    used: 1.91,
    usedPercentage: 76.4,
    uptime: 98.1,
    healthScore: 81,
    version: "v0.7.2",
  },
  {
    pubkey: "5nHhQ9bZxTcUgGeS9dFfOoRnLaAlHwSyBqArNeWlQoMh",
    ip: "203.0.113.198",
    committed: 1.4,
    used: 1.04,
    usedPercentage: 74.3,
    uptime: 98.3,
    healthScore: 80,
    version: "v0.7.1",
  },
  {
    pubkey: "8pJjR8cAxUdViHfT8eGgPpSnMbBmIxTzCrBsOfXmRpNi",
    ip: "198.51.100.87",
    committed: 1.7,
    used: 1.27,
    usedPercentage: 74.7,
    uptime: 97.8,
    healthScore: 79,
    version: "v0.7.2",
  },
];

const sortOptions: Record<SortOption, string> = {
  reliability: "Reliability (Health)",
  storage: "Storage Committed",
  uptime: "Uptime",
};

export function TopPerformersTable({ data = defaultData, isLoading = false }: TopPerformersTableProps) {
  const [sortBy, setSortBy] = useState<SortOption>("reliability");
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  // Sort and take top 10 based on selected option
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      switch (sortBy) {
        case "reliability":
          return b.healthScore - a.healthScore;
        case "storage":
          return b.committed - a.committed;
        case "uptime":
          return b.uptime - a.uptime;
        default:
          return 0;
      }
    });
    return sorted.slice(0, 10);
  }, [data, sortBy]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => createColumns(isCopied, copyToClipboard),
    [isCopied, copyToClipboard]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : (
        <>
          {/* Header with Dropdown */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[#E5E7EB]">
                Top 10 Pods by {sortOptions[sortBy]}
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-2 text-sm text-[#E5E7EB] transition-colors hover:bg-white/5 focus:outline-none focus:ring-0">
                {sortOptions[sortBy]}
                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#0A0A0A]">
                <DropdownMenuItem
                  onClick={() => setSortBy("reliability")}
                  className={`cursor-pointer text-sm ${
                    sortBy === "reliability"
                      ? "bg-[#1E40AF] text-white"
                      : "text-[#E5E7EB] hover:bg-white/5"
                  }`}
                >
                  Reliability (Health)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("storage")}
                  className={`cursor-pointer text-sm ${
                    sortBy === "storage"
                      ? "bg-[#1E40AF] text-white"
                      : "text-[#E5E7EB] hover:bg-white/5"
                  }`}
                >
                  Storage Committed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("uptime")}
                  className={`cursor-pointer text-sm ${
                    sortBy === "uptime"
                      ? "bg-[#1E40AF] text-white"
                      : "text-[#E5E7EB] hover:bg-white/5"
                  }`}
                >
                  Uptime
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {table.getFlatHeaders().map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#6B7280]"
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
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`group border-b border-white/5 transition-colors hover:bg-white/5 ${
                      index === 0 ? "bg-[#1E40AF]/10" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
