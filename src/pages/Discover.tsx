import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shuffle, Heart, Star, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { destinations, moods, seasons } from "@/data/destinations";

const budgetOptions = [
  { id: "budget", label: "Budget 💰" },
  { id: "moderate", label: "Moderate 💳" },
  { id: "luxury", label: "Luxury 💎" },
];

const Discover = () => {
  const navigate = useNavigate();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const toggleMood = (id: string) =>
    setSelectedMoods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const toggleWishlist = (id: string) =>
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    let results = destinations;
    if (selectedMoods.length) results = results.filter((d) => d.mood.some((m) => selectedMoods.includes(m)));
    if (selectedSeason) results = results.filter((d) => d.season.includes(selectedSeason));
    if (selectedBudget) results = results.filter((d) => d.budget === selectedBudget);
    return results;
  }, [selectedMoods, selectedSeason, selectedBudget]);

  const surpriseMe = () => {
    const random = destinations[Math.floor(Math.random() * destinations.length)];
    navigate(`/destination/${random.id}`);
  };

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Discover</h1>
          <p className="text-sm text-muted-foreground">Explore by mood, season, or budget</p>
        </div>
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={surpriseMe}>
          <Shuffle className="h-4 w-4" /> Surprise Me
        </Button>
      </div>

      {/* Mood Selector */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">How are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMood(m.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border ${
                selectedMoods.includes(m.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter toggle */}
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowFilters(!showFilters)}>
        <Filter className="h-3.5 w-3.5" /> {showFilters ? "Hide" : "More"} Filters
      </Button>

      {showFilters && (
        <div className="space-y-3 animate-fade-in">
          {/* Season */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Season</p>
            <div className="flex flex-wrap gap-2">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(selectedSeason === s ? null : s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all border ${
                    selectedSeason === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Budget */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget</p>
            <div className="flex flex-wrap gap-2">
              {budgetOptions.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBudget(selectedBudget === b.id ? null : b.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                    selectedBudget === b.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} destination{filtered.length !== 1 && "s"} found
      </p>

      {/* Destination Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No destinations match your filters</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSelectedMoods([]);
                  setSelectedSeason(null);
                  setSelectedBudget(null);
                }}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((dest) => (
            <Card
              key={dest.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
              onClick={() => navigate(`/destination/${dest.id}`)}
            >
              <div className="relative h-40">
                <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <button
                  className="absolute top-2.5 right-2.5 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(dest.id);
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${wishlist.has(dest.id) ? "fill-secondary text-secondary" : "text-muted-foreground"}`}
                  />
                </button>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-lg font-bold text-white">{dest.name}</p>
                  <p className="text-xs text-white/80">{dest.tagline}</p>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{dest.costEstimate.daily}/day</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Star className="h-3 w-3 fill-primary" /> {dest.rating}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dest.mood.slice(0, 3).map((m) => (
                    <Badge key={m} variant="secondary" className="text-[10px] capitalize px-2 py-0">
                      {m}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Discover;
