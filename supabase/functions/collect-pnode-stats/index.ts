
import { createClient } from "@supabase/supabase-js";
import { prpcClient } from "@/prpc-client";
import { calculateHealthScore, getHealthStatus } from "@/health-score";
import { batchGetGeoLocations } from "@/geo-enrichment";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PNodeRecord {
  pubkey: string;
  ip_address: string;
  gossip_port: number;
  rpc_port: number;
  gossip_address: string | null;
  is_public: boolean;
  version: string;
  status: string;
  storage_committed: string;
  storage_used: string;
  storage_usage_percent: number;
  uptime: number;
  last_seen_timestamp: number;
  last_seen_at: string;
  first_seen_at?: string;
  updated_at?: string;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  health_score: number;
}

interface NetworkRecord {
  id: string;
  timestamp: string;
  total_pnodes: number;
  online_pnodes: number;
  degraded_pnodes: number;
  offline_pnodes: number;
  total_storage_committed: string;
  total_storage_used: string;
  avg_storage_usage_percent: number;
  avg_uptime: number;
  network_health_score: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[STATS] Starting collection...");
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[STATS] Fetching pNodes from network...");
    const result = await prpcClient.getPodsWithStats();
    console.log(`[STATS] Retrieved ${result.total_count} pNodes`);

    if (!result.pods || result.pods.length === 0) {
      throw new Error("No pNodes returned from network");
    }

    const validPods: typeof result.pods = [];
    const invalidPods: typeof result.pods = [];
    
    result.pods.forEach(pod => {
      if (pod.pubkey && pod.pubkey.trim() !== '' && pod.address && pod.address.trim() !== '') {
        validPods.push(pod);
      } else {
        invalidPods.push(pod);
      }
    });
    
    console.log(`[STATS] ${validPods.length} valid, ${invalidPods.length} invalid pNodes`);

    const now = new Date().toISOString();
    const pnodesData: PNodeRecord[] = [];

    console.log("[STATS] Fetching existing pNodes from database...");
    const { data: existingPNodes } = await supabase
      .from("pnodes")
      .select("pubkey, id, country, country_code, city, latitude, longitude, ip_address, gossip_port, status")
      .returns<Array<{ 
        pubkey: string; 
        id: string; 
        country: string | null; 
        country_code: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        ip_address: string;
        gossip_port: number;
        status: string;
      }>>();

    const existingPNodesMap = new Map(
      (existingPNodes || []).map((p) => [p.pubkey, p])
    );

    const existingInvalidByAddress = new Map(
      (existingPNodes || [])
        .filter(p => p.status === 'INVALID')
        .map((p) => [`${p.ip_address}:${p.gossip_port}`, p])
    );
    
    console.log(`[STATS] Found ${existingPNodesMap.size} existing pNodes in database`);
    console.log(`[STATS] Found ${existingInvalidByAddress.size} existing INVALID pNodes`);

    const existingWithCompleteGeo = Array.from(existingPNodesMap.values()).filter(p => 
      p.country && p.country_code && p.city && p.latitude !== null && p.longitude !== null
    ).length;
    console.log(`[STATS] ${existingWithCompleteGeo} existing pNodes have complete geo data`);

    const ipsNeedingGeo = validPods
      .filter((pod) => {
        const existing = existingPNodesMap.get(pod.pubkey);
        const currentIP = pod.address.split(':')[0];
        
        // Only enrich if:
        // 1) No existing record
        // 2) Missing ANY geo field (incomplete data)
        // 3) IP address changed (need to refresh geo)
        if (!existing) return true;
        
        const hasCompleteGeo = existing.country && existing.country_code && 
                              existing.city && existing.latitude !== null && 
                              existing.longitude !== null;
        
        if (!hasCompleteGeo) return true;
        if (existing.ip_address !== currentIP) return true;
        
        return false;
      })
      .map((pod) => pod.address);

