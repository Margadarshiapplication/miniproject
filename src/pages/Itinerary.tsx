import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, differenceInDays, addDays } from "date-fns";
import { ArrowLeft, Plus, MapPin, Clock, IndianRupee, CheckCircle2, Circle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTrip, useTripActivities, useAddActivity, useToggleActivity, type TripActivity } from "@/hooks/useTrips";
import { toast } from "@/hooks/use-toast";

const ActivityCard = ({ activity, tripId }: { activity: TripActivity; tripId: string }) => {
  const toggleActivity = useToggleActivity();

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all ${activity.is_completed ? "bg-muted/50 border-border" : "bg-card border-border"}`}
    >
      {activity.photo_url ? (
        <img
          src={activity.photo_url}
          alt={activity.title}
          className="h-[180px] w-full object-cover rounded-t-lg"
        />
      ) : null}
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={() => toggleActivity.mutate({ id: activity.id, is_completed: !activity.is_completed, trip_id: tripId })}
          className="mt-0.5 flex-shrink-0"
        >
          {activity.is_completed ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`text-sm font-medium ${activity.is_completed ? "line-through text-muted-foreground" : ""}`}>
            {activity.title}
          </p>
          {activity.description && (
            <p className="text-xs text-muted-foreground">{activity.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {activity.time_slot && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {activity.time_slot}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {activity.location}
              </span>
            )}
            {activity.estimated_cost > 0 && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> {activity.estimated_cost}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddActivityDialog = ({ tripId, dayNumber, onClose }: { tripId: string; dayNumber: number; onClose: () => void }) => {
  const addActivity = useAddActivity();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      await addActivity.mutateAsync({
        trip_id: tripId,
        day_number: dayNumber,
        title: title.trim(),
        description: description.trim() || undefined,
        time_slot: timeSlot.trim() || undefined,
        location: location.trim() || undefined,
        estimated_cost: cost ? parseFloat(cost) : undefined,
      });
      toast({ title: "Activity added" });
      onClose();
    } catch {
      toast({ title: "Failed to add activity", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Activity Title *</Label>
        <Input placeholder="e.g. Visit Hawa Mahal" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea placeholder="Details about this activity..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Time</Label>
          <Input placeholder="e.g. 9:00 AM" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cost (₹)</Label>
          <Input type="number" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input placeholder="e.g. Old City" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <Button onClick={handleAdd} disabled={addActivity.isPending || !title.trim()} className="w-full">
        {addActivity.isPending ? "Adding..." : "Add Activity"}
      </Button>
    </div>
  );
};

const Itinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: activities } = useTripActivities(id);
  const [dialogDay, setDialogDay] = useState<number | null>(null);

  if (tripLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/trips")}>Back to Trips</Button>
      </div>
    );
  }

  const totalDays = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;
  const totalCost = activities?.reduce((sum, a) => sum + Number(a.estimated_cost || 0), 0) ?? 0;

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-heading">{trip.destination}</h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")} · {totalDays} days
          </p>
        </div>
      </div>

      {/* Cover */}
      {trip.cover_image && (
        <div className="rounded-xl overflow-hidden h-40 relative">
          <img src={trip.cover_image} alt={trip.destination} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">{trip.travelers}</p>
            <p className="text-[10px] text-muted-foreground">Travelers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">₹{totalCost.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Est. Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-primary">{activities?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Activities</p>
          </CardContent>
        </Card>
      </div>

      {trip.budget && (
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-medium">₹{Number(trip.budget).toLocaleString()}</span>
        </div>
      )}

      {/* Day-by-day Timeline */}
      <Tabs defaultValue="1">
        <TabsList className="w-full overflow-x-auto flex">
          {Array.from({ length: totalDays }, (_, i) => (
            <TabsTrigger key={i + 1} value={String(i + 1)} className="flex-shrink-0 text-xs">
              Day {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {Array.from({ length: totalDays }, (_, i) => {
          const dayNum = i + 1;
          const dayActivities = activities?.filter((a) => a.day_number === dayNum) ?? [];
          const dayDate = addDays(new Date(trip.start_date), i);

          return (
            <TabsContent key={dayNum} value={String(dayNum)} className="space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{format(dayDate, "EEE, MMM d")}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{dayActivities.length} activities</Badge>
              </div>

              {dayActivities.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No activities planned</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {dayActivities.map((a) => (
                    <ActivityCard key={a.id} activity={a} tripId={trip.id} />
                  ))}
                </div>
              )}

              <Dialog open={dialogDay === dayNum} onOpenChange={(open) => setDialogDay(open ? dayNum : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                    <Plus className="h-3 w-3" /> Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Activity — Day {dayNum}</DialogTitle>
                  </DialogHeader>
                  <AddActivityDialog tripId={trip.id} dayNumber={dayNum} onClose={() => setDialogDay(null)} />
                </DialogContent>
              </Dialog>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={() => navigate(`/prepare/${trip.id}`)}>
          Prepare Trip
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => navigate("/trips")}>
          My Trips
        </Button>
      </div>
    </div>
  );
};

export default Itinerary;
