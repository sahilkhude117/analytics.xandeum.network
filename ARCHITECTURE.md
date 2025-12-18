# Data Flow Architecture for analytics.xandeum.network

## 🔄 Complete Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                   XANDEUM pNODE NETWORK                         │
│  (198 pNodes running v0.8.0 across the globe)                   │
│                                                                 │
│  Bootstrap: http://173.212.207.32:6000/rpc                      │
│  Method: get-pods-with-stats                                    │
│  Returns: { pods: [198 pNodes with stats], total_count: 198 }  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Every 1 minute (pg_cron)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               SUPABASE EDGE FUNCTION                            │
│  File: supabase/functions/collect-pnode-stats/index.ts          │
│                                                                 │
│  Process:                                                       │
│  1. Call get-pods-with-stats on bootstrap                       │
│  2. Parse response (198 pNodes)                                 │
│  3. Transform to database format                               │
│  4. Enrich with geo data (IP → country/city)                    │
│     - Only for new/incomplete records or when IP changed        │
│     - Uses ipapi.com with API key + batch & cache               │
│  5. Calculate health scores                                    │
│  6. Batch insert/update to Postgres                            │
│  7. Calculate network stats                                    │
│                                                                 │
│  Runtime: Deno, auto-scales, ~5–15 seconds                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ INSERT/UPDATE
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         SUPABASE POSTGRES 17 (Native Optimizations)             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TABLE: pnodes (Latest State)                              │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ pubkey | ip_address | version | storage_used | uptime... │ │
│  │ EcTqX  | 173.2.7.32 | 0.8.0   | 96947        | 103334    │ │
│  │ 6PbJS  | 152.53.1.5 | 0.8.0   | 0            | 45630     │ │
│  │ ...    | ...        | ...     | ...          | ...       │ │
│  │ [198 rows - UPSERT on each update]                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TABLE: pnode_stats (Time-Series with BRIN Indexes)       │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ pnode_id | timestamp         | storage_used | cpu_percent│ │
│  │ uuid-1   | 2025-12-16 10:00  | 96947        | 0.49       │ │
│  │ uuid-1   | 2025-12-16 10:01  | 97023        | 0.51       │ │
│  │ uuid-2   | 2025-12-16 10:00  | 0            | 1.2        │ │
│  │ ...      | ...               | ...          | ...        │ │
│  │ [~285K rows/day = 198 pNodes × 1440 minutes]              │ │
│  │ Retention: 90 days (manual cleanup)                       │ │
│  │ Optimizations: BRIN indexes, covering indexes             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ MATERIALIZED VIEWS (Pre-Aggregated)                      │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ pnode_stats_hourly  → ~4.7K rows/day (24h × 198 pNodes)  │ │
│  │ pnode_stats_daily   → ~198 rows/day (1/day × 198)        │ │
│  │ Refresh: Every hour (cron). Can be added later.          │ │
│  │ Purpose: 10-100x faster analytics queries                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TABLE: network_stats (Aggregated)                         │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ timestamp         | total_pnodes | online | total_storage│ │
│  │ 2025-12-16 10:00  | 198          | 195    | 50.2 TB      │ │
│  │ 2025-12-16 10:01  | 198          | 196    | 50.3 TB      │ │
│  │ ...               | ...          | ...    | ...          │ │
│  │ [~1440 rows/day = 1 per minute]                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ READ via Prisma
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NEXT.JS API ROUTES                              │
│  File: src/app/api/[endpoints]/route.ts                        │
│                                                                 │
│  Endpoints (Phase 3 API v1):                                    │
│  ├─ GET /api/v1/pnodes                 → List pNodes            │
│  ├─ GET /api/v1/pnodes/[idOrPubkey]    → Single pNode           │
│  ├─ GET /api/v1/pnodes/[id]/history    → Persisted history      │
│  ├─ GET /api/v1/pnodes/[id]/live       → On-demand pRPC stats   │
│  ├─ GET /api/v1/network/stats/current  → Current network stats  │
│  └─ GET /api/v1/network/stats/history  → Historical charts      │
│                                                                 │
│  Features:                                                      │
│  ├─ Check Redis cache first                                    │
│  ├─ Query Postgres if cache miss                               │
│  ├─ Transform to API format                                    │
│  ├─ Cache response in Redis                                    │
│  └─ Return JSON                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Cache layer (30s TTL)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  UPSTASH REDIS                                  │
│  Purpose: Reduce database load, faster responses               │
│                                                                 │
│  Keys:                                                          │
│  ├─ "v1:pnodes:list:{filters}:{page}:{size}"  (30s)           │
│  ├─ "v1:pnodes:item:{idOrPubkey}"            (30s)            │
│  ├─ "v1:network:stats:current"               (30s)            │
│  └─ "v1:network:stats:history:{range}"       (60s)            │
│                                                                 │
│  TTL Strategy:                                                  │
│  - Dashboard data: 30s (matches update frequency)              │
│  - Historical data: 5min (rarely changes)                      │
│  - Detail pages: 30s                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ API Response (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                             │
│  File: src/app/page.tsx (and other pages)                      │
│                                                                 │
│  Data Fetching:                                                 │
│  ├─ Client-side polling every 30s for table/current             │
│  ├─ Use SWR/TanStack Query with stale-while-revalidate          │
│  ├─ On-demand live stats when opening node details              │
│  └─ Loading skeletons                                           │
│                                                                 │
│  Pages:                                                         │
│  ├─ / (Dashboard)           → /api/network/stats               │
│  ├─ /nodes                  → /api/pnodes                      │
│  ├─ /nodes/[id]             → /api/pnodes/:id                  │
│  └─ /analytics              → /api/network/history             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Update Frequencies

| Component | Frequency | Latency | Purpose |
|-----------|-----------|---------|---------|
| **pRPC Network** | ~400ms gossip | Real-time | pNodes update their gossip status |
| **Edge Function (pg_cron)** | 1 minute | 5-10s | Fetch & store all pNode data |
| **Database Write** | 1 minute | <1s | Persist snapshots |
| **Redis Cache** | 30s TTL | <50ms | Fast API responses |
| **API Request** | On-demand | 50-200ms | Client requests |
| **Client Polling** | 30s | N/A | UI updates |

---

## 🔢 Data Volume Estimates

### Daily (198 pNodes)
- **pnode_stats inserts**: `198 × 1440 min = 285,120 rows/day`
- **network_stats inserts**: `1440 rows/day`
- **Database size growth**: `~50 MB/day`

### Monthly
- **pnode_stats**: `~8.5M rows`
- **network_stats**: `~43K rows`
- **Database size**: `~1.5 GB`

### With 90-day Retention
- **pnode_stats**: `~25M rows` (auto-pruned by TimescaleDB)
- **Database size**: `~4.5 GB`
- **Query performance**: Sub-second with proper indexes

---

## 🎯 Performance Targets

| Metric | Target | How Achieved |
|--------|--------|--------------|
| API Response Time | <200ms | Redis caching + indexes |
| Dashboard Load | <2s | Server-side rendering + caching |
| Historical Query | <500ms | TimescaleDB hypertables |
| Database Writes | <1s | Batch upserts |
| Edge Function | <10s | Parallel processing |
| Memory Usage | <512MB | Efficient queries |

---

## 🛡️ Error Handling Strategy

### Edge Function Level
```typescript
try {
  // Call get-pods-with-stats
  const response = await fetch(BOOTSTRAP_URL, { timeout: 10s });
} catch (error) {
  // Retry with fallback nodes
  // Log to Supabase
  // Send alert if all fail
}
```

### Database Level
```sql
-- Constraints prevent bad data
CHECK (storage_used <= storage_committed)
CHECK (cpu_percent >= 0 AND cpu_percent <= 100)
CHECK (uptime >= 0)
```

### API Level
```typescript
// Return cached data if DB fails
if (dbError && cachedData) {
  return cachedData;
}
```

### Client Level
```typescript
// Show stale data while refetching
useSWR('/api/pnodes', fetcher, {
  revalidateOnFocus: false,
  refreshInterval: 30000,
  fallbackData: previousData
});
```

---

## 📈 Scaling Considerations

### Current Scale (198 pNodes)
- ✅ Single Supabase instance handles easily
- ✅ No sharding needed
- ✅ Standard PostgreSQL indexes sufficient

### Future Scale (1000+ pNodes)
- Consider read replicas
- Implement connection pooling (already built-in)
- Add more aggressive caching
- Consider splitting historical data

---

## 🔐 Security Layers

1. **Database**: Row-level security (RLS) policies
2. **API**: Rate limiting (100 req/min)
3. **Edge Function**: Service role key (not exposed)
4. **Redis**: Authenticated connections only
5. **pRPC**: Read-only calls (no mutations)

---

## 🚀 Why This Architecture?

### ✅ Advantages
- **Serverless**: No server management
- **Scalable**: Auto-scales with load
- **Cost-effective**: Pay only for usage
- **Fast**: Multi-layer caching
- **Reliable**: Managed services (99.9% uptime)
- **Simple**: No complex orchestration

### ⚠️ Trade-offs
- **1-minute latency**: Not real-time (acceptable for analytics)
- **Vendor lock-in**: Supabase + Vercel (but can migrate)
- **Cost at scale**: Free tier limits (~500MB DB, 2M invocations)

---

**This is the architecture we're building!** 🎉

Next step: Follow SETUP_GUIDE.md to set up your database, then we'll build Phase 2 (Edge Functions).
