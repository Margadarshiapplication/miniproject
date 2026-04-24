/**
 * TripMap — Interactive Leaflet map showing activity pins for a trip.
 * Uses OpenStreetMap tiles (free, no API key).
 */

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocode, getGoogleMapsUrl, KNOWN_COORDS, type GeoResult } from "@/lib/geo";
import { ExternalLink, Navigation } from "lucide-react";

// Fix Leaflet default marker icons (broken in bundlers)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom colored markers for different time slots
const createColoredIcon = (color: string) =>
  new L.DivIcon({
    className: "custom-map-marker",
    html: `<div style="
      background:${color};
      width:28px;height:28px;border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:white;font-weight:700;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

const SLOT_COLORS: Record<string, string> = {
  morning: "#f59e0b",
  afternoon: "#3b82f6",
  evening: "#8b5cf6",
};

const createNumberedIcon = (num: number, color: string) =>
  new L.DivIcon({
    className: "custom-map-marker",
    html: `<div style="
      background:${color};
      width:30px;height:30px;border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;color:white;font-weight:800;
    ">${num}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });

interface ActivityPin {
  title: string;
  location: string;
  time_slot?: string;
  estimated_cost?: number;
  day_number?: number;
  coords?: GeoResult;
}

interface TripMapProps {
  destination: string;
  activities: ActivityPin[];
  className?: string;
  height?: string;
}

/** Component that fits the map to show all markers */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [coords, map]);
  return null;
}

export default function TripMap({ destination, activities, className = "", height = "300px" }: TripMapProps) {
  const [pins, setPins] = useState<(ActivityPin & { coords: GeoResult })[]>([]);
  const [destCoords, setDestCoords] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCoords() {
      setLoading(true);

      // Get destination center
      const destKey = destination.toLowerCase().replace(/\s+/g, "");
      let center: GeoResult | null = null;
      if (KNOWN_COORDS[destKey]) {
        const kc = KNOWN_COORDS[destKey];
        center = { lat: kc.lat, lng: kc.lng, displayName: destination };
      } else {
        center = await geocode(destination);
      }
      if (cancelled) return;
      setDestCoords(center);

      // Geocode each activity location
      const resolved: (ActivityPin & { coords: GeoResult })[] = [];
      for (const act of activities) {
        if (!act.location) continue;
        const searchQuery = `${act.location}, ${destination}`;
        const result = await geocode(searchQuery);
        if (cancelled) return;
        if (result) {
          resolved.push({ ...act, coords: result });
        }
        // Small delay for Nominatim rate limiting
        await new Promise((r) => setTimeout(r, 250));
      }

      if (!cancelled) {
        setPins(resolved);
        setLoading(false);
      }
    }

    loadCoords();
    return () => { cancelled = true; };
  }, [destination, activities]);

  const allCoords = useMemo<[number, number][]>(() => {
    const coords: [number, number][] = pins.map((p) => [p.coords.lat, p.coords.lng]);
    if (destCoords && coords.length === 0) coords.push([destCoords.lat, destCoords.lng]);
    return coords;
  }, [pins, destCoords]);

  const center: [number, number] = destCoords
    ? [destCoords.lat, destCoords.lng]
    : [20.5937, 78.9629]; // India center fallback

  if (loading) {
    return (
      <div className={`rounded-xl overflow-hidden border bg-muted/30 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border shadow-sm ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allCoords.length > 1 && <FitBounds coords={allCoords} />}

        {pins.map((pin, i) => {
          const color = SLOT_COLORS[pin.time_slot || ""] || "#10b981";
          const icon = createNumberedIcon(i + 1, color);
          return (
            <Marker key={`${pin.title}-${i}`} position={[pin.coords.lat, pin.coords.lng]} icon={icon}>
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-bold text-sm mb-1">{pin.title}</p>
                  <p className="text-xs text-gray-500 mb-1">📍 {pin.location}</p>
                  {pin.time_slot && <p className="text-xs text-gray-500">🕐 {pin.time_slot}</p>}
                  {pin.estimated_cost != null && pin.estimated_cost > 0 && (
                    <p className="text-xs text-gray-500">💰 ₹{pin.estimated_cost}</p>
                  )}
                  <a
                    href={getGoogleMapsUrl(pin.location, destination)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    <Navigation className="h-3 w-3" /> Get Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      {pins.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg px-2 py-1.5 text-[10px] flex gap-3 z-[1000] shadow">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Morning</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Afternoon</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Evening</span>
        </div>
      )}
    </div>
  );
}