    console.log(`[STATS] Enriching geo data for ${ipsNeedingGeo.length} IPs...`);
    const geoDataMap = ipsNeedingGeo.length > 0
      ? await batchGetGeoLocations(ipsNeedingGeo, true)
      : new Map();

    if (geoDataMap.size > 0) {
      const [firstIP, firstGeo] = Array.from(geoDataMap.entries())[0];
      console.log(`[STATS] Sample geo data for ${firstIP}:`, JSON.stringify(firstGeo));
    }

    // Handle pods that were INVALID but now became VALID
    // Delete the old INVALID record - the valid pod will be inserted with correct pubkey
    const transitionedPods: string[] = [];
    for (const pod of validPods) {
      const address = pod.address;
      const existingInvalid = existingInvalidByAddress.get(address);
      
      if (existingInvalid && existingInvalid.pubkey !== pod.pubkey) {
        console.log(`[STATS] Pod ${address} transitioned from INVALID (${existingInvalid.pubkey}) to VALID (${pod.pubkey})`);
        transitionedPods.push(existingInvalid.pubkey);
      }
    }
    
    if (transitionedPods.length > 0) {
      console.log(`[STATS] Deleting ${transitionedPods.length} invalid records that became valid...`);
      const { error: deleteError } = await supabase
        .from("pnodes")
        .delete()
        .in("pubkey", transitionedPods);
      
      if (deleteError) {
        console.error(`[STATS] Error deleting transitioned pods:`, deleteError);
      }
    }

    for (const pod of validPods) {
      const lastSeenAt = new Date(pod.last_seen_timestamp * 1000);
      const lastSeenMinutes = (Date.now() - lastSeenAt.getTime()) / 1000 / 60;

      const healthScore = calculateHealthScore({
        storageUsagePercent: pod.storage_usage_percent,
        uptime: pod.uptime,
        lastSeenMinutes,
      });

      const status = getHealthStatus(healthScore);

      const [ipAddress, portStr] = pod.address.split(":");
      const gossipPort = parseInt(portStr) || 9001;

      const existing = existingPNodesMap.get(pod.pubkey);
      const geoData = geoDataMap.get(pod.address);
      
      // Determine final geo data: use API data if available, otherwise preserve ALL existing data
      let finalGeoData;
      if (geoData) {
        finalGeoData = {
          country: geoData.country,
          countryCode: geoData.countryCode,
          city: geoData.city,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
        };
      } else if (existing) {
        finalGeoData = {
          country: existing.country,
          countryCode: existing.country_code,
          city: existing.city,
          latitude: existing.latitude,
          longitude: existing.longitude,
        };
      } else {
        finalGeoData = {
          country: null,
          countryCode: null,
          city: null,
          latitude: null,
          longitude: null,
        };
      }

      const pnodeRecord: PNodeRecord = {
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
        first_seen_at: lastSeenAt.toISOString(),
        updated_at: now,
        latitude: finalGeoData.latitude,
        longitude: finalGeoData.longitude,
        country: finalGeoData.country,
        country_code: finalGeoData.countryCode,
        city: finalGeoData.city,
        health_score: healthScore,
      };

      pnodesData.push(pnodeRecord);
    }

    for (const pod of invalidPods) {
      const lastSeenAt = new Date((pod.last_seen_timestamp || Date.now() / 1000) * 1000);
      const address = pod.address?.trim() || '0.0.0.0:0';
      const [ipAddress, portStr] = address.split(':');
      const gossipPort = parseInt(portStr) || 0;
      
      const existingInvalid = existingInvalidByAddress.get(address);
      const pubkey = existingInvalid?.pubkey || 
                     pod.pubkey?.trim() || 
                     `INVALID_${ipAddress}_${gossipPort}`;
      
      pnodesData.push({
        pubkey: pubkey,
        ip_address: ipAddress || '0.0.0.0',
        gossip_port: gossipPort,
        rpc_port: pod.rpc_port || 6000,
        gossip_address: address,
        is_public: pod.is_public === true,
        version: (pod.version || 'unknown').substring(0, 20),
        status: 'INVALID',
        storage_committed: String(pod.storage_committed || 0),
        storage_used: String(pod.storage_used || 0),
        storage_usage_percent: pod.storage_usage_percent || 0,
        uptime: pod.uptime || 0,
        last_seen_timestamp: pod.last_seen_timestamp || Math.floor(Date.now() / 1000),
        last_seen_at: lastSeenAt.toISOString(),
        first_seen_at: lastSeenAt.toISOString(),
        updated_at: now,
        latitude: null,
        longitude: null,
        country: null,
        country_code: null,
        city: null,
        health_score: 0,
      });
    }

