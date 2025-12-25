
import { GeoLocation } from "./types";

interface IPAPIResponse {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
}

const GEO_CACHE = new Map<string, GeoLocation>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getGeoLocation(
  ipAddress: string,
  enableLogging = false
): Promise<GeoLocation> {
  const cached = GEO_CACHE.get(ipAddress);
  if (cached) {
    if (enableLogging) {
      console.log(`[GEO] Cache hit for ${ipAddress}`);
    }
    return cached;
  }

  const ip = ipAddress.split(":")[0];
  const apiKey = Deno.env.get("IP_API_KEY")

  try {
    if (enableLogging) {
      console.log(`[GEO] Fetching geo data for ${ip}`);
    }

    const response = await fetch(`http://api.ipapi.com/api/${ip}?access_key=${apiKey}`, {
      method: "GET",
    });

    if (!response.ok) {
      console.error(`[GEO] API error for ${ip}: HTTP ${response.status} ${response.statusText}`);
      return getNullGeoLocation();
    }

    const data: IPAPIResponse = await response.json();

    if (data.error) {
      console.error(`[GEO] API error for ${ip}: ${data.reason}`);
      return getNullGeoLocation();
    }

    const parseLatLng = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(parsed) ? null : parsed;
    };

    const geoLocation: GeoLocation = {
      country: data.country_name?.trim() || null,
      countryCode: data.country_code?.trim() || null,
      city: data.city?.trim() || null,
      latitude: parseLatLng(data.latitude),
      longitude: parseLatLng(data.longitude),
    };

    // Log if we got country but missing lat/lng (debugging)
    if (geoLocation.country && (geoLocation.latitude === null || geoLocation.longitude === null)) {
      console.warn(`[GEO] ${ip} has country "${geoLocation.country}" but missing coordinates. Raw data:`, JSON.stringify(data));
    }

    GEO_CACHE.set(ipAddress, geoLocation);

    if (enableLogging) {
      console.log(
        `[GEO] Success: ${ip} → ${geoLocation.city}, ${geoLocation.country}`
      );
    }

    return geoLocation;
  } catch (error) {
    console.error(`[GEO] Failed to fetch geo data for ${ip}:`, error.message || error);
    return getNullGeoLocation();
  }
}

export async function batchGetGeoLocations(
  ipAddresses: string[],
  enableLogging = false
): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  let successCount = 0;
  let failCount = 0;

  const BATCH_SIZE = 5;
  const BATCH_DELAY = 800; // 800ms between batches

  for (let i = 0; i < ipAddresses.length; i += BATCH_SIZE) {
    const batch = ipAddresses.slice(i, i + BATCH_SIZE);

    if (enableLogging && i % 50 === 0) {
      console.log(
        `[GEO] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ipAddresses.length / BATCH_SIZE)} (${successCount} successful, ${failCount} failed)`
      );
    }

    const promises = batch.map(async (ip) => {
      const geo = await getGeoLocation(ip, false);
      results.set(ip, geo);
      if (geo.country) {
        successCount++;
      } else {
        failCount++;
      }
    });

    await Promise.all(promises);

    if (i + BATCH_SIZE < ipAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }
  
  console.log(`[GEO] Batch complete: ${successCount} successful, ${failCount} failed out of ${ipAddresses.length} total`);

  return results;
}

function getNullGeoLocation(): GeoLocation {
  return {
    country: null,
    countryCode: null,
    city: null,
    latitude: null,
    longitude: null,
  };
}
