-- CreateEnum
CREATE TYPE "status" AS ENUM ('ONLINE', 'DEGRADED', 'OFFLINE');

-- CreateTable
CREATE TABLE "pnodes" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "pubkey" VARCHAR(44) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "gossip_port" INTEGER NOT NULL DEFAULT 9001,
    "rpc_port" INTEGER NOT NULL DEFAULT 6000,
    "gossip_address" VARCHAR(100),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "version" VARCHAR(20) NOT NULL DEFAULT '0.8.0',
    "status" "status" NOT NULL DEFAULT 'ONLINE',
    "storage_committed" BIGINT NOT NULL DEFAULT 0,
    "storage_used" BIGINT NOT NULL DEFAULT 0,
    "storage_usage_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uptime" INTEGER NOT NULL DEFAULT 0,
    "cpu_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ram_used" BIGINT NOT NULL DEFAULT 0,
    "ram_total" BIGINT NOT NULL DEFAULT 0,
    "last_seen_timestamp" INTEGER NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "country" VARCHAR(100),
    "country_code" VARCHAR(2),
    "city" VARCHAR(100),
    "health_score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pnodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pnode_stats" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pnode_id" UUID NOT NULL,
    "storage_committed" BIGINT NOT NULL,
    "storage_used" BIGINT NOT NULL,
    "storage_usage_percent" DOUBLE PRECISION NOT NULL,
    "cpu_percent" DOUBLE PRECISION,
    "ram_used" BIGINT,
    "ram_total" BIGINT,
    "uptime" INTEGER NOT NULL,
    "active_streams" INTEGER,
    "packets_received" BIGINT,
    "packets_sent" BIGINT,
    "total_bytes" BIGINT,
    "total_pages" INTEGER,
    "current_index" INTEGER,
    "health_score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pnode_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_stats" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_pnodes" INTEGER NOT NULL,
    "online_pnodes" INTEGER NOT NULL,
    "degraded_pnodes" INTEGER NOT NULL,
    "offline_pnodes" INTEGER NOT NULL,
    "total_storage_committed" BIGINT NOT NULL,
    "total_storage_used" BIGINT NOT NULL,
    "avg_storage_usage_percent" DOUBLE PRECISION NOT NULL,
    "avg_cpu_percent" DOUBLE PRECISION NOT NULL,
    "avg_ram_usage_percent" DOUBLE PRECISION NOT NULL,
    "avg_uptime" INTEGER NOT NULL,
    "total_active_streams" INTEGER NOT NULL,
    "total_packets" BIGINT NOT NULL,
    "network_health_score" INTEGER NOT NULL,

    CONSTRAINT "network_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pnodes_pubkey_key" ON "pnodes"("pubkey");

-- CreateIndex
CREATE INDEX "pnodes_pubkey_idx" ON "pnodes"("pubkey");

-- CreateIndex
CREATE INDEX "pnodes_status_idx" ON "pnodes"("status");

-- CreateIndex
CREATE INDEX "pnodes_version_idx" ON "pnodes"("version");

-- CreateIndex
CREATE INDEX "pnodes_last_seen_at_idx" ON "pnodes"("last_seen_at");

-- CreateIndex
CREATE INDEX "pnodes_ip_address_idx" ON "pnodes"("ip_address");

-- CreateIndex
CREATE INDEX "pnodes_country_idx" ON "pnodes"("country");

-- CreateIndex
CREATE INDEX "pnode_stats_pnode_id_timestamp_idx" ON "pnode_stats"("pnode_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "pnode_stats_timestamp_idx" ON "pnode_stats"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pnode_stats_pnode_id_timestamp_key" ON "pnode_stats"("pnode_id", "timestamp");

-- CreateIndex
CREATE INDEX "network_stats_timestamp_idx" ON "network_stats"("timestamp" DESC);

-- AddForeignKey
ALTER TABLE "pnode_stats" ADD CONSTRAINT "pnode_stats_pnode_id_fkey" FOREIGN KEY ("pnode_id") REFERENCES "pnodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
