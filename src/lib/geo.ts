/**
 * Geocoding utility using OpenStreetMap Nominatim (free, no API key).
 * Converts location names → lat/lng coordinates.
 */

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

const CACHE = new Map<string, GeoResult | null>();

/**
 * Geocode a location string to coordinates.
 * Uses Nominatim with caching to avoid repeat requests.
 */
export async function geocode(query: string): Promise<GeoResult | null> {
  const key = query.trim().toLowerCase();
  if (CACHE.has(key)) return CACHE.get(key) ?? null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MargdarshiApp/1.0" },
    });

    if (!res.ok) {
      CACHE.set(key, null);
      return null;
    }

    const data = await res.json();
    if (!data.length) {
      CACHE.set(key, null);
      return null;
    }

    const result: GeoResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };

    CACHE.set(key, result);
    return result;
  } catch {
    CACHE.set(key, null);
    return null;
  }
}

/**
 * Geocode multiple locations in parallel with rate limiting.
 * Nominatim allows 1 request/second, so we batch with delays.
 */
export async function geocodeMultiple(
  queries: string[]
): Promise<Map<string, GeoResult>> {
  const results = new Map<string, GeoResult>();
  const uniqueQueries = [...new Set(queries.filter(Boolean))];

  for (let i = 0; i < uniqueQueries.length; i++) {
    const q = uniqueQueries[i];
    if (i > 0) await new Promise((r) => setTimeout(r, 300)); // rate limit
    const result = await geocode(q);
    if (result) results.set(q, result);
  }

  return results;
}

/**
 * Build a Google Maps directions URL for a location.
 */
export function getGoogleMapsUrl(location: string, destination?: string): string {
  const q = destination ? `${location}, ${destination}` : location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * Build a Google Maps directions URL between two points.
 */
export function getDirectionsUrl(from: string, to: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

/**
 * Fetch nearby attractions using Overpass API (OpenStreetMap).
 * Returns POIs within a radius of the given coordinates.
 */
export interface NearbyPlace {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distance?: number;
}

export async function fetchNearbyAttractions(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<NearbyPlace[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["tourism"~"attraction|museum|viewpoint|artwork|gallery"](around:${radiusMeters},${lat},${lng});
      node["historic"](around:${radiusMeters},${lat},${lng});
      node["leisure"~"park|garden|nature_reserve"](around:${radiusMeters},${lat},${lng});
    );
    out body 20;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) return [];
    const data = await res.json();

    const places: NearbyPlace[] = (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const dist = getDistanceKm(lat, lng, el.lat, el.lon);
        return {
          id: el.id,
          name: el.tags.name,
          type: el.tags.tourism || el.tags.historic || el.tags.leisure || "attraction",
          lat: el.lat,
          lng: el.lon,
          distance: Math.round(dist * 1000), // meters
        };
      })
      .sort((a: NearbyPlace, b: NearbyPlace) => (a.distance ?? 0) - (b.distance ?? 0));

    return places;
  } catch {
    return [];
  }
}

/** Haversine distance in km */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Known coordinates for popular Indian destinations (fallback when Nominatim is slow) */
export const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  goa: { lat: 15.4909, lng: 73.8278 },
  manali: { lat: 32.2396, lng: 77.1887 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  kerala: { lat: 10.8505, lng: 76.2711 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  varanasi: { lat: 25.3176, lng: 83.0068 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  darjeeling: { lat: 27.0360, lng: 88.2627 },
  amritsar: { lat: 31.6340, lng: 74.8723 },
  andaman: { lat: 11.7401, lng: 92.6586 },
  agra: { lat: 27.1767, lng: 78.0081 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  ooty: { lat: 11.4102, lng: 76.6950 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  pune: { lat: 18.5204, lng: 73.8567 },
};