    const uniquePNodesMap = new Map<string, PNodeRecord>();
    pnodesData.forEach(pnode => uniquePNodesMap.set(pnode.pubkey, pnode));
    const uniquePNodesData = Array.from(uniquePNodesMap.values());
    
    console.log(`[STATS] Upserting ${uniquePNodesData.length} unique pNodes (from ${pnodesData.length} total)...`);
    const { error: upsertError } = await supabase
      .from("pnodes")
      .upsert(uniquePNodesData, {
        onConflict: "pubkey",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      throw new Error(`Failed to upsert pNodes: ${upsertError.message}`);
    }

    const validPNodesForStats = pnodesData.filter(p => p.status !== 'INVALID');
    const onlineCount = validPNodesForStats.filter((p) => p.status === "ONLINE").length;
    const degradedCount = validPNodesForStats.filter((p) => p.status === "DEGRADED").length;
    const offlineCount = validPNodesForStats.filter((p) => p.status === "OFFLINE").length;
    const invalidCount = pnodesData.filter((p) => p.status === "INVALID").length;

    const totalStorageCommitted = validPNodesForStats.reduce(
      (sum, p) => sum + BigInt(p.storage_committed),
      BigInt(0)
    );
    const totalStorageUsed = validPNodesForStats.reduce(
      (sum, p) => sum + BigInt(p.storage_used),
      BigInt(0)
    );
    const avgStorageUsagePercent =
      validPNodesForStats.reduce((sum, p) => sum + p.storage_usage_percent, 0) /
      (validPNodesForStats.length || 1);
    const avgUptime =
      validPNodesForStats.reduce((sum, p) => sum + p.uptime, 0) / (validPNodesForStats.length || 1);

    const networkHealthScore = validPNodesForStats.length > 0 ? Math.round(
      validPNodesForStats.reduce((sum, p) => sum + p.health_score, 0) / validPNodesForStats.length
    ) : 0;

    const networkRecord: NetworkRecord = {
      id: 'singleton',
      timestamp: now,
      total_pnodes: result.total_count,
      online_pnodes: onlineCount,
      degraded_pnodes: degradedCount,
      offline_pnodes: offlineCount,
      total_storage_committed: String(totalStorageCommitted),
      total_storage_used: String(totalStorageUsed),
      avg_storage_usage_percent: avgStorageUsagePercent,
      avg_uptime: Math.round(avgUptime),
      network_health_score: networkHealthScore,
    };

    console.log("[STATS] Upserting network singleton...");
    const { error: networkError } = await supabase
      .from("network")
      .upsert(networkRecord, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (networkError) {
      throw new Error(`Failed to upsert network: ${networkError.message}`);
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      duration_ms: duration,
      timestamp: now,
      total_pnodes: result.total_count,
      online: onlineCount,
      degraded: degradedCount,
      offline: offlineCount,
      invalid_pnodes: invalidCount,
      geo_enriched: ipsNeedingGeo.length,
      network_health: networkHealthScore,
      storage_used_tb: (Number(totalStorageUsed) / 1024 / 1024 / 1024 / 1024).toFixed(2),
    };

    console.log("[STATS] Collection complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[STATS] Error:", error);
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
