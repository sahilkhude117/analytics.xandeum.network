# Phase 3: API Layer (Next.js App Router, /api/v1)

## 🎯 Objectives
- Expose a fast, stable API for the dashboard and integrators.
- Use Next.js App Router API routes under `/api/v1/*`.
- Read via Prisma (singleton already at `src/lib/prisma.ts`).
- Cache hot responses (Upstash Redis) with short TTLs.
- Keep cron collection minimal: no per-node heavy stats; fetch those on-demand.

---

## 🧭 Scope & Principles
- Table views use persisted data (pnodes, network_stats, recent aggregates).
- Heavy per-node metrics (cpu, ram, packets, streams) fetched on-demand from pRPC when a user opens the Node Details page; not stored per minute.
- Responses are versioned (`/api/v1`) and stable; introduce breaking changes via `/api/v2` when needed.
- Avoid N+1 queries; prefer batch reads and selective fields.

---

## 🗂️ Endpoints (v1)

### 1 GET /api/v1/pnodes
- Purpose: Paginated list for table view.
- Query params:
  - `page` (default 1), `pageSize` (default 50, max 200)
  - `status` (ONLINE|DEGRADED|OFFLINE), `version`, `country`
  - `search` (pubkey prefix or IP), `sortBy` (last_seen_at|storage_usage_percent|uptime), `sortDir` (asc|desc)
- Source: `pnodes`.
- Returns: minimal fields for table (pubkey, ip_address, status, version, country, city, latitude, longitude, storage_committed, storage_used, storage_usage_percent, uptime, last_seen_at, health_score).
- Caching: Redis key `v1:pnodes:list:{hash(filters)}:{page}:{pageSize}` TTL 30s.

### 2) GET /api/v1/pnodes/[idOrPubkey]
- Purpose: Single pNode details (latest persisted values only).
- Path param: `id` (UUID) OR `pubkey` (44-char); detect by format.
- Source: `pnodes`.
- Caching: `v1:pnodes:item:{idOrPubkey}` TTL 30s.

### 3) GET /api/v1/pnodes/[idOrPubkey]/history
- Purpose: Lightweight time-series for charts; persisted values only (no cpu/ram/packets).
- Query params: `range` (e.g., 24h, 7d, 30d), `interval` (auto, 5m, 1h).
- Source: `pnode_stats` (storage_used, storage_usage_percent, uptime, health_score, timestamp).
- Caching: `v1:pnodes:history:{idOrPubkey}:{range}:{interval}` TTL 60s.

### 4) GET /api/v1/pnodes/[idOrPubkey]/live
- Purpose: On-demand live metrics via pRPC `get-stats` (cpu_percent, ram_used/total, active_streams, packets_* , total_bytes, total_pages, current_index).
- Path param: `id`/`pubkey` (resolve to IP:port).
- Source: pRPC to node RPC URL (from `pnodes.gossip_address` or compose from ip/rpc_port).
- Caching: Optional 5–10s to smooth bursts, or no cache.
- Rate limit: 20 req/min/IP to avoid abuse.

### 5) GET /api/v1/network/stats/current
- Purpose: Current global snapshot for dashboard hero.
- Source: latest row in `network_stats`.
- Caching: `v1:network:stats:current` TTL 30s.

### 6) GET /api/v1/network/stats/history
- Purpose: Charts for last 24h/7d with downsampling.
- Query params: `range` (24h, 7d, 30d), `interval` (auto, 5m, 1h).
- Source: `network_stats` (or materialized views when added).
- Caching: `v1:network:stats:history:{range}:{interval}` TTL 60s (longer acceptable).

### 7) GET /api/v1/health
- Purpose: Readiness/liveness; returns API + DB connectivity and last collection timestamp.
- Source: DB ping + latest `network_stats` timestamp.
- Caching: none.

---

## 🧱 Data Contracts (DTOs)

- PNodeListItem
  - pubkey, ipAddress, status, version, country, city, latitude, longitude,
    storageCommitted, storageUsed, storageUsagePercent, uptime, lastSeenAt, healthScore
- PNodeDetail
  - all of above + gossipPort, rpcPort, firstSeenAt
- PNodeHistoryPoint
  - timestamp, storageUsed, storageUsagePercent, uptime, healthScore
