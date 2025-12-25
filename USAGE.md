# API Reference

Complete API documentation for the Xandeum pNodes Analytics Platform.

## Base URL

```
https://your-domain.com/api/v1
```

## Authentication

Currently, all endpoints are publicly accessible without authentication.

## Rate Limiting

API responses are cached using Redis with the following TTLs:
- Network stats: 300 seconds (5 minutes)
- Network history: 60 seconds
- Node list: 30 seconds
- Node details: 60 seconds

Use `?refresh=true` parameter to bypass cache when needed.

---

## Network Endpoints

### Get Network Statistics

Retrieve current network-wide statistics including node counts, storage metrics, and health scores.

**Endpoint:** `GET /api/v1/network`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `refresh` | boolean | No | false | Bypass cache and fetch fresh data |

**Example Request:**

```bash
curl https://your-domain.com/api/v1/network
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalPNodes": 198,
    "onlinePNodes": 185,
    "degradedPNodes": 8,
    "offlinePNodes": 5,
    "totalStorageCommitted": "1250000000000000",
    "totalStorageUsed": "45000000000",
    "avgStorageUsagePercent": 2.85,
    "avgUptime": 145230,
    "networkHealthScore": 87,
    "timestamp": "2024-12-26T10:30:00.000Z",
    "versionDistribution": [
      { "version": "0.8.0", "count": 180 },
      { "version": "0.7.0", "count": 18 }
    ],
    "storageDistribution": [
      { "range": "0-100GB", "count": 45 },
      { "range": "100GB-1TB", "count": 120 },
      { "range": "1TB+", "count": 33 }
    ]
  }
}
```

**Response Fields:**

- `totalPNodes` (integer): Total number of valid nodes
- `onlinePNodes` (integer): Nodes seen in last 5 minutes
- `degradedPNodes` (integer): Nodes with degraded health
- `offlinePNodes` (integer): Nodes offline > 5 minutes
- `totalStorageCommitted` (string): Total committed storage in bytes
- `totalStorageUsed` (string): Total used storage in bytes
- `avgStorageUsagePercent` (float): Average storage utilization percentage
- `avgUptime` (integer): Average uptime in seconds
- `networkHealthScore` (integer): Overall network health (0-100)
- `timestamp` (string): ISO 8601 timestamp
- `versionDistribution` (array): Node count per version
- `storageDistribution` (array): Node count per storage range

---

### Get Network History

Retrieve historical network statistics over a specified time period.

