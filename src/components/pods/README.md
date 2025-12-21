# Pod Details Components

This directory contains the refactored components for the Pod Details page, following industry-standard component architecture patterns.

## Structure

```
components/pods/
├── index.ts                          # Barrel export for easy imports
├── breadcrumbs.tsx                   # Navigation breadcrumbs
├── loading-state.tsx                 # Loading skeleton component
├── pod-header.tsx                    # Pod identity and status header
├── key-metrics-section.tsx           # Key metrics KPI grid
├── storage-utilization-chart.tsx     # Storage usage chart
├── resource-utilization-section.tsx  # CPU and RAM charts
├── network-activity-section.tsx      # Network activity metrics
├── operational-metadata.tsx          # Operational metadata display
└── private-node-callout.tsx          # Private node information callout
```

## Components

### Breadcrumbs
Navigation breadcrumbs for the page hierarchy.

**Usage:**
```tsx
import { Breadcrumbs } from "@/components/pods";

<Breadcrumbs />
```

### LoadingState
Full-page loading skeleton shown while data is being fetched.

**Usage:**
```tsx
import { LoadingState } from "@/components/pods";

if (loading) return <LoadingState />;
```

### PodHeader
Displays pod identity (pubkey, IP, ports) with status badges and copy functionality.

**Props:**
- `pod: PodDetails` - Pod data object

**Features:**
- Copy to clipboard for pubkey and network endpoints
- Status, visibility, and version badges
- Responsive layout

**Usage:**
```tsx
import { PodHeader } from "@/components/pods";

<PodHeader pod={podData} />
```

### KeyMetricsSection
Displays key performance metrics in a grid layout.

**Props:**
- `pod: PodDetails` - Pod data object

**Metrics:**
- Storage Committed
- Storage Used
- Storage Usage %
- Uptime
- Health Score
- Last Seen

**Usage:**
```tsx
import { KeyMetricsSection } from "@/components/pods";

<KeyMetricsSection pod={podData} />
```

### StorageUtilizationChart
Line chart showing storage committed vs. used over time.

**Props:**
- `pod: PodDetails` - Pod data object (uses `storageHistory`)

**Usage:**
```tsx
import { StorageUtilizationChart } from "@/components/pods";

<StorageUtilizationChart pod={podData} />
```

### ResourceUtilizationSection
Displays CPU and RAM usage charts with privacy controls for private nodes.

**Props:**
- `pod: PodDetails` - Pod data object

**Features:**
- Real-time CPU percentage chart
- RAM usage area chart
- Blurred with overlay for private nodes
- Responsive grid layout

**Usage:**
```tsx
import { ResourceUtilizationSection } from "@/components/pods";

<ResourceUtilizationSection pod={podData} />
```

### NetworkActivitySection
Displays network activity metrics with privacy controls.

**Props:**
- `pod: PodDetails` - Pod data object

**Metrics:**
- Active Streams
- Packets Sent
- Packets Received
- Total Bytes
- Total Pages
- Current Index

**Features:**
- Shows real data for public nodes
- Blurred with "Locked" overlay for private nodes

**Usage:**
```tsx
import { NetworkActivitySection } from "@/components/pods";

<NetworkActivitySection pod={podData} />
```

### OperationalMetadata
Displays operational metadata in a definition list format.

**Props:**
- `pod: PodDetails` - Pod data object

**Fields:**
- First Seen
- Last Seen
- Location (if available)
- Version

**Usage:**
```tsx
import { OperationalMetadata } from "@/components/pods";

<OperationalMetadata pod={podData} />
```

### PrivateNodeCallout
Information callout explaining limited metrics for private nodes.

**Usage:**
```tsx
import { PrivateNodeCallout } from "@/components/pods";

{pod.visibility === "PRIVATE" && <PrivateNodeCallout />}
```

## Design Principles

### Single Responsibility
Each component has a single, well-defined purpose:
- **PodHeader**: Identity and status display
- **KeyMetricsSection**: Metrics grid
- **StorageUtilizationChart**: Storage visualization
- etc.

### Composability
Components are designed to be composed together in the parent page:

```tsx
<main>
  <Breadcrumbs />
  <PodHeader pod={pod} />
  <KeyMetricsSection pod={pod} />
  <StorageUtilizationChart pod={pod} />
  <ResourceUtilizationSection pod={pod} />
  <NetworkActivitySection pod={pod} />
  <OperationalMetadata pod={pod} />
  {pod.visibility === "PRIVATE" && <PrivateNodeCallout />}
</main>
```

### Prop Drilling Prevention
Components receive only the data they need through props, maintaining a clear data flow.

### Type Safety
All components use TypeScript with proper type definitions from `@/lib/types`.

### Reusability
Components can be easily reused in other parts of the application:
- `Breadcrumbs` - Any hierarchical navigation
- `LoadingState` - Any loading scenario
- `PrivateNodeCallout` - Any privacy-related information

### Testability
Each component can be unit tested independently with mock data.

### Performance
- Components are memoized where appropriate (charts)
- State is localized (e.g., copy state in `PodHeader`)
- Charts use optimized rendering with Recharts

## Related Files

### Types
Types are centralized in `@/lib/types.ts`:
- `PodDetails` - Main pod data interface
- `Visibility` - "PUBLIC" | "PRIVATE"
- `Status` - "ONLINE" | "DEGRADED" | "OFFLINE" | "INVALID"

### Mock Data
Mock data is centralized in `@/lib/mocks/pod-details.mock.ts`:
- `mockPublicNode` - Sample public node data
- `mockPrivateNode` - Sample private node data

### Utilities
Formatting utilities from `@/lib/formatters.ts`:
- `formatUptime()` - Format seconds to human-readable uptime
- `formatRelativeTime()` - Format date to relative time (e.g., "5m ago")
- `formatBytes()` - Format bytes to GB/TB
- `formatNumber()` - Format numbers with commas

### Constants
Status colors from `@/lib/constants/colors.ts`:
- `STATUS_COLORS` - Color mappings for status badges

## Future Improvements

1. **Data Fetching**: Replace mock data with real API calls
2. **Error Handling**: Add error boundaries and error states
3. **Accessibility**: Add ARIA labels and keyboard navigation
4. **Animations**: Add smooth transitions between states
5. **Testing**: Add unit tests for each component
6. **Storybook**: Add Storybook stories for component documentation
7. **Lazy Loading**: Lazy load chart components for better performance
