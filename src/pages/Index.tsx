import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles, Compass, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { destinations } from "@/data/destinations";
import { useTrips } from "@/hooks/useTrips";

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: trips } = useTrips();
  const recentTrips = trips?.slice(0, 3) ?? [];

  const displayName = profile?.display_name || "Traveler";

  // Suggest destinations based on user's travel_style preferences
  const suggested = profile?.travel_style?.length
    ? destinations.filter((d) => d.mood.some((m) => profile.travel_style.includes(m))).slice(0, 4)
    : destinations.slice(0, 4);

  const quickActions = [
    { icon: Sparkles, label: "AI Coach", color: "bg-primary/10 text-primary", path: "/coach" },
    { icon: MapPin, label: "Plan Trip", color: "bg-secondary/10 text-secondary", path: "/plan" },
    { icon: Compass, label: "Discover", color: "bg-accent/20 text-accent-foreground", path: "/discover" },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold font-heading">
          Hello, {displayName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Where do you want to go today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(({ icon: Icon, label, color, path }) => (
          <Card
            key={label}
            className="cursor-pointer transition-all hover:shadow-md active:scale-95"
            onClick={() => navigate(path)}
          >
            <CardContent className="flex flex-col items-center gap-2 p-4">
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-heading">Recent Trips</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/trips")}>
            View all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {recentTrips.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No trips yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/plan")}>
                Plan your first trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTrips.map((trip) => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => navigate(`/itinerary/${trip.id}`)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  {trip.cover_image ? (
                    <img src={trip.cover_image} alt={trip.destination} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{trip.destination}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Destinations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-heading">Suggested for You</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/discover")}>
            See all <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {suggested.map((dest) => (
            <Card
              key={dest.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              onClick={() => navigate(`/destination/${dest.id}`)}
            >
              <div className="relative h-28">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-2 left-2.5">
                  <p className="text-sm font-bold text-white">{dest.name}</p>
                  <p className="text-[10px] text-white/80">{dest.tagline}</p>
                </div>
              </div>
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{dest.costEstimate.daily}/day</span>
                  <span className="text-[10px] font-medium text-primary">⭐ {dest.rating}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