**Endpoint:** `GET /api/v1/network/history`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hours` | integer | No | 24 | Time range in hours (1-168) |
| `points` | integer | No | 50 | Number of data points to return |

**Example Request:**

```bash
curl "https://your-domain.com/api/v1/network/history?hours=24&points=24"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "timestamp": "2024-12-26T09:00:00.000Z",
        "totalPNodes": 195,
        "onlinePNodes": 182,
        "totalStorageCommitted": "1248000000000000",
        "totalStorageUsed": "44500000000",
        "networkHealthScore": 86
      },
      {
        "timestamp": "2024-12-26T10:00:00.000Z",
        "totalPNodes": 198,
        "onlinePNodes": 185,
        "totalStorageCommitted": "1250000000000000",
        "totalStorageUsed": "45000000000",
        "networkHealthScore": 87
      }
    ],
    "startTime": "2024-12-25T10:00:00.000Z",
    "endTime": "2024-12-26T10:00:00.000Z",
    "dataPoints": 24
  }
}
```

---

## Node Endpoints

### List Nodes

Retrieve a paginated list of all nodes with optional filtering and sorting.

**Endpoint:** `GET /api/v1/pnodes`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `pageSize` | integer | No | 20 | Items per page (1-100) |
| `status` | string | No | - | Filter by status: ONLINE, DEGRADED, OFFLINE, INVALID |
| `version` | string | No | - | Filter by pNode version (e.g., "0.8.0") |
| `country` | string | No | - | Filter by country name |
| `storageCommitted` | string | No | - | Filter by minimum storage (e.g., "100GB", "1TB") |
| `search` | string | No | - | Search in pubkey, IP, city, country |
| `sortBy` | string | No | healthScore | Sort field: healthScore, uptime, storageUsed, lastSeenAt |
| `sortDir` | string | No | desc | Sort direction: asc, desc |

**Example Request:**

```bash
curl "https://your-domain.com/api/v1/pnodes?page=1&pageSize=10&status=ONLINE&sortBy=healthScore&sortDir=desc"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "pubkey": "EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL",
        "ipAddress": "173.212.207.32",
        "gossipPort": 9001,
        "rpcPort": 6000,
        "isPublic": true,
        "version": "0.8.0",
        "status": "ONLINE",
        "storageCommitted": "340000000000",
        "storageUsed": "96947",
        "storageUsagePercent": 0.000028513,
        "uptime": 103334,
        "lastSeenAt": "2024-12-26T10:29:33.000Z",
        "latitude": 50.1109,
        "longitude": 8.6821,
        "country": "Germany",
        "countryCode": "DE",
        "city": "Frankfurt",
        "healthScore": 92
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 20,
      "totalCount": 198,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "versions": ["0.8.0", "0.7.0"],
      "countries": ["Germany", "United States", "France"],
      "statusCounts": {
        "ONLINE": 185,
        "DEGRADED": 8,
        "OFFLINE": 5,
        "INVALID": 0
      }
    }
  }
}
```

**Response Fields:**

- `nodes` (array): Array of node objects
  - `id` (string): UUID of the node
  - `pubkey` (string): Node public key (44 characters)
  - `ipAddress` (string): IPv4 or IPv6 address
  - `gossipPort` (integer): Gossip network port
  - `rpcPort` (integer): RPC endpoint port
  - `isPublic` (boolean): RPC accessibility
  - `version` (string): pNode software version
  - `status` (enum): ONLINE, DEGRADED, OFFLINE, INVALID
  - `storageCommitted` (string): Committed storage in bytes
  - `storageUsed` (string): Used storage in bytes
  - `storageUsagePercent` (float): Storage utilization percentage
  - `uptime` (integer): Node uptime in seconds
  - `lastSeenAt` (string): ISO 8601 timestamp of last activity
  - `latitude` (float): Geographic latitude
  - `longitude` (float): Geographic longitude
  - `country` (string): Country name
  - `countryCode` (string): ISO 3166-1 alpha-2 country code
  - `city` (string): City name
  - `healthScore` (integer): Node health score (0-100)

---

### Get Node Details

Retrieve detailed information about a specific node by pubkey or ID.

**Endpoint:** `GET /api/v1/pnodes/{pubkeyOrId}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pubkeyOrId` | string | Yes | Node pubkey (44 chars) or UUID |

**Example Request:**

```bash
curl https://your-domain.com/api/v1/pnodes/EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pubkey": "EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL",
    "ipAddress": "173.212.207.32",
    "gossipPort": 9001,
    "rpcPort": 6000,
    "gossipAddress": "173.212.207.32:9001",
    "isPublic": true,
    "version": "0.8.0",
    "status": "ONLINE",
    "storageCommitted": "340000000000",
    "storageUsed": "96947",
    "storageUsagePercent": 0.000028513,
    "uptime": 103334,
    "lastSeenTimestamp": 1735206573,
    "lastSeenAt": "2024-12-26T10:29:33.000Z",
    "firstSeenAt": "2024-12-20T08:15:22.000Z",
    "latitude": 50.1109,
    "longitude": 8.6821,
    "country": "Germany",
    "countryCode": "DE",
    "city": "Frankfurt",
    "healthScore": 92,
    "latestStats": {
      "timestamp": "2024-12-26T10:00:00.000Z",
      "cpuPercent": 0.49,
      "ramUsed": "753451008",
      "ramTotal": "12541607936",
      "activeStreams": 2,
      "packetsReceived": "3214911",
      "packetsSent": "3685501",
      "totalBytes": "99230",
      "totalPages": 0,
      "currentIndex": 18
    }
  }
}
```

**Note:** `latestStats` object is only available for public nodes with accessible RPC.

---

### Get Node History

Retrieve historical performance metrics for a specific node.

**Endpoint:** `GET /api/v1/pnodes/{pubkeyOrId}/history`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pubkeyOrId` | string | Yes | Node pubkey (44 chars) or UUID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hours` | integer | No | 24 | Time range in hours (1-720) |

**Example Request:**

```bash
curl "https://your-domain.com/api/v1/pnodes/EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL/history?hours=168"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "pubkey": "EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL",
    "history": [
      {
        "timestamp": "2024-12-26T09:00:00.000Z",
        "storageCommitted": "340000000000",
        "storageUsed": "96500",
        "storageUsagePercent": 0.000028382,
        "cpuPercent": 0.52,
        "ramUsed": "745000000",
        "ramTotal": "12541607936",
        "uptime": 99734,
        "activeStreams": 2,
        "packetsReceived": "3180000",
        "packetsSent": "3650000",
        "totalBytes": "98500",
        "healthScore": 91
      },
      {
        "timestamp": "2024-12-26T10:00:00.000Z",
        "storageCommitted": "340000000000",
        "storageUsed": "96947",
        "storageUsagePercent": 0.000028513,
        "cpuPercent": 0.49,
        "ramUsed": "753451008",
        "ramTotal": "12541607936",
        "uptime": 103334,
        "activeStreams": 2,
        "packetsReceived": "3214911",
        "packetsSent": "3685501",
        "totalBytes": "99230",
        "healthScore": 92
      }
    ],
    "startTime": "2024-12-19T10:00:00.000Z",
    "endTime": "2024-12-26T10:00:00.000Z",
    "dataPoints": 168
  }
}
```

---

## Data Models

### Node Status Enum

```typescript
enum Status {
  ONLINE   = "ONLINE",   // Last seen < 5 min ago, health score >= 70
  DEGRADED = "DEGRADED", // Last seen < 5 min ago, health score 40-69
  OFFLINE  = "OFFLINE",  // Last seen > 5 min ago
  INVALID  = "INVALID"   // Missing critical data (pubkey/address)
}
```

### Health Score Calculation

Health score is calculated as a weighted average:

```
healthScore = (storageScore * 0.4) + (uptimeScore * 0.4) + (freshnessScore * 0.2)

