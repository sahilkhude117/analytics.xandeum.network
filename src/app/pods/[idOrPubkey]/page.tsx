"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  Check,
  ChevronRight,
  Home,
  Database,
  Cpu,
  Activity,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Status = "ONLINE" | "DEGRADED" | "OFFLINE" | "INVALID";
type Visibility = "PUBLIC" | "PRIVATE";

interface PodDetails {
  // Always available
  pubkey: string;
  ip: string;
  gossipPort: number;
  version: string;
  status: Status;
  rpcPort: number;
  visibility: Visibility;
  storageCommitted: number; // GB
  storageUsed: number; // GB
  uptime: number; // seconds
  healthScore: number;
  lastSeen: Date;
  firstSeen: Date;
  city?: string;
  country?: string;

  // Public node only
  cpuPercent?: number;
  ramUsed?: number;
  ramTotal?: number;
  activeStreams?: number;
  packetsSent?: number;
  packetsReceived?: number;
  totalBytes?: number;
  totalPages?: number;
  currentIndex?: number;

  // Time series data
  storageHistory: Array<{
    timestamp: Date;
    committed: number;
    used: number;
  }>;
  cpuHistory?: Array<{
    timestamp: Date;
    percent: number;
  }>;
  ramHistory?: Array<{
    timestamp: Date;
    used: number;
    total: number;
  }>;
}

// Mock data for a PUBLIC node
const mockPublicNode: PodDetails = {
  pubkey: "8kF3x9ZqN2pR7wL5mT4jY1vH6nB8dS9aC3eK2fM1gQ4u",
  ip: "192.168.1.100",
  gossipPort: 8001,
  version: "1.18.23",
  status: "ONLINE",
  visibility: "PUBLIC",
  storageCommitted: 1024,
  storageUsed: 768,
  uptime: 2592000, // 30 days in seconds
  healthScore: 96,
  lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
  firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  city: "New York",
  country: "United States",
  cpuPercent: 42,
  ramUsed: 12.4,
  ramTotal: 32,
  rpcPort: 6000,
  activeStreams: 156,
  packetsSent: 9842301,
  packetsReceived: 8234512,
  totalBytes: 1024 * 1024 * 1024 * 450, // 450 GB
  totalPages: 234891,
  currentIndex: 234890,
  storageHistory: Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    committed: 1024,
    used: 500 + i * 9,
  })),
  cpuHistory: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
    percent: 30 + Math.random() * 30,
  })),
  ramHistory: Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
    used: 10 + Math.random() * 5,
    total: 32,
  })),
};

// Mock data for a PRIVATE node
const mockPrivateNode: PodDetails = {
  pubkey: "3vL9jK2fP6xR1wN8mT5yQ4aH7nD2bS6cE9hM3gJ4kU8p",
  ip: "10.0.5.23",
  gossipPort: 8001,
  version: "1.18.20",
  status: "ONLINE",
  visibility: "PRIVATE",
  storageCommitted: 512,
  rpcPort: 6000,
  storageUsed: 234,
  uptime: 1296000, // 15 days in seconds
  healthScore: 88,
  lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  firstSeen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  city: "Singapore",
  country: "Singapore",
  storageHistory: Array.from({ length: 15 }, (_, i) => ({
    timestamp: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000),
    committed: 512,
    used: 150 + i * 5.6,
  })),
};

const statusColors: Record<Status, { dot: string; text: string; bg: string }> =
  {
    ONLINE: { dot: "#22C55E", text: "#22C55E", bg: "#22C55E20" },
    DEGRADED: { dot: "#FACC15", text: "#FACC15", bg: "#FACC1520" },
    OFFLINE: { dot: "#EF4444", text: "#EF4444", bg: "#EF444420" },
    INVALID: { dot: "#6B7280", text: "#6B7280", bg: "#6B728020" },
  };

