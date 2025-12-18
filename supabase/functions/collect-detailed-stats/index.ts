import { createClient } from "@supabase/supabase-js";
import { prpcClient } from "@/prpc-client";
import { calculateHealthScore, getHealthStatus } from "@/health-score";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 50; 
const INSERT_BATCH_SIZE = 1000; 

interface PNodeStatsRecord {
  pnode_id: string;
  timestamp: string;
  storage_committed: string;
  storage_used: string;
  storage_usage_percent: number;
  cpu_percent: number;
  ram_used: string;
  ram_total: string;
  uptime: number;
  active_streams: number;
  packets_received: string;
  packets_sent: string;
  total_bytes: string;
  total_pages: number;
  current_index: number | null;
  health_score: number;
}

interface NetworkStatsRecord {
  timestamp: string;
  total_pnodes: number;
  online_pnodes: number;
  degraded_pnodes: number;
  offline_pnodes: number;
  public_pnodes: number; 
  private_pnodes: number;
  detailed_stats_coverage: number;
  total_storage_committed: string;
  total_storage_used: string;
  avg_storage_usage_percent: number;
  avg_cpu_percent: number;
  avg_ram_usage_percent: number;
  avg_uptime: number;
  total_active_streams: number;
  total_packets_received: string;
  total_packets_sent: string;
  total_bytes: string;
  total_pages: number;
  network_health_score: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[DETAILED-STATS] Starting hourly hybrid stats collection...");
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    console.log("[DETAILED-STATS] Step 1: Fetching ALL nodes from network via get-pods-with-stats...");
    const podsResult = await prpcClient.getPodsWithStats();
    console.log(`[DETAILED-STATS] Retrieved ${podsResult.total_count} total nodes from network`);

    if (!podsResult.pods || podsResult.pods.length === 0) {
      throw new Error("No nodes returned from network");
    }

    const validPods: typeof podsResult.pods = [];
    const invalidPods: typeof podsResult.pods = [];
    
    podsResult.pods.forEach(pod => {
      if (pod.pubkey && pod.pubkey.trim() !== '' && pod.address && pod.address.trim() !== '') {
        validPods.push(pod);
      } else {
        invalidPods.push(pod);
      }
    });
    
    console.log(`[DETAILED-STATS] Validation: ${validPods.length} valid, ${invalidPods.length} invalid pods`);

    console.log("[DETAILED-STATS] Step 2: Updating pnodes table with ALL valid nodes...")
    const pnodesUpdates = validPods.map(pod => {
      const lastSeenAt = new Date(pod.last_seen_timestamp * 1000);
      const lastSeenMinutes = (Date.now() - lastSeenAt.getTime()) / 1000 / 60;
      
      const healthScore = calculateHealthScore({
        storageUsagePercent: pod.storage_usage_percent || 0,
        uptime: pod.uptime,
        lastSeenMinutes,
      });
      
      const status = getHealthStatus(healthScore);
      
      const [ipAddress, portStr] = pod.address.split(":");
      const gossipPort = parseInt(portStr) || 9001;
      
      return {
        pubkey: pod.pubkey,
        ip_address: ipAddress,
        gossip_port: gossipPort,
        rpc_port: pod.rpc_port,
        gossip_address: pod.address,
        is_public: pod.is_public === true,
        version: pod.version.substring(0, 20),
        status: status,
        storage_committed: String(pod.storage_committed || 0),
        storage_used: String(pod.storage_used || 0),
        storage_usage_percent: pod.storage_usage_percent || 0,
        uptime: pod.uptime,
        last_seen_timestamp: pod.last_seen_timestamp,
        last_seen_at: lastSeenAt.toISOString(),
        updated_at: now,
        health_score: healthScore,
      };
    });

    const uniquePNodesMap = new Map<string, typeof pnodesUpdates[0]>();
    pnodesUpdates.forEach(pnode => uniquePNodesMap.set(pnode.pubkey, pnode));
    const uniquePNodesUpdates = Array.from(uniquePNodesMap.values());
    
    if (pnodesUpdates.length !== uniquePNodesUpdates.length) {
      console.log(`[DETAILED-STATS] Removed ${pnodesUpdates.length - uniquePNodesUpdates.length} duplicate pubkey entries`);
    }

    if (uniquePNodesUpdates.length > 0) {
      const { error: pnodesError } = await supabase
        .from("pnodes")
        .upsert(uniquePNodesUpdates, {
          onConflict: "pubkey",
          ignoreDuplicates: false,
        });
      if (pnodesError) throw new Error(`Failed to update pnodes: ${pnodesError.message}`);
    }
    console.log(`[DETAILED-STATS] Updated ${uniquePNodesUpdates.length} pnodes in database`);

    const { data: existingPNodes } = await supabase
      .from("pnodes")
      .select("id, pubkey, is_public");

    const pnodeMap = new Map((existingPNodes || []).map(p => [p.pubkey, p]));

    console.log(`[DETAILED-STATS] Step 3: Inserting basic stats for ${validPods.length} valid nodes...`);
    const allBasicStats: PNodeStatsRecord[] = [];