Where:
- storageScore = min(100, storageUsagePercent * 20)
- uptimeScore = min(100, (uptime / 86400) * 10)
- freshnessScore = max(0, 100 - (minutesSinceLastSeen * 20))
```

Result is clamped to 0-100 range.

### Storage Units

All storage values are returned as strings in bytes to prevent precision loss with large numbers.

**Conversion:**
```
1 GB = 1,073,741,824 bytes
1 TB = 1,099,511,627,776 bytes
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database query failed |

**Example Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "page": "must be a positive integer",
      "pageSize": "must be between 1 and 100"
    }
  }
}
```

---

## Caching Strategy

The API uses Redis caching to improve performance:

| Endpoint | Cache TTL | Cache Key Format |
|----------|-----------|------------------|
| `/api/v1/network` | 300s | `v1:network:current-v2:{refresh}` |
| `/api/v1/network/history` | 60s | `v1:network:history:{hours}:{points}` |
| `/api/v1/pnodes` | 30s | `v1:pnodes:list:{page}:{pageSize}:{filters}` |
| `/api/v1/pnodes/{id}` | 60s | `v1:pnodes:detail:{id}` |
| `/api/v1/pnodes/{id}/history` | 60s | `v1:pnodes:history:{id}:{hours}` |

**Cache Bypass:**

Add `?refresh=true` to any endpoint to bypass cache and fetch fresh data.

---

## Data Freshness

Understanding data update frequencies:

### Basic Stats (Updated Every Minute)
- Node list
- Storage metrics
- Uptime
- Last seen timestamp
- Health scores
- Network totals

### Detailed Stats (Updated Hourly)
- CPU usage
- RAM usage
- Active streams
- Network packets
- Total bytes/pages
- Historical records

**Note:** Only public nodes (with accessible RPC) have detailed stats. Private nodes show basic metrics only.

---

## Best Practices

### Pagination

Always use pagination for large result sets:

```bash
# Good: Paginated request
curl "https://your-domain.com/api/v1/pnodes?page=1&pageSize=50"

# Bad: No pagination (returns all 200+ nodes)
curl "https://your-domain.com/api/v1/pnodes"
```

### Filtering

Apply filters to reduce response size:

```bash
# Filter by status and version
curl "https://your-domain.com/api/v1/pnodes?status=ONLINE&version=0.8.0"

# Search for specific nodes
curl "https://your-domain.com/api/v1/pnodes?search=EcTq"
```

### Caching

Leverage cache when possible:

```bash
# Use cached response (fast)
curl "https://your-domain.com/api/v1/network"

# Force fresh data when needed
curl "https://your-domain.com/api/v1/network?refresh=true"
```

### Rate Limiting

Respect cache TTLs to avoid unnecessary database load. For real-time monitoring, poll at intervals matching cache TTL (30-300 seconds).

---

## Examples

### Get Top 10 Healthiest Nodes

```bash
curl "https://your-domain.com/api/v1/pnodes?pageSize=10&sortBy=healthScore&sortDir=desc"
```

### Get All Online Nodes in Germany

```bash
curl "https://your-domain.com/api/v1/pnodes?status=ONLINE&country=Germany&pageSize=100"
```

### Get Network Trends for Last Week

```bash
curl "https://your-domain.com/api/v1/network/history?hours=168&points=168"
```

### Search Nodes by Partial Pubkey

```bash
curl "https://your-domain.com/api/v1/pnodes?search=EcTq&pageSize=5"
```

### Monitor Node Performance

```bash
# Get current stats
curl "https://your-domain.com/api/v1/pnodes/EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL"

# Get 24-hour history
curl "https://your-domain.com/api/v1/pnodes/EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL/history?hours=24"
```

---

## Support

For issues or questions about the API, please refer to:
- [Architecture Documentation](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [README](./README.md)