const getHealthColor = (score: number) => {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#FACC15";
  return "#EF4444";
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatRelativeTime = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

export default function PodDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // For demo purposes, determine which mock data to use
  // In real implementation, fetch based on params.idOrPubkey
  const isPrivateNode = params.idOrPubkey?.toString().startsWith("3v");
  const pod = isPrivateNode ? mockPrivateNode : mockPublicNode;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-32 w-full animate-pulse rounded-lg bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  const usagePercent = (pod.storageUsed / pod.storageCommitted) * 100;

  return (
    <main className="container mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[#9CA3AF]">
        <Link
          href="/"
          className="flex items-center gap-1 transition-colors hover:text-[#E5E7EB]"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href="/pods"
          className="transition-colors hover:text-[#E5E7EB]"
        >
          Pods
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#E5E7EB]">Pod Details</span>
      </nav>

      {/* Node Identity & Status Header */}
      <div className="mb-8 rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
        {/* New Identity Card Layout */}
        <div className="flex flex-col gap-4">
          {/* Top Row: Pubkey + Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            {/* Pubkey Hero */}
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-2xl lg:text-3xl font-bold text-[#E5E7EB]"
                title={pod.pubkey}
              >
                {pod.pubkey.slice(0, 8)}...{pod.pubkey.slice(-8)}
              </span>
              <button
                onClick={() => handleCopy(pod.pubkey, "pubkey")}
                className="transition-colors hover:text-[#1E40AF]"
                title="Copy full pubkey"
              >
                {copiedField === "pubkey" ? (
                  <Check className="h-5 w-5 text-[#22C55E]" />
                ) : (
                  <Copy className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </button>
            </div>
            {/* Badges: Status, Visibility, Version (ranked) */}
            <div className="flex flex-row gap-2 items-center">
              {/* Status - strongest */}
              <div
                className="flex items-center gap-2 rounded-xl px-5 py-2 shadow"
                style={{ backgroundColor: statusColors[pod.status].bg }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: statusColors[pod.status].dot }}
                />
                <span
                  className="text-base font-bold capitalize"
                  style={{ color: statusColors[pod.status].text }}
                >
                  {pod.status.toLowerCase()}
                </span>
              </div>
              {/* Visibility - medium */}
              <div
                className={`rounded-xl px-4 py-2 ${
                  pod.visibility === "PUBLIC"
                    ? "bg-[#1E40AF]/20"
                    : "bg-white/5"
                }`}
              >
                <span
                  className={`text-base font-semibold ${
                    pod.visibility === "PUBLIC"
                      ? "text-[#60A5FA]"
                      : "text-[#9CA3AF]"
                  }`}
                >
                  {pod.visibility}
                </span>
              </div>
              {/* Version - weakest */}
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <span className="text-base font-medium text-[#E5E7EB]">
                  v{pod.version}
                </span>
              </div>
            </div>
          </div>

          {/* Network Endpoints Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-semibold uppercase text-[#6B7280] mr-2">Network</span>
            <span className="font-mono text-md rounded bg-[#181818] px-2 py-1 text-[#E5E7EB]">IP: {pod.ip}</span>
            <span className="font-mono text-md rounded bg-[#181818] px-2 py-1 text-[#E5E7EB]">Gossip: {pod.gossipPort}</span>
            <button
              onClick={() => handleCopy(`${pod.ip}:${pod.gossipPort}`, "gossip")}
              className="transition-colors hover:text-[#1E40AF]"
              title="Copy IP:Gossip"
            >
              {copiedField === "gossip" ? (
                <Check className="h-4 w-4 text-[#22C55E]" />
              ) : (
                <Copy className="h-4 w-4 text-[#9CA3AF]" />
              )}
            </button>
            {/* RPC port: if available, show beside Gossip */}
            {pod.rpcPort && (
              <span className="font-mono text-md rounded bg-[#181818] px-2 py-1 text-[#E5E7EB]">RPC: {pod.rpcPort}</span>
            )}
            {/* Copy icon for endpoints: if RPC, copy ip:rpc, else ip:gossipPort */}
            <button
              onClick={() => handleCopy(
                pod.rpcPort
                  ? `${pod.ip}:${pod.rpcPort}`
                  : `${pod.ip}:${pod.gossipPort}`,
                "network"
              )}
              className="ml-2 transition-colors hover:text-[#1E40AF]"
              title={pod.rpcPort ? "Copy IP:RPC" : "Copy IP:Gossip"}
            >
              {copiedField === "network" ? (
                <Check className="h-4 w-4 text-[#22C55E]" />
              ) : (
                <Copy className="h-4 w-4 text-[#9CA3AF]" />
              )}
            </button>
          </div>

          {/* Location - tertiary, muted */}
          {pod.city && pod.country && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-[#9CA3AF]">
                {pod.city}, {pod.country}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics (Always Available) */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[#E5E7EB]">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {/* Storage Committed */}
          <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Storage Committed
            </div>
            <div className="text-2xl font-bold text-[#E5E7EB]">
              {pod.storageCommitted}
              <span className="ml-1 text-sm text-[#9CA3AF]">GB</span>
            </div>
          </div>

          {/* Storage Used */}
          <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Storage Used
            </div>
            <div className="text-2xl font-bold text-[#E5E7EB]">
              {pod.storageUsed}
              <span className="ml-1 text-sm text-[#9CA3AF]">GB</span>
            </div>
          </div>

          {/* Storage Usage % */}
          <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Storage Usage
            </div>
            <div className="text-2xl font-bold text-[#E5E7EB]">
              {usagePercent.toFixed(1)}
              <span className="ml-1 text-sm text-[#9CA3AF]">%</span>
            </div>
          </div>

          {/* Uptime */}
          <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Uptime
            </div>
            <div
              className="text-2xl font-bold text-[#E5E7EB]"
              title={`${pod.uptime} seconds`}
            >
              {formatUptime(pod.uptime)}
            </div>
          </div>

          {/* Health Score */}
          <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Health Score
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: getHealthColor(pod.healthScore) }}
            >
              {pod.healthScore}
              <span className="ml-1 text-sm text-[#9CA3AF]">/100</span>
            </div>
          </div>

          {/* Last Seen */}
          <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Last Seen
            </div>
            <div
              className="text-2xl font-bold text-[#E5E7EB]"
              title={pod.lastSeen.toISOString()}
            >
              {formatRelativeTime(pod.lastSeen)}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Utilization (Time Series) */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-[#9CA3AF]" />
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Storage Utilization
          </h2>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pod.storageHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="timestamp"
                stroke="#6B7280"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis stroke="#6B7280" label={{ value: "GB", angle: -90 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #ffffff20",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#E5E7EB" }}
                itemStyle={{ color: "#E5E7EB" }}
                formatter={(value: number | undefined) =>
                  value !== undefined ? `${value.toFixed(1)} GB` : 'N/A'
                }
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
              <Line
                type="monotone"
                dataKey="committed"
                stroke="#1E40AF"
                strokeWidth={2}
                name="Storage Committed"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="used"
                stroke="#FACC15"
                strokeWidth={2}
                name="Storage Used"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#1E40AF]" />
              <span className="text-[#9CA3AF]">Committed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#FACC15]" />
              <span className="text-[#9CA3AF]">Used</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Utilization (Always show, blurred for PRIVATE) */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-[#9CA3AF]" />
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Resource Utilization
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* CPU Usage */}
          <div className="relative rounded-lg border border-white/5 bg-[#0b0b0b] p-6 overflow-hidden">
            <div className="mb-4">
              <h3 className="text-md font-semibold text-[#E5E7EB]">
                CPU Usage
              </h3>
              {pod.visibility === "PUBLIC" ? (
                <div className="mt-1 text-2xl font-bold text-[#E5E7EB]">
                  {pod.cpuPercent}%
                  <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                    current
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-2xl font-bold text-[#E5E7EB] select-none blur-sm">
                  ---%
                  <span className="ml-2 text-sm font-normal text-[#9CA3AF]">current</span>
                </div>
              )}
            </div>
            {pod.visibility === "PUBLIC" && pod.cpuHistory ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pod.cpuHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#6B7280"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                  />
                  <YAxis stroke="#6B7280" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid #ffffff20",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E5E7EB" }}
                    itemStyle={{ color: "#E5E7EB" }}
                    formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : 'N/A'}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="percent"
                    stroke="#22C55E"
                    strokeWidth={2}
                    name="CPU %"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-[200px] bg-[#181818] blur-sm rounded"></div>
            )}
            {pod.visibility === "PRIVATE" && (
              <div className="absolute inset-0 bg-[#0b0b0b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <span className="flex items-center gap-2 text-[#9CA3AF] text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4h.01M19.07 4.93a10 10 0 11-14.14 0m14.14 0A10 10 0 004.93 19.07m14.14-14.14L4.93 19.07" /></svg>
                  Private Data Locked
                </span>
              </div>
            )}
          </div>

          {/* RAM Usage */}
          <div className="relative rounded-lg border border-white/5 bg-[#0b0b0b] p-6 overflow-hidden">
            <div className="mb-4">
              <h3 className="text-md font-semibold text-[#E5E7EB]">
                RAM Usage
              </h3>
              {pod.visibility === "PUBLIC" ? (
                <div className="mt-1 text-2xl font-bold text-[#E5E7EB]">
                  {pod.ramUsed?.toFixed(1)} GB
                  <span className="ml-2 text-sm font-normal text-[#9CA3AF]">
                    / {pod.ramTotal} GB
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-2xl font-bold text-[#E5E7EB] select-none blur-sm">
                  --- GB
                  <span className="ml-2 text-sm font-normal text-[#9CA3AF]">/ --- GB</span>
                </div>
              )}
            </div>
            {pod.visibility === "PUBLIC" && pod.ramHistory ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={pod.ramHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#6B7280"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                  />
                  <YAxis stroke="#6B7280" domain={[0, pod.ramTotal || 32]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      border: "1px solid #ffffff20",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E5E7EB" }}
                    itemStyle={{ color: "#E5E7EB" }}
                    formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(2)} GB` : 'N/A'}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleString()
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="used"
                    stroke="#60A5FA"
                    fill="#60A5FA40"
                    name="RAM Used"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-[200px] bg-[#181818] blur-sm rounded"></div>
            )}
            {pod.visibility === "PRIVATE" && (
              <div className="absolute inset-0 bg-[#0b0b0b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <span className="flex items-center gap-2 text-[#9CA3AF] text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4h.01M19.07 4.93a10 10 0 11-14.14 0m14.14 0A10 10 0 004.93 19.07m14.14-14.14L4.93 19.07" /></svg>
                  Private Data Locked
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Activity (Always show, blurred for PRIVATE) */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#9CA3AF]" />
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Network Activity
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {pod.visibility === "PUBLIC" ? (
            <>
              {/* Active Streams */}
              {pod.activeStreams !== undefined && (
                <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Active Streams
                  </div>
                  <div className="text-2xl font-bold text-[#22C55E]">
                    {formatNumber(pod.activeStreams)}
                  </div>
                </div>
              )}

              {/* Packets Sent */}
              {pod.packetsSent !== undefined && (
                <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Packets Sent
                  </div>
                  <div className="text-2xl font-bold text-[#E5E7EB]">
                    {formatNumber(pod.packetsSent)}
                  </div>
                </div>
              )}

              {/* Packets Received */}
              {pod.packetsReceived !== undefined && (
                <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Packets Received
                  </div>
                  <div className="text-2xl font-bold text-[#E5E7EB]">
                    {formatNumber(pod.packetsReceived)}
                  </div>
                </div>
              )}

              {/* Total Bytes */}
              {pod.totalBytes !== undefined && (
                <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Total Bytes
                  </div>
                  <div className="text-2xl font-bold text-[#E5E7EB]">
                    {formatBytes(pod.totalBytes)}
                  </div>
                </div>
              )}

              {/* Total Pages */}
              {pod.totalPages !== undefined && (
                <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Total Pages
                  </div>
                  <div className="text-2xl font-bold text-[#E5E7EB]">
                    {formatNumber(pod.totalPages)}
                  </div>
                </div>
              )}

              {/* Current Index */}
              {pod.currentIndex !== undefined && (
                <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Current Index
                  </div>
                  <div className="text-2xl font-bold text-[#E5E7EB]">
                    {formatNumber(pod.currentIndex)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Blurred KPIs for PRIVATE */}
              {["Active Streams", "Packets Sent", "Packets Received", "Total Bytes", "Total Pages", "Current Index"].map((label, index) => (
                <div key={index} className="relative rounded-lg border border-white/5 bg-[#0b0b0b] p-4 overflow-hidden">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280] blur-sm select-none">
                    {label}
                  </div>
                  <div className="text-2xl font-bold text-[#E5E7EB] blur-sm select-none">
                    ---
                  </div>
                  <div className="absolute inset-0 bg-[#0b0b0b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <span className="flex items-center gap-2 text-[#9CA3AF] text-xs font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4h.01M19.07 4.93a10 10 0 11-14.14 0m14.14 0A10 10 0 004.93 19.07m14.14-14.14L4.93 19.07" /></svg>
                      Locked
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Operational Metadata */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[#E5E7EB]">
          Operational Metadata
        </h2>
        <div className="rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                First Seen
              </dt>
              <dd className="mt-1 text-md text-[#E5E7EB]">
                {pod.firstSeen.toLocaleString()}
              </dd>
            </div>
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
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Version
              </dt>
              <dd className="mt-1 text-md text-[#E5E7EB]">{pod.version}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Private Node Data Availability Callout */}
      {pod.visibility === "PRIVATE" && (
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
      )}
    </main>
  );
}