    for (const pod of validPods) {
      const existingNode = pnodeMap.get(pod.pubkey);
      if (!existingNode) continue;

      const lastSeenMinutes = (Date.now() - pod.last_seen_timestamp * 1000) / 1000 / 60;

      const healthScore = calculateHealthScore({
        storageUsagePercent: pod.storage_usage_percent || 0,
        uptime: pod.uptime,
        lastSeenMinutes,
      });

      allBasicStats.push({
        pnode_id: existingNode.id,
        timestamp: now,
        storage_committed: String(pod.storage_committed || 0),
        storage_used: String(pod.storage_used || 0),
        storage_usage_percent: pod.storage_usage_percent || 0,
        cpu_percent: 0, 
        ram_used: "0",
        ram_total: "0",
        uptime: pod.uptime,
        active_streams: 0,
        packets_received: "0",
        packets_sent: "0",
        total_bytes: "0",
        total_pages: 0,
        current_index: null,
        health_score: healthScore,
      });
    }

    const uniqueStatsMap = new Map<string, PNodeStatsRecord>();
    allBasicStats.forEach(stat => uniqueStatsMap.set(stat.pnode_id, stat));
    const uniqueBasicStats = Array.from(uniqueStatsMap.values());
    
    if (allBasicStats.length !== uniqueBasicStats.length) {
      console.log(`[DETAILED-STATS] Removed ${allBasicStats.length - uniqueBasicStats.length} duplicate pnode_id entries`);
    }

    if (uniqueBasicStats.length > 0) {
      for (let i = 0; i < uniqueBasicStats.length; i += INSERT_BATCH_SIZE) {
        const batch = uniqueBasicStats.slice(i, i + INSERT_BATCH_SIZE);
        const { error } = await supabase.from("pnode_stats").upsert(batch, {
          onConflict: "pnode_id,timestamp",
          ignoreDuplicates: false,
        });
        if (error) throw new Error(`Failed to upsert basic stats: ${error.message}`);
      }
    }
    console.log(`[DETAILED-STATS] Upserted ${uniqueBasicStats.length} basic stats records`);

    const publicNodes = (existingPNodes || []).filter(node =>
      node.is_public === true &&
      pnodeMap.has(node.pubkey)
    );
    console.log(`[DETAILED-STATS] Step 4: Found ${publicNodes.length} public nodes out of ${existingPNodes?.length || 0} total`);

    const { data: activePNodes } = await supabase
      .from("pnodes")
      .select("id, pubkey, ip_address, rpc_port, storage_committed, storage_used, storage_usage_percent, uptime, health_score, last_seen_at")
      .eq("is_public", true)
      .eq("status", "ONLINE");

    console.log(`[DETAILED-STATS] ${activePNodes?.length || 0} public nodes are ONLINE (status field)`);

