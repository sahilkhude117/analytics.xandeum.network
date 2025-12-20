'use client';

import { useState, useMemo, memo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { geoMercator } from 'd3-geo';
import { mockPods } from '@/lib/mockPods';

// Status colors matching the dashboard theme
const statusColors = {
  online: '#22C55E',    // green
  degraded: '#FACC15',  // yellow
  offline: '#EF4444',   // red
  invalid: '#8B5CF6'    // purple
};

// Dotted map data - multiple cities per country for better coverage
const dottedMapData: Record<string, Array<{ lon: number; lat: number; cityDistanceRank: number }>> = {
  US: [
    { lon: -74.0060, lat: 40.7128, cityDistanceRank: 1 },
    { lon: -122.4194, lat: 37.7749, cityDistanceRank: 2 },
    { lon: -87.6298, lat: 41.8781, cityDistanceRank: 3 },
  ],
  GB: [
    { lon: -0.1278, lat: 51.5074, cityDistanceRank: 1 },
    { lon: -3.1883, lat: 55.9533, cityDistanceRank: 2 },
  ],
  JP: [
    { lon: 139.6503, lat: 35.6762, cityDistanceRank: 1 },
    { lon: 135.5022, lat: 34.6937, cityDistanceRank: 2 },
  ],
  DE: [
    { lon: 8.6821, lat: 50.1109, cityDistanceRank: 1 },
    { lon: 13.4050, lat: 52.5200, cityDistanceRank: 2 },
  ],
  FR: [
    { lon: 2.3522, lat: 48.8566, cityDistanceRank: 1 },
    { lon: 5.3698, lat: 43.2965, cityDistanceRank: 2 },
  ],
  AU: [
    { lon: 151.2093, lat: -33.8688, cityDistanceRank: 1 },
    { lon: 144.9631, lat: -37.8136, cityDistanceRank: 2 },
  ],
  SG: [{ lon: 103.8198, lat: 1.3521, cityDistanceRank: 1 }],
  IN: [{ lon: 77.2090, lat: 28.6139, cityDistanceRank: 1 }],
  CN: [{ lon: 121.4737, lat: 31.2304, cityDistanceRank: 1 }],
  BR: [{ lon: -46.6333, lat: -23.5505, cityDistanceRank: 1 }],
  CA: [{ lon: -79.3832, lat: 43.6532, cityDistanceRank: 1 }],
};



interface PodMarkerProps {
  pod: typeof mockPods[0];
  delay: number;
  onHover: (pod: typeof mockPods[0] | null) => void;
}

const PodMarker = memo(({ pod, delay, onHover }: PodMarkerProps) => {
  const color = statusColors[pod.status as keyof typeof statusColors];

  return (
    <Marker coordinates={[pod.lng, pod.lat]}>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay,
        }}
        onMouseEnter={() => onHover(pod)}
        onMouseLeave={() => onHover(null)}
        onClick={() => window.location.href = `/pods/${pod.pubkey}`}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      >
        <svg
          width="24"
          height="32"
          viewBox="0 0 32 42"
          x="-12"
          y="-32"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id={`shadow-${pod.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z"
            fill={color}
            filter={`url(#shadow-${pod.id})`}
          />
          <circle cx="16" cy="16" r="6" fill="white" />
          <path
            d="M16 10l-2 6h4l-2 6"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.g>
    </Marker>
  );
});
PodMarker.displayName = 'PodMarker';

interface NetworkMapProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function NetworkMap({ className = '', width = 1000, height = 560 }: NetworkMapProps) {
  const [hoveredPod, setHoveredPod] = useState<typeof mockPods[0] | null>(null);

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(140)
        .center([15, 25])
        .rotate([0, 0, 0])
        .translate([width / 2, height / 2]),
    [width, height]
  );

  // Create delays for staggered animation
  const markerDelays = useMemo(
    () => mockPods.map((_, i) => (i * 0.05) % 1),
    []
  );

  return (
    <div className={`relative w-full ${className}`}>
      <div className="w-full pointer-events-none">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [15, 25],
            rotate: [0, 0, 0],
          }}
          width={width}
          height={height}
          style={{ width: '100%', height: 'auto', backgroundColor: '#000' }}
        >
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1F2937"
                  stroke="#374151"
                  strokeWidth={0.5}
                />
              ))
            }
          </Geographies>
          {mockPods.map((pod, index) => (
            <PodMarker
              key={pod.id}
              pod={pod}
              delay={markerDelays[index]}
              onHover={setHoveredPod}
            />
          ))}
        </ComposableMap>
      </div>

      <AnimatePresence>
        {hoveredPod && (() => {
          const coords = projection([hoveredPod.lng, hoveredPod.lat]);
          if (!coords) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-10 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-sm shadow-xl"
              style={{
                left: `${(coords[0] / width) * 100}%`,
                top: `${(coords[1] / height) * 100}%`,
                transform: 'translate(-50%, -140%)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="22"
                    viewBox="0 0 32 42"
                    style={{ display: 'inline-block' }}
                  >
                    <path
                      d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z"
                      fill={statusColors[hoveredPod.status as keyof typeof statusColors]}
                    />
                  </svg>
                  <span className="text-[#E5E7EB] font-medium font-mono text-base">{hoveredPod.pubkey.slice(0, 12)}...</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <span className="text-[#9CA3AF]">Storage:</span>
                  <span className="text-[#E5E7EB] font-mono">
                    {hoveredPod.storageUsed}/{hoveredPod.storageCommitted}GB
                  </span>
                  <span className="text-[#9CA3AF]">Health:</span>
                  <span className="text-[#E5E7EB] font-mono">{hoveredPod.healthScore}%</span>
                  <span className="text-[#9CA3AF]">Status:</span>
                  <span
                    className="px-2 py-1 rounded font-medium uppercase text-xs"
                    style={{
                      backgroundColor: `${statusColors[hoveredPod.status as keyof typeof statusColors]}20`,
                      color: statusColors[hoveredPod.status as keyof typeof statusColors],
                    }}
                  >
                    {hoveredPod.status}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// mockPods is provided by src/lib/mockPods
