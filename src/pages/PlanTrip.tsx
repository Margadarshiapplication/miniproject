import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { CalendarIcon, MapPin, Users, Wallet, StickyNote, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateTrip } from "@/hooks/useTrips";
import { useAddActivity } from "@/hooks/useActivities";
import { useGenerateItinerary } from "@/hooks/useGenerateItinerary";
import { destinations } from "@/data/destinations";
import { toast } from "@/hooks/use-toast";

const PlanTrip = () => {
  const navigate = useNavigate();
  const createTrip = useCreateTrip();
  const addActivity = useAddActivity();
  const { generate, isGenerating } = useGenerateItinerary();

  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [travelers, setTravelers] = useState("1");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const handleDestinationSelect = (id: string) => {
    const dest = destinations.find((d) => d.id === id);
    if (dest) {
      setDestination(dest.name);
      setDestinationId(dest.id);
    }
  };

  const handleSubmit = async () => {
    if (!destination.trim()) {
      toast({ title: "Destination required", description: "Please enter a destination.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Dates required", description: "Please select start and end dates.", variant: "destructive" });
      return;
    }
    if (endDate < startDate) {
      toast({ title: "Invalid dates", description: "End date must be after start date.", variant: "destructive" });
      return;
    }

    try {
      const days = differenceInDays(endDate, startDate) + 1;
      const trip = await createTrip.mutateAsync({
        destination: destination.trim(),
        destination_id: destinationId,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        travelers: parseInt(travelers) || 1,
        budget: budget ? parseFloat(budget) : undefined,
        notes: notes.trim() || undefined,
        cover_image: destinationId ? destinations.find((d) => d.id === destinationId)?.image : undefined,
      });

      // Generate AI itinerary
      toast({ title: "Trip created!", description: "Generating AI itinerary..." });
      const itinerary = await generate({
        destination: destination.trim(),
        days,
        budget: budget ? parseFloat(budget) : undefined,
        travelers: parseInt(travelers) || 1,
        preferences: notes.trim() || undefined,
      });

      // Save generated activities
      if (itinerary?.activities) {
        for (let i = 0; i < itinerary.activities.length; i++) {
          const a = itinerary.activities[i];
          await addActivity.mutateAsync({
            trip_id: trip.id,
            day_number: a.day_number,
            time_slot: a.time_slot,
            title: a.title,
            description: a.description,
            location: a.location,
            estimated_cost: a.estimated_cost,
            photo_url: a.photo_url ?? null,
            sort_order: i,
          });
        }
        toast({ title: "Itinerary ready! ✨", description: `${itinerary.activities.length} activities generated.` });
      }

      navigate(`/itinerary/${trip.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create trip. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Plan a Trip</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your trip details to get started.</p>
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" /> Destination
        </Label>
        <Select onValueChange={handleDestinationSelect} value={destinationId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a popular destination" />
          </SelectTrigger>
          <SelectContent>
            {destinations.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} — {d.tagline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Or type a custom destination..."
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            setDestinationId(undefined);
          }}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(d) => d < (startDate || new Date())} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Travelers & Budget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" /> Travelers
          </Label>
          <Select value={travelers} onValueChange={setTravelers}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n === 1 ? "person" : "people"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="h-4 w-4 text-primary" /> Budget (₹)
          </Label>
          <Input type="number" placeholder="e.g. 25000" value={budget} onChange={(e) => setBudget(e.target.value)} min={0} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="h-4 w-4 text-primary" /> Notes (optional)
        </Label>
        <Textarea placeholder="Any preferences, must-visit places, or special requirements..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      {/* Preview Card */}
      {destination && startDate && endDate && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-bold text-primary">{destination}</p>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")} · {travelers} {parseInt(travelers) === 1 ? "traveler" : "travelers"}
              {budget && ` · ₹${parseInt(budget).toLocaleString()} budget`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={createTrip.isPending || isGenerating} className="w-full gap-2" size="lg">
        {createTrip.isPending || isGenerating ? (
          <><Loader2 className="h-4 w-4 animate-spin" />{isGenerating ? "Generating Itinerary..." : "Creating..."}</>
        ) : (
          <><Sparkles className="h-4 w-4" />Create Trip with AI Itinerary</>
        )}
      </Button>
    </div>
  );
};

export default PlanTrip;