    console.log("[DETAILED-STATS] Step 5: Fetching detailed stats for public nodes...");
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < activePNodes.length; i += BATCH_SIZE) {
      const batch = activePNodes.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(activePNodes.length / BATCH_SIZE);

      console.log(`[DETAILED-STATS] Processing batch ${batchNum}/${totalBatches} (${batch.length} nodes)...`);

      const updates = await Promise.allSettled(
        batch.map(async (pnode) => {
          try {
            const nodeUrl = `http://${pnode.ip_address}:${pnode.rpc_port}/rpc`;
            const stats = await prpcClient.getStats(nodeUrl);

            const { error } = await supabase
              .from("pnode_stats")
              .update({
                cpu_percent: stats.cpu_percent || 0,
                ram_used: String(stats.ram_used || 0),
                ram_total: String(stats.ram_total || 0),
                active_streams: stats.active_streams || 0,
                packets_received: String(stats.packets_received || 0),
                packets_sent: String(stats.packets_sent || 0),
                total_bytes: String(stats.total_bytes || 0),
                total_pages: stats.total_pages || 0,
                current_index: stats.current_index || null,
              })
              .eq("pnode_id", pnode.id)
              .eq("timestamp", now);

            if (error) throw error;
            return { success: true, pubkey: pnode.pubkey };
          } catch (error) {
            if (!error.message?.includes("404")) {
              console.error(`[DETAILED-STATS] Failed for ${pnode.pubkey}:`, error.message);
            }
            return { success: false, pubkey: pnode.pubkey };
          }
        })
      );

      updates.forEach((result) => {
        if (result.status === "fulfilled" && result.value.success) {
          totalSuccess++;
        } else {
          totalFailed++;
        }
      });
    }

    console.log(`[DETAILED-STATS] Detailed stats collection complete: ${totalSuccess} success, ${totalFailed} failed`);

    console.log("[DETAILED-STATS] Step 6: Updating network singleton...");
    const allNodes = validPods;
    const onlineCount = allNodes.filter(p => {
      const lastSeenMin = (Date.now() - p.last_seen_timestamp * 1000) / 1000 / 60;
      return lastSeenMin < 5;
    }).length;

    const totalStorage = allNodes.reduce((sum, p) => sum + BigInt(p.storage_committed || 0), BigInt(0));
    const totalUsed = allNodes.reduce((sum, p) => sum + BigInt(p.storage_used || 0), BigInt(0));
    const avgUsage = allNodes.reduce((sum, p) => sum + (p.storage_usage_percent || 0), 0) / allNodes.length;
    const avgUptime = allNodes.reduce((sum, p) => sum + p.uptime, 0) / allNodes.length;
    const avgHealth = allNodes.reduce((sum, p) => {
      const lastSeenMin = (Date.now() - p.last_seen_timestamp * 1000) / 1000 / 60;
      return sum + calculateHealthScore({ storageUsagePercent: p.storage_usage_percent || 0, uptime: p.uptime, lastSeenMinutes: lastSeenMin });
    }, 0) / allNodes.length;

    await supabase.from("network").upsert({
      id: "singleton",
      timestamp: now,
      total_pnodes: validPods.length,
      online_pnodes: onlineCount,
      degraded_pnodes: 0,
      offline_pnodes: validPods.length - onlineCount,
      total_storage_committed: String(totalStorage),
      total_storage_used: String(totalUsed),
      avg_storage_usage_percent: avgUsage,
      avg_uptime: Math.round(avgUptime),
      network_health_score: Math.round(avgHealth),
    }, { onConflict: "id" });

    console.log("[DETAILED-STATS] Step 7: Computing and inserting network stats...");

    const { data: detailedStats } = await supabase
      .from("pnode_stats")
      .select("*")
      .eq("timestamp", now)
      .not("cpu_percent", "is", null);

    const privateNodesCount = validPods.length - publicNodes.length;
    const coverage = (publicNodes.length / validPods.length) * 100;

    let networkStatsRecord: NetworkStatsRecord;

    if (detailedStats && detailedStats.length > 0) {
      const avgCpu = detailedStats.reduce((sum, s) => sum + (s.cpu_percent || 0), 0) / detailedStats.length;
      const avgRam = detailedStats.reduce((sum, s) => {
        const used = Number(s.ram_used || 0);
        const total = Number(s.ram_total || 1);
        return sum + (total > 0 ? (used / total) * 100 : 0);
      }, 0) / detailedStats.length;

      networkStatsRecord = {
        timestamp: now,
        total_pnodes: validPods.length,
        online_pnodes: onlineCount,
        degraded_pnodes: 0,
        offline_pnodes: validPods.length - onlineCount,
        public_pnodes: publicNodes.length,
        private_pnodes: privateNodesCount,
        detailed_stats_coverage: coverage,
        total_storage_committed: String(totalStorage),
        total_storage_used: String(totalUsed),
        avg_storage_usage_percent: avgUsage,
        avg_cpu_percent: avgCpu,
        avg_ram_usage_percent: avgRam,
        avg_uptime: Math.round(avgUptime),
        total_active_streams: detailedStats.reduce((sum, s) => sum + (s.active_streams || 0), 0),
        total_packets_received: String(detailedStats.reduce((sum, s) => sum + BigInt(s.packets_received || 0), BigInt(0))),
        total_packets_sent: String(detailedStats.reduce((sum, s) => sum + BigInt(s.packets_sent || 0), BigInt(0))),
        total_bytes: String(detailedStats.reduce((sum, s) => sum + BigInt(s.total_bytes || 0), BigInt(0))),
        total_pages: detailedStats.reduce((sum, s) => sum + (s.total_pages || 0), 0),
        network_health_score: Math.round(avgHealth),
      };
    } else {
      networkStatsRecord = {
        timestamp: now,
        total_pnodes: validPods.length,
        online_pnodes: onlineCount,
        degraded_pnodes: 0,
        offline_pnodes: validPods.length - onlineCount,
        public_pnodes: publicNodes.length,
        private_pnodes: privateNodesCount,
        detailed_stats_coverage: coverage,
        total_storage_committed: String(totalStorage),
        total_storage_used: String(totalUsed),
        avg_storage_usage_percent: avgUsage,
        avg_cpu_percent: 0,
        avg_ram_usage_percent: 0,
        avg_uptime: Math.round(avgUptime),
        total_active_streams: 0,
        total_packets_received: "0",
        total_packets_sent: "0",
        total_bytes: "0",
        total_pages: 0,
        network_health_score: Math.round(avgHealth),
      };
    }

    const { error: networkError } = await supabase.from("network_stats").insert(networkStatsRecord);
    if (networkError) throw new Error(`Failed to insert network stats: ${networkError.message}`);

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      duration_ms: duration,
      duration_seconds: Math.round(duration / 1000),
      timestamp: now,
      total_nodes: validPods.length,
      invalid_nodes: invalidPods.length,
      public_nodes: publicNodes.length,
      private_nodes: privateNodesCount,
      active_public_nodes: activePNodes.length,
      detailed_stats_collected: totalSuccess,
      detailed_stats_failed: totalFailed,
      detailed_stats_coverage: `${coverage.toFixed(1)}%`,
      basic_stats_for_all_nodes: allBasicStats.length,
    };

    console.log("[DETAILED-STATS] Hybrid collection complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[DETAILED-STATS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
