"use client";

import { PodsTable } from "@/components/tables/pods-table";
import { useState, useEffect } from "react";

const generateMockPods = () => {
  const statuses = ["ONLINE", "DEGRADED", "OFFLINE", "INVALID"] as const;
  const visibilities = ["PUBLIC", "PRIVATE"] as const;
  const versions = ["v0.7.1", "v0.7.2", "v0.8.0"];
  const cities = ["New York", "London", "Tokyo", "Singapore", "Frankfurt"];
  const countries = ["USA", "UK", "Japan", "Singapore", "Germany"];

  const pods = Array.from({ length: 50 }, (_, i) => ({
    id: `pod-${i}`,
    rank: 0, // Will be calculated below
    pubkey: `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
    ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    port: 9001,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    visibility: visibilities[Math.floor(Math.random() * visibilities.length)],
    version: versions[Math.floor(Math.random() * versions.length)],
    storageUsed: Math.floor(Math.random() * 180) + 20,
    storageCommitted: Math.floor(Math.random() * 100) + 200,
    usagePercent: Math.floor(Math.random() * 90) + 10,
    uptime: Math.floor(Math.random() * 2592000) + 3600, // 1 hour to 30 days
    healthScore: Math.floor(Math.random() * 50) + 50,
    lastSeen: new Date(Date.now() - Math.random() * 3600000), // Last hour
    city: cities[Math.floor(Math.random() * cities.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
  }));

  // Sort by healthScore (desc), then by storageCommitted (desc) for ranking
  const sortedPods = [...pods].sort((a, b) => {
    if (b.healthScore !== a.healthScore) {
      return b.healthScore - a.healthScore;
    }
    return b.storageCommitted - a.storageCommitted;
  });

  // Assign ranks
  sortedPods.forEach((pod, index) => {
    pod.rank = index + 1;
  });

  return pods;
};

const mockPodsData = generateMockPods();

export default function PodsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const mockPods = mockPodsData;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Pods</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          All registered pNodes in the Xandeum network
        </p>
      </div>

      {/* Table */}
      <PodsTable data={mockPods} isLoading={isLoading} />
    </main>
  );
}

