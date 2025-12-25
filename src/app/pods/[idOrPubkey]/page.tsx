"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { usePnodeDetails } from "@/hooks/use-pnode-details";
import { apiClient } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { PodDetails } from "@/lib/types";
import type { PNodeDetail } from "@/lib/types";
import {
  Breadcrumbs,
  PodHeader,
  KeyMetricsSection,
  StorageUtilizationChart,
  ResourceUtilizationSection,
  NetworkActivitySection,
  OperationalMetadata,
  PrivateNodeCallout,
  LoadingState,
} from "@/components/pods";

function mapPNodeDetailToPodDetails(apiData: PNodeDetail): PodDetails {
  const storageCommittedBytes = Number(apiData.storageCommitted);
  const storageUsedBytes = Number(apiData.storageUsed);
  
  return {
    pubkey: apiData.pubkey || "",
    ip: apiData.ipAddress,
    gossipPort: apiData.gossipPort,
    version: apiData.version,
    status: apiData.status,
    rpcPort: apiData.rpcPort,
    visibility: apiData.isPublic ? "PUBLIC" : "PRIVATE",
    storageCommitted: storageCommittedBytes / (1024 ** 3), // Convert bytes to GB
    storageUsed: storageUsedBytes / (1024 ** 3), // Convert bytes to GB
    uptime: apiData.uptime,
    healthScore: apiData.healthScore,
    lastSeen: new Date(apiData.lastSeenAt),
    firstSeen: new Date(apiData.firstSeenAt),
    city: apiData.city || undefined,
    country: apiData.country || undefined,
    cpuPercent: apiData.cpuPercent ?? undefined,
    ramUsed: apiData.ramUsed ? Number(apiData.ramUsed) / (1024 ** 3) : undefined, // Convert to GB
    ramTotal: apiData.ramTotal ? Number(apiData.ramTotal) / (1024 ** 3) : undefined, // Convert to GB
    activeStreams: apiData.activeStreams ?? undefined,
    packetsSent: apiData.packetsSent ? Number(apiData.packetsSent) : undefined,
    packetsReceived: apiData.packetsReceived ? Number(apiData.packetsReceived) : undefined,
    totalBytes: apiData.totalBytes ? Number(apiData.totalBytes) : undefined,
    totalPages: apiData.totalPages ?? undefined,
    currentIndex: apiData.currentIndex ?? undefined,
    storageHistory: [],
    cpuHistory: undefined,
    ramHistory: undefined,
  };
}

export default function PodDetailsPage() {
  const params = useParams();
  const idOrPubkey = params.idOrPubkey as string;
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: apiData, isLoading, error, isFetching } = usePnodeDetails(idOrPubkey);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCountdown(30); 
    try {
      const freshData = await apiClient.getPnodeDetails(idOrPubkey, true);
      queryClient.setQueryData(["pnode-details", idOrPubkey, false], freshData);
    
      await queryClient.invalidateQueries({
        queryKey: ["pnode-history", idOrPubkey],
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger auto-refresh
          (async () => {
            setIsRefreshing(true);
            try {
              // Refresh pod details with live data
              const freshData = await apiClient.getPnodeDetails(idOrPubkey, true);
              queryClient.setQueryData(["pnode-details", idOrPubkey, false], freshData);
              
              // Invalidate all history queries to fetch fresh data with includeLive=true
              await queryClient.invalidateQueries({
                queryKey: ["pnode-history", idOrPubkey],
              });
            } finally {
              setIsRefreshing(false);
            }
          })();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [idOrPubkey, queryClient]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !apiData) {
    return (
      <main className="container mx-auto px-6 py-8">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">Failed to load pod details</p>
          <p className="text-sm text-red-400/60 mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </main>
    );
  }

  const pod = mapPNodeDetailToPodDetails(apiData);

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumbs />
        <button
          onClick={handleRefresh}
          disabled={isFetching || isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0b0b] px-4 py-2 text-sm font-medium text-[#E5E7EB] transition-all hover:border-[#1E40AF] hover:bg-[#1E40AF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh pod data"
        >
          <RefreshCw className={`h-4 w-4 transition-transform ${isFetching || isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh in {countdown}s</span>
        </button>
      </div>

      <PodHeader pod={pod} />
      <KeyMetricsSection pod={pod} />
      <StorageUtilizationChart idOrPubkey={idOrPubkey} />
      <ResourceUtilizationSection 
        idOrPubkey={idOrPubkey}
        isPublic={pod.visibility === "PUBLIC"}
        currentCpuPercent={pod.cpuPercent}
        currentRamUsed={pod.ramUsed}
        currentRamTotal={pod.ramTotal}
      />
      <NetworkActivitySection pod={pod} />
      <OperationalMetadata pod={pod} />

      {pod.visibility === "PRIVATE" && <PrivateNodeCallout />}
    </main>
  );
}
