/**
 * NearbyAttractions — Find things to do near the user's GPS position.
 * Uses Overpass API (OpenStreetMap) — free, no API key.
 */

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchNearbyAttractions, getGoogleMapsUrl, type NearbyPlace } from "@/lib/geo";
import { Navigation, Loader2, MapPin, LocateFixed, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Fix marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TYPE_EMOJI: Record<string, string> = {
  attraction: "🏛️",
  museum: "🏛️",
  viewpoint: "🌄",
  artwork: "🎨",
  gallery: "🖼️",
  park: "🌳",
  garden: "🌺",
  nature_reserve: "🌿",
  monument: "🗿",
  memorial: "🕊️",
  castle: "🏰",
  ruins: "🏚️",
  archaeological_site: "⛏️",
  fort: "🏰",
  temple: "🛕",
  church: "⛪",
  mosque: "🕌",
};

const userIcon = new L.DivIcon({
  className: "user-location-marker",
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#3b82f6;border:3px solid white;
    box-shadow:0 0 12px rgba(59,130,246,0.6);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const attractionIcon = new L.DivIcon({
  className: "attraction-marker",
  html: `<div style="
    width:24px;height:24px;border-radius:50%;
    background:#ef4444;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
    font-size:11px;
  ">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

interface NearbyAttractionsProps {
  /** Optional: center on destination instead of user GPS */
  destinationName?: string;
  destinationLat?: number;
  destinationLng?: number;
  className?: string;
}

export default function NearbyAttractions({
  destinationName,
  destinationLat,
  destinationLng,
  className = "",
}: NearbyAttractionsProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  // Use destination coords if provided, else user GPS
  const centerLat = destinationLat ?? userPos?.lat;
  const centerLng = destinationLng ?? userPos?.lng;

  const getUserLocation = () => {
    if (destinationLat && destinationLng) {
      // Using destination coords directly
      loadNearby(destinationLat, destinationLng);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        loadNearby(latitude, longitude);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location access denied. Please enable location permissions."
            : "Could not get your location. Try again."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const loadNearby = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchNearbyAttractions(lat, lng, 5000);
      setPlaces(results);
      if (results.length === 0) {
        setError("No attractions found nearby. Try a different area.");
      }
    } catch {
      setError("Failed to fetch nearby attractions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (destinationLat && destinationLng) {
      loadNearby(destinationLat, destinationLng);
    }
  }, [destinationLat, destinationLng]);

  // Initial state — prompt to find location
  if (!centerLat || !centerLng) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <LocateFixed className="h-10 w-10 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Discover Nearby Attractions</p>
          <p className="text-xs text-muted-foreground mb-4">
            Find temples, parks, museums and more near you
          </p>
          <Button onClick={getUserLocation} disabled={loading} className="gap-2">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Getting location...</>
            ) : (
              <><MapPin className="h-4 w-4" /> Find Near Me</>
            )}
          </Button>
          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Map */}
      <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: "250px" }}>
        <MapContainer center={[centerLat, centerLng]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={centerLat} lng={centerLng} />

          {/* User / destination marker */}
          <Marker position={[centerLat, centerLng]} icon={userIcon}>
            <Popup>{destinationName || "Your Location"}</Popup>
          </Marker>

          {/* Search radius circle */}
          <Circle center={[centerLat, centerLng]} radius={5000} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.05, weight: 1 }} />

          {/* Attraction markers */}
          {places.map((place) => (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={attractionIcon}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-bold text-sm">{TYPE_EMOJI[place.type] || "📍"} {place.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{place.type.replace(/_/g, " ")}</p>
                  {place.distance != null && (
                    <p className="text-xs text-gray-500">{place.distance < 1000 ? `${place.distance}m` : `${(place.distance / 1000).toFixed(1)}km`} away</p>
                  )}
                  <a
                    href={getGoogleMapsUrl(`${place.lat},${place.lng}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    <Navigation className="h-3 w-3" /> Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          {places.length} Nearby Attractions
        </h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => loadNearby(centerLat, centerLng)} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding attractions...
        </div>
      ) : error ? (
        <p className="text-xs text-muted-foreground text-center py-4">{error}</p>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {places.map((place) => (
            <a
              key={place.id}
              href={getGoogleMapsUrl(`${place.lat},${place.lng}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <span className="text-lg">{TYPE_EMOJI[place.type] || "📍"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{place.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{place.type.replace(/_/g, " ")}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {place.distance != null && (
                  <Badge variant="outline" className="text-[10px]">
                    {place.distance < 1000 ? `${place.distance}m` : `${(place.distance / 1000).toFixed(1)}km`}
                  </Badge>
                )}
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
