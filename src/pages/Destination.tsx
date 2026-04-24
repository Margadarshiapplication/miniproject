import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Thermometer, Wallet, Lightbulb, Activity, Map, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { destinations } from "@/data/destinations";
import { useState, lazy, Suspense } from "react";
import { KNOWN_COORDS, getGoogleMapsUrl } from "@/lib/geo";

const NearbyAttractions = lazy(() => import("@/components/NearbyAttractions"));

const MapFallback = () => (
  <div className="rounded-xl border bg-muted/30 flex items-center justify-center h-[200px]">
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs">Loading map...</span>
    </div>
  </div>
);

const Destination = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  const dest = destinations.find((d) => d.id === id);

  if (!dest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-semibold">Destination not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/discover")}>
          Back to Discover
        </Button>
      </div>
    );
  }

  // Get known coordinates for the destination
  const coords = KNOWN_COORDS[dest.id] || null;

  return (
    <div className="pb-6">
      {/* Hero Image */}
      <div className="relative h-56">
        <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <button
          className="absolute top-4 left-4 rounded-full bg-background/80 p-2 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          className="absolute top-4 right-4 rounded-full bg-background/80 p-2 backdrop-blur-sm"
          onClick={() => setWishlisted(!wishlisted)}
        >
          <Heart className={`h-5 w-5 ${wishlisted ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white font-heading">{dest.name}</h1>
          <p className="text-sm text-white/80">{dest.tagline}</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="flex flex-col items-center p-3 gap-1">
              <Thermometer className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold">{dest.weather.temp}</span>
              <span className="text-[10px] text-muted-foreground">{dest.weather.condition}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3 gap-1">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">{dest.costEstimate.daily}</span>
              <span className="text-[10px] text-muted-foreground">per day</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3 gap-1">
              <Activity className="h-4 w-4 text-accent-foreground" />
              <span className="text-xs font-semibold">{dest.activities.length}</span>
              <span className="text-[10px] text-muted-foreground">activities</span>
            </CardContent>
          </Card>
        </div>

        {/* Open in Google Maps */}
        <a
          href={getGoogleMapsUrl(dest.name, "India")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          <Map className="h-4 w-4" /> View {dest.name} on Google Maps
          <Navigation className="h-3 w-3 opacity-50" />
        </a>

        {/* Overview */}
        <div>
          <h2 className="text-base font-bold font-heading mb-2">Overview</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{dest.overview}</p>
        </div>

        <Separator />

        {/* Moods & Seasons */}
        <div className="flex flex-wrap gap-1.5">
          {dest.mood.map((m) => (
            <Badge key={m} variant="secondary" className="capitalize text-xs">
              {m}
            </Badge>
          ))}
          {dest.season.map((s) => (
            <Badge key={s} variant="outline" className="capitalize text-xs">
              {s}
            </Badge>
          ))}
        </div>

        {/* Activities — now clickable to open in Google Maps */}
        <div>
          <h2 className="text-base font-bold font-heading mb-2">Top Activities</h2>
          <div className="space-y-2">
            {dest.activities.map((activity, i) => (
              <a
                key={i}
                href={getGoogleMapsUrl(activity, dest.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm flex-1">{activity}</span>
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>

        <Separator />

        {/* Nearby Attractions */}
        <div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowNearby(!showNearby)}
          >
            <MapPin className="h-4 w-4" />
            {showNearby ? "Hide" : "Explore"} Nearby Attractions
          </Button>

          {showNearby && (
            <div className="mt-3">
              <Suspense fallback={<MapFallback />}>
                <NearbyAttractions
                  destinationName={dest.name}
                  destinationLat={coords?.lat}
                  destinationLng={coords?.lng}
                />
              </Suspense>
            </div>
          )}
        </div>

        <Separator />

        {/* Local Tips */}
        <div>
          <h2 className="text-base font-bold font-heading mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-accent-foreground" /> Local Tips
          </h2>
          <ul className="space-y-1.5">
            {dest.tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button className="w-full" size="lg" onClick={() => navigate("/plan")}>
          Plan a Trip to {dest.name}
        </Button>
      </div>
    </div>
  );
};

export default Destination;
