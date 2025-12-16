
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

  try {
    if (enableLogging) {
      console.log(`[GEO] Fetching geo data for ${ip}`);
    }

    // Use ipapi.co free tier
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      method: "GET",
      headers: {
        "User-Agent": "xandeum-analytics/1.0",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`ipapi.co returned ${response.status}`);
    }

    const data: IPAPIResponse = await response.json();

    if (data.error) {
      console.error(`[GEO] API error for ${ip}: ${data.reason}`);
      return getNullGeoLocation();
    }

    const geoLocation: GeoLocation = {
      country: data.country_name || null,
      countryCode: data.country_code || null,
      city: data.city || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };

    GEO_CACHE.set(ipAddress, geoLocation);

    if (enableLogging) {
      console.log(
        `[GEO] Success: ${ip} → ${geoLocation.city}, ${geoLocation.country}`
      );
    }

    return geoLocation;
  } catch (error) {
    console.error(`[GEO] Failed to fetch geo data for ${ip}:`, error);
    return getNullGeoLocation();
  }
}

export async function batchGetGeoLocations(
  ipAddresses: string[],
  enableLogging = false
): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();

  const BATCH_SIZE = 5;
  const BATCH_DELAY = 1000; // 1 second between batches

  for (let i = 0; i < ipAddresses.length; i += BATCH_SIZE) {
    const batch = ipAddresses.slice(i, i + BATCH_SIZE);

    if (enableLogging) {
      console.log(
        `[GEO] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ipAddresses.length / BATCH_SIZE)}`
      );
    }

    const promises = batch.map(async (ip) => {
      const geo = await getGeoLocation(ip, enableLogging);
      results.set(ip, geo);
    });

    await Promise.all(promises);

    if (i + BATCH_SIZE < ipAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

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

export function needsGeoRefresh(
  existingGeo: GeoLocation | null,
  ipAddress: string
): boolean {

  if (!existingGeo || !existingGeo.country) {
    return true;
  }

  return !GEO_CACHE.has(ipAddress);
}
