import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { MapPin, Calendar, Users, Plus, MoreVertical, Trash2, Eye, CheckCircle2, Clock, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTrips, useDeleteTrip, useUpdateTrip, type Trip } from "@/hooks/useTrips";
import { toast } from "@/hooks/use-toast";

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "bg-muted text-muted-foreground" },
  planned: { label: "Planned", icon: Calendar, color: "bg-primary/10 text-primary" },
  ongoing: { label: "Ongoing", icon: Plane, color: "bg-secondary/10 text-secondary" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", icon: Trash2, color: "bg-destructive/10 text-destructive" },
};

const TripCard = ({ trip }: { trip: Trip }) => {
  const navigate = useNavigate();
  const deleteTrip = useDeleteTrip();
  const updateTrip = useUpdateTrip();
  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;
  const status = statusConfig[trip.status];
  const StatusIcon = status.icon;

  const handleDelete = async () => {
    try {
      await deleteTrip.mutateAsync(trip.id);
      toast({ title: "Trip deleted" });
    } catch {
      toast({ title: "Error deleting trip", variant: "destructive" });
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateTrip.mutateAsync({ id: trip.id, status: "completed" });
      toast({ title: "Trip marked as completed" });
    } catch {
      toast({ title: "Error updating trip", variant: "destructive" });
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all">
      {trip.cover_image && (
        <div className="relative h-32">
          <img src={trip.cover_image} alt={trip.destination} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <p className="text-base font-bold text-white">{trip.destination}</p>
          </div>
          <div className="absolute top-2 right-2">
            <Badge className={`${status.color} text-[10px] border-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>
      )}
      <CardContent className="p-3 space-y-2">
        {!trip.cover_image && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-bold">{trip.destination}</span>
            </div>
            <Badge className={`${status.color} text-[10px] border-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d")}
          </span>
          <span>{days} {days === 1 ? "day" : "days"}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {trip.travelers}
          </span>
        </div>
        {trip.budget && (
          <p className="text-xs font-medium text-primary">₹{Number(trip.budget).toLocaleString()} budget</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => navigate(`/itinerary/${trip.id}`)}>
              <Eye className="h-3 w-3 mr-1" /> View
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => navigate(`/prepare/${trip.id}`)}>
              Prepare
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {trip.status !== "completed" && (
                <DropdownMenuItem onClick={handleMarkComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

const Trips = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const { data: trips, isLoading } = useTrips();

  const filtered = trips?.filter((t) => {
    if (tab === "all") return true;
    if (tab === "upcoming") return t.status === "planned" && isFuture(new Date(t.start_date));
    if (tab === "past") return t.status === "completed" || isPast(new Date(t.end_date));
    return t.status === tab;
  }) ?? [];

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Trips</h1>
          <p className="text-sm text-muted-foreground">{trips?.length ?? 0} trips total</p>
        </div>
        <Button size="sm" onClick={() => navigate("/plan")} className="gap-1">
          <Plus className="h-4 w-4" /> New Trip
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 text-xs">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="flex-1 text-xs">Past</TabsTrigger>
          <TabsTrigger value="draft" className="flex-1 text-xs">Drafts</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No trips found</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/plan")}>
              Plan your first trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Trips;
