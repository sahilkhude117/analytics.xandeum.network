"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { PodDetails } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants/colors";

interface PodHeaderProps {
  pod: PodDetails;
}

export function PodHeader({ pod }: PodHeaderProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const statusColors = STATUS_COLORS;

  return (
    <div className="mb-8 rounded-lg border border-white/5 bg-[#0b0b0b] p-6">
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

          {/* Badges: Status, Visibility, Version */}
          <div className="flex flex-row gap-2 items-center">
            {/* Status Badge */}
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

            {/* Visibility Badge */}
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

            {/* Version Badge */}
            <div className="rounded-xl bg-white/5 px-4 py-2">
              <span className="text-base font-medium text-[#E5E7EB]">
                v{pod.version}
              </span>
            </div>
          </div>
        </div>

        {/* Network Endpoints Row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs font-semibold uppercase text-[#6B7280] mr-2">
            Network
          </span>
          <span className="font-mono text-md rounded bg-[#181818] px-2 py-1 text-[#E5E7EB]">
            IP: {pod.ip}
          </span>
          <span className="font-mono text-md rounded bg-[#181818] px-2 py-1 text-[#E5E7EB]">
            Gossip: {pod.gossipPort}
          </span>
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

          {pod.rpcPort && (
            <span className="font-mono text-md rounded bg-[#181818] px-2 py-1 text-[#E5E7EB]">
              RPC: {pod.rpcPort}
            </span>
          )}

          <button
            onClick={() =>
              handleCopy(
                pod.rpcPort
                  ? `${pod.ip}:${pod.rpcPort}`
                  : `${pod.ip}:${pod.gossipPort}`,
                "network"
              )
            }
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

        {/* Location */}
        {pod.city && pod.country && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-[#9CA3AF]">
              {pod.city}, {pod.country}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
