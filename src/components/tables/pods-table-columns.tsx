import { createColumnHelper } from "@tanstack/react-table";
import { Copy, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_COLORS } from "@/lib/constants/colors";
import { formatUptime, formatRelativeTime, getHealthColor } from "@/lib/formatters";

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

const columnHelper = createColumnHelper<Pod>();
const statusColors = STATUS_COLORS;

export const createPodColumns = (
  isCopied: (id: string, field: string) => boolean,
  copyToClipboard: (text: string, id: string, field: string) => void,
  onSortChange?: (columnId: string) => void,
  currentSortBy?: string
) => [
  columnHelper.accessor("rank", {
    header: "#",
    enableSorting: true,
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
          <span className="font-mono text-md text-[#E5E7EB]" title={pubkey}>
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
    enableSorting: false,
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
    (row) => row.storageCommitted,
    {
      id: "storage",
      enableSorting: true,
      header: () => {
        const getStorageSortLabel = () => {
          if (currentSortBy === "storageUsed") return "Used";
          if (currentSortBy === "storageUsagePercent") return "%";
          return "Total";
        };
        
        return (
          <div className="flex items-center gap-2">
            <span>Storage</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors hover:bg-white/10 focus:outline-none focus:ring-0"
              >
                <span className="text-[#9CA3AF]">({getStorageSortLabel()})</span>
                <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="border-white/10 bg-[#0A0A0A]"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSortChange?.("storageCommitted");
                  }}
                  className="cursor-pointer text-sm text-[#E5E7EB] hover:bg-white/5"
                >
                  Total Storage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSortChange?.("storageUsed");
                  }}
                  className="cursor-pointer text-sm text-[#E5E7EB] hover:bg-white/5"
                >
                  Used Storage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onSortChange?.("storageUsagePercent");
                  }}
                  className="cursor-pointer text-sm text-[#E5E7EB] hover:bg-white/5"
                >
                  Usage %
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
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
    enableSorting: false,
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
    enableSorting: true,
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
    enableSorting: false,
    cell: (info) => {
      const date = info.getValue();
      return (
        <span className="text-sm text-[#9CA3AF]" title={date.toISOString()}>
          {formatRelativeTime(date)}
        </span>
      );
    },
  }),
];
