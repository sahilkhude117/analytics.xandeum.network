'use client';

import dynamic from 'next/dynamic';

const NetworkMap = dynamic(() => import('@/components/NetworkMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] bg-black animate-pulse rounded-md" />
  ),
});

export default function NetworkMapWrapper() {
  return <NetworkMap />;
}