- NetworkStats
  - timestamp, totalPNodes, onlinePNodes, degradedPNodes, offlinePNodes,
    totalStorageCommitted, totalStorageUsed, avgStorageUsagePercent, avgUptime, networkHealthScore
- LiveNodeStats
  - cpuPercent, ramUsed, ramTotal, activeStreams, packetsReceived, packetsSent,
    totalBytes, totalPages, currentIndex, lastUpdated

Consistent casing: external API uses camelCase; map from DB snake_case.

---

## 🚦 Caching Strategy (Upstash Redis)
- Library: REST (simple) or `@upstash/redis` depending on project preference.
- TTLs: 30s for table/current, 60s for history.
- Keys: `v1:*` namespace for forward-compat.
- Invalidation: rely on TTL; optional soft-invalidation after cron run.

---

## 🛡️ Security & Limits
- CORS: allow dashboard origin; keep public read endpoints.
- Rate limit:
  - `/pnodes/live`: 20 req/min/IP
  - Others: 120 req/min/IP
- Input validation: zod schemas on query/path params.
- Error shapes: `{ success: false, error: { code, message } }`.

---

## 📈 Performance & Indexing
- `pnodes`: indexes already on `status`, `version`, `last_seen_at`, `ip_address`, `country`.
- `pnode_stats`: composite index `(pnode_id, timestamp DESC)`; use for history queries with LIMIT or time window.
- `network_stats`: index on `timestamp DESC` for latest fetch.
- Queries must select only needed columns for table views.

---

## 🧪 Testing Plan
- Unit: param validation (zod), DTO mappers, Redis key builders.
- Integration: endpoint → DB queries, pagination, filters, sort orders.
- Load: /pnodes list with 10k+ records (future proofing) via seeded data.
- Smoke: health endpoint, network current endpoint.

---

## 🏗️ Implementation Steps

1. Scaffolding
   - Create folders: `src/app/api/v1/pnodes`, `network`, `health`.
   - Add route handlers (`route.ts`) for each endpoint.

2. Utilities
   - `src/lib/redis.ts` (client), `src/lib/cache.ts` (helpers: get/set JSON),
     `src/lib/api.ts` (response helpers), `src/lib/validators.ts` (zod).
   - Mappers: DB → DTO in `src/lib/mappers/pnodes.ts`, `network.ts`.

3. Endpoints – Core
   - `/api/v1/pnodes` (filters, pagination, sort, cache).
   - `/api/v1/pnodes/[idOrPubkey]` (cache).
   - `/api/v1/network/stats/current` (cache).

4. Endpoints – History
   - `/api/v1/pnodes/[idOrPubkey]/history`.
   - `/api/v1/network/stats/history`.

5. Endpoint – Live
   - `/api/v1/pnodes/[idOrPubkey]/live` (pRPC call, rate limit, tiny TTL or none).

6. Validation & Errors
   - Add zod validators for all query/path params.
   - Normalize error responses.

7. Caching
   - Wire Upstash credentials from `.env`.
   - Add short TTLs and defensive `tryCache → query → set` flow.

8. Observability
   - Log request id, latency, cache hits/misses (basic for now).

9. Docs
   - Endpoint README with examples and query parameter docs.

---

## 📦 Folder Structure (target)
```
src/
  app/
    api/
      v1/
        health/route.ts
        network/
          stats/
            current/route.ts
            history/route.ts
        pnodes/
          route.ts                   # list
          [idOrPubkey]/
            route.ts                 # detail
            history/route.ts         # persisted history
            live/route.ts            # on-demand pRPC
  lib/
    prisma.ts
    redis.ts
    cache.ts
    validators.ts
    mappers/
      pnodes.ts
      network.ts
```

---

## 🕒 Timeline (Estimate)
- Scaffolding + utilities: 0.5 day
- Core endpoints (list/detail/network current): 1 day
- History endpoints: 0.5 day
- Live endpoint (pRPC + rate limit): 0.5 day
- Validation, caching, docs: 0.5 day

Total: ~3 days

---

## ✅ Deliverables
- All `/api/v1` endpoints implemented with Prisma + caching.
- Clear docs + examples.
- Rate limits in place.
- Ready for Phase 4 (UI consuming these endpoints).
