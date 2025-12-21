"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { mockPublicNode, mockPrivateNode } from "@/lib/mocks/pod-details.mock";
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

export default function PodDetailsPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);

  // For demo purposes, determine which mock data to use
  // In real implementation, fetch based on params.idOrPubkey
  const isPrivateNode = params.idOrPubkey?.toString().startsWith("3v");
  const pod = isPrivateNode ? mockPrivateNode : mockPublicNode;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingState />;
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <Breadcrumbs />
      <PodHeader pod={pod} />
      <KeyMetricsSection pod={pod} />
      <StorageUtilizationChart pod={pod} />
      <ResourceUtilizationSection pod={pod} />
      <NetworkActivitySection pod={pod} />
      <OperationalMetadata pod={pod} />

      {pod.visibility === "PRIVATE" && <PrivateNodeCallout />}
    </main>
  );
}
