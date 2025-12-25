# Xandeum pNodes Analytics Platform

<div align="center">

![Xandeum](https://img.shields.io/badge/Xandeum-Analytics-00D4AA?style=for-the-badge&logo=database&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Real-Time Analytics for Xandeum Storage Network**

*Production-ready monitoring platform for 200+ pNodes with automated data collection*

[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat-square)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=flat-square)](https://upstash.com/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-F9F1E1?style=flat-square)](https://bun.sh/)

</div>

---


## 📋 Overview

**Xandeum pNodes Analytics Platform** is a comprehensive real-time monitoring dashboard for the Xandeum storage network. Built for the Superteam hackathon, it provides complete visibility into network health, node performance, and storage utilization across 200+ pNodes worldwide.

> **Built for Xandeum pNodes Analytics Hackathon by Superteam**
> This platform demonstrates advanced monitoring capabilities for decentralized storage networks, combining real-time data collection, intelligent health scoring, and interactive visualizations.

### Why This Platform?

- **Network-Wide Visibility**: Monitor 200+ pNodes in real-time
- **Automated Data Collection**: Cron-based edge functions running every minute
- **Historical Tracking**: Complete time-series data for trend analysis
- **Geographic Intelligence**: IP-based geo-location with interactive maps
- **Health Scoring System**: Intelligent node health assessment (0-100 scale)
- **Production-Ready**: Scalable architecture with caching and error handling

---

## 📖 Documentation

- **[USAGE.md](./USAGE.md)** - Complete user guide with features, navigation, and API reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment guide with troubleshooting
- **[CRON_SETUP_GUIDE.md](./supabase/CRON_SETUP_GUIDE.md)** - Automated data collection setup

---

## 🚀 Features

### Real-Time Network Dashboard
- **Live KPI Cards**: Total nodes, online status, storage metrics, health scores
- **Auto-Refresh**: Dashboard updates every 30 seconds automatically
- **Network Status Badge**: Visual health indicator with color-coded states
- **Historical Charts**: Storage utilization and node status trends

### Interactive Network Map
- **Geographic Visualization**: Global pNode distribution with clustering
- **Clickable Markers**: View individual node details on map
- **Health-Based Coloring**: Visual health status indicators
- **Real-Time Updates**: Live node status on map

### Advanced Node Management
- **Comprehensive Node List**: Paginated table with 200+ nodes
- **Multi-Filter Support**: Status, version, country, storage capacity
- **Global Search**: Search by pubkey, IP address, city, or country
- **Smart Sorting**: Multi-column sorting with rank calculation

### Individual Node Analytics
- **Detailed Metrics**: CPU, RAM, storage, uptime, network packets
- **Historical Charts**: Performance trends over time (24hr/7d/30d)
- **Status Tracking**: ONLINE/DEGRADED/OFFLINE/INVALID states
- **Health Score Evolution**: Track node health over time

### Hybrid Data Collection
- **Basic Stats**: Every 1 minute via `collect-pnode-stats`
- **Detailed Metrics**: Every hour via `collect-detailed-stats`
- **Public Node Focus**: Detailed stats for nodes with accessible RPC
- **Graceful Degradation**: Handles private/offline nodes elegantly

---

## ⚡ Quick Start

### Prerequisites
- **Bun** 1.0+ or Node.js 20+
- **Supabase** account
- **Upstash Redis** account
- **PostgreSQL** database

### 1. Clone Repository
```bash
git clone <repository-url>
cd analytics.xandeum.network
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# See DEPLOYMENT.md for detailed setup
```

### 4. Database Setup
```bash
# Deploy database schema
bunx prisma migrate deploy

# Generate Prisma client
bunx prisma generate
```

### 5. Start Development Server
```bash
bun dev
```

Visit `http://localhost:3000` to see the dashboard! 🎉

---

## 🌐 RPC Integration

### pRPC Methods Used

#### 1. `get-pods-with-stats`
**Purpose**: Retrieve all pNodes with basic statistics

**Endpoint**: Bootstrap node RPC
```
http://173.212.207.32:6000/rpc
```

**Response Data**:
- `pubkey`: Node public key
- `address`: IP:port combination
- `version`: pNode software version
- `is_public`: RPC accessibility
- `storage_committed`: Total storage pledged
- `storage_used`: Actual storage utilized
- `storage_usage_percent`: Utilization percentage
- `uptime`: Node uptime in seconds
- `last_seen_timestamp`: Unix timestamp
- `rpc_port`: RPC endpoint port

**Usage**: Called every minute by `collect-pnode-stats`

#### 2. `get-stats`
**Purpose**: Fetch detailed metrics from individual nodes

**Endpoint**: Per-node RPC
```
http://{node_ip}:{rpc_port}/rpc
```

**Response Data**:
- `cpu_percent`: CPU utilization
- `ram_used`: Memory used in bytes
- `ram_total`: Total memory in bytes
- `active_streams`: Active data streams
- `packets_received`: Network packets received
- `packets_sent`: Network packets sent
- `total_bytes`: Total data transferred
- `total_pages`: Storage pages
- `current_index`: Current storage index

**Usage**: Called hourly for public nodes by `collect-detailed-stats`

#### 3. `get-pods`
**Purpose**: Lightweight node discovery

**Endpoint**: Bootstrap node RPC

**Response Data**:
- `pubkey`: Node public key
- `address`: IP:port
- `version`: Software version
- `last_seen_timestamp`: Last activity

**Usage**: Minimal overhead network discovery

### RPC Client Configuration

```typescript
const prpcClient = new PRPCClient({
  bootstrapUrl: "http://173.212.207.32:6000/rpc",
  fallbackUrls: [
    "http://152.53.155.15:6000/rpc",
    "http://77.53.105.8:6000/rpc"
  ],
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  enableLogging: true
});
```

---

## 🏗️ Architecture

Complete technical architecture with detailed diagrams covering:

- **System Architecture**: Frontend, API, edge functions, database, and cron layers
- **Data Flow**: Complete data collection and processing pipeline
- **Frontend Routes**: Page structure and component architecture
- **Backend APIs**: RESTful endpoints with caching strategy
- **Edge Functions**: Automated data collection workflow
- **Redis Caching**: Performance optimization strategy
- **Database Schema**: Tables, relations, and indexes
- **Cron Scheduling**: Automated job execution timeline

📘 **[View Complete Architecture Documentation →](./ARCHITECTURE.md)**

---

## 🛠️ Tech Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0 | React framework with App Router |
| **React** | 19.2 | UI library with latest features |
| **TypeScript** | 5.0 | Type-safe development |
| **TailwindCSS** | 4.0 | Utility-first styling |
| **shadcn/ui** | Latest | Accessible component library |
| **Radix UI** | Latest | Primitive UI components |
| **React Query** | 5.90 | Data fetching & caching |
| **Recharts** | 3.6 | Interactive charts |
| **Leaflet** | 1.9.4 | Interactive maps |
| **Framer Motion** | 12.23 | Smooth animations |
| **date-fns** | 4.1 | Date manipulation |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **Bun** | 1.0+ | Fast package manager & runtime |
| **Prisma** | 7.1 | Type-safe ORM |
| **PostgreSQL** | Latest | Relational database |
| **Supabase** | Latest | Database hosting & edge functions |
| **Deno** | 2.6 | Edge function runtime |
| **Upstash Redis** | Latest | Serverless caching |
| **Axios** | 1.13 | HTTP client |

### Infrastructure & DevOps
| Service | Purpose |
|---------|---------|
| **Supabase** | Database hosting & edge functions |
| **Vercel** | Frontend hosting & deployment |
| **Upstash** | Redis caching layer |
| **IP Geolocation API** | Geographic enrichment |
| **pg_cron** | PostgreSQL-based job scheduler |
| **Prisma Accelerate** | Connection pooling & caching |

---

## 🔑 Key Highlights

### Scalability & Performance
- **200+ Nodes**: Efficiently handles large-scale monitoring
- **Batch Processing**: 50 nodes per batch for detailed stats
- **Connection Pooling**: Prisma with optimized database connections
- **Redis Caching**: 30-300s TTL for API responses
- **Smart Indexing**: Optimized database queries with strategic indexes

### Reliability & Resilience
- **Multi-Node Fallback**: Bootstrap + fallback pRPC endpoints
- **Retry Logic**: 3 attempts with exponential backoff
- **Error Handling**: Graceful degradation for private/offline nodes
- **Data Validation**: Strict validation before database insertion
- **Transaction Safety**: Atomic operations with rollback support

### Data Quality
- **Geo-Enrichment**: IP-based location with country/city/coordinates
- **Health Scoring**: Intelligent algorithm (storage 40% + uptime 40% + freshness 20%)
- **Historical Tracking**: Complete time-series data preservation
- **Duplicate Handling**: Unique constraints on pubkey and composite keys
- **Invalid Node Management**: Separate tracking for incomplete data

### User Experience
- **Real-Time Updates**: Auto-refresh every 30 seconds
- **Interactive Map**: Clustered markers with popups
- **Advanced Filtering**: Multi-criteria search and filtering
- **Responsive Design**: Mobile-first with TailwindCSS
- **Loading States**: Skeleton screens for better UX

---
