'use client';

import dynamic from 'next/dynamic';
import { useMapPods } from '@/hooks/use-map-pods';

const NetworkMap = dynamic(() => import('@/components/network-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] bg-black animate-pulse rounded-md" />
  ),
});

interface NetworkMapWrapperProps {
  onDataLoad?: (data: ReturnType<typeof useMapPods>['data']) => void;
}

export default function NetworkMapWrapper({ onDataLoad }: NetworkMapWrapperProps) {
  const mapQuery = useMapPods();
  
  // Notify parent when data changes
  if (onDataLoad && mapQuery.data) {
    onDataLoad(mapQuery.data);
  }
  
  return <NetworkMap />;
}
